'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { createNotification } from '@/lib/notifications';
import { executeAction } from '@/lib/actionWrapper';
import { logActivity } from '@/lib/activityLog';
import type { InvoiceStatusType } from '@/types/billing';
import {
  recordPaymentSchema,
  updatePaymentSchema,
  deletePaymentSchema,
  type RecordPaymentInput,
  type UpdatePaymentInput,
  type DeletePaymentInput,
} from '@/lib/schemas/payment';

/**
 * Generate sequential receipt number in format "RCPT-0001", "RCPT-0002", etc.
 */
async function generateReceiptNumber(tx: Prisma.TransactionClient): Promise<string> {
  const lastPayment = await tx.payment.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { receiptNumber: true },
  });

  let nextNum = 1;
  if (lastPayment?.receiptNumber) {
    const match = lastPayment.receiptNumber.match(/RCPT-(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  } else {
    const count = await tx.payment.count();
    nextNum = count + 1;
  }

  return `RCPT-${String(nextNum).padStart(4, '0')}`;
}

/**
 * Atomically recalculates invoice paidAmount and status based on sum of related payments
 */
export async function recalculateInvoiceWithinTx(
  tx: Prisma.TransactionClient,
  invoiceId: string
) {
  const payments = await tx.payment.findMany({
    where: { invoiceId },
    select: { amount: true },
  });

  const invoice = await tx.invoice.findUnique({
    where: { id: invoiceId },
    select: { id: true, totalAmount: true, status: true, dueDate: true },
  });

  if (!invoice) return;

  const totalPaid = payments.reduce((acc, p) => acc + Number(p.amount), 0);
  const roundedPaid = Math.round(totalPaid * 100) / 100;
  const totalAmount = Number(invoice.totalAmount);
  const isPastDue = new Date(invoice.dueDate) < new Date();

  let newStatus: InvoiceStatusType = invoice.status as InvoiceStatusType;

  // Preserve CANCELLED status unless explicitly revived
  if (invoice.status !== 'CANCELLED') {
    if (roundedPaid >= totalAmount) {
      newStatus = 'PAID';
    } else if (roundedPaid > 0) {
      newStatus = isPastDue ? 'OVERDUE' : 'PARTIALLY_PAID';
    } else {
      // roundedPaid === 0
      if (invoice.status === 'PAID' || invoice.status === 'PARTIALLY_PAID') {
        newStatus = isPastDue ? 'OVERDUE' : 'SENT';
      } else if (isPastDue && invoice.status === 'SENT') {
        newStatus = 'OVERDUE';
      }
    }
  }

  await tx.invoice.update({
    where: { id: invoiceId },
    data: {
      paidAmount: roundedPaid,
      status: newStatus,
    },
  });

  return { paidAmount: roundedPaid, status: newStatus };
}

/**
 * Record a new payment against an invoice
 */
export async function recordPaymentAction(rawInput: RecordPaymentInput) {
  return executeAction('recordPaymentAction', async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to record a payment.' };
    }

    if (session.user.role === 'SUPPORT_AGENT') {
      return { error: 'Access denied: Support agents cannot record payments.' };
    }

    const parsed = recordPaymentSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || 'Invalid payment data.' };
    }

    const { invoiceId, amount, paymentMethod, paymentDate, referenceNumber, notes } =
      parsed.data;

    // Run transaction
    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          payments: {
            select: { amount: true },
          },
        },
      });

      if (!invoice) {
        throw new Error('Invoice not found.');
      }

      if (invoice.status === 'CANCELLED') {
        throw new Error('Cannot record payments against a cancelled invoice.');
      }

      // Compute existing payments sum
      const currentPaid = invoice.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      const totalAmount = Number(invoice.totalAmount);
      const remainingBalance = Math.max(
        0,
        Math.round((totalAmount - currentPaid) * 100) / 100
      );

      // Overpayment protection check
      if (amount > remainingBalance) {
        throw new Error(
          `Amount exceeds remaining balance of ₹${remainingBalance.toLocaleString('en-IN')}`
        );
      }

      const receiptNumber = await generateReceiptNumber(tx);

      const payment = await tx.payment.create({
        data: {
          receiptNumber,
          invoiceId: invoice.id,
          clientId: invoice.clientId,
          amount,
          paymentMethod,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          referenceNumber: referenceNumber?.trim() || null,
          notes: notes?.trim() || null,
          recordedById: session.user.id,
        },
      });

      const updated = await recalculateInvoiceWithinTx(tx, invoice.id);

      return {
        paymentId: payment.id,
        receiptNumber,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceCreatedById: invoice.createdById,
        clientId: invoice.clientId,
        newPaidAmount: updated?.paidAmount,
        newStatus: updated?.status,
      };
    });

    if (result.invoiceCreatedById) {
      await createNotification({
        userId: result.invoiceCreatedById,
        type: 'PAYMENT_RECEIVED',
        title: 'Payment Received',
        message: `Payment of ₹${amount.toLocaleString('en-IN')} received for ${result.invoiceNumber}`,
        linkUrl: `/dashboard/invoices/${result.invoiceId}`,
      });
    }

    logActivity({
      userId: session.user.id,
      action: 'PAYMENT_RECORDED',
      entityType: 'Payment',
      entityId: result.paymentId,
      description: `Recorded payment of ₹${amount} (${result.receiptNumber}) for invoice ${result.invoiceNumber}`,
    });

    revalidatePath('/dashboard/payments');
    revalidatePath('/dashboard/invoices');
    revalidatePath(`/dashboard/invoices/${result.invoiceId}`);
    revalidatePath(`/dashboard/clients/${result.clientId}`);
    revalidatePath('/dashboard');

    return {
      success: true,
      paymentId: result.paymentId,
      receiptNumber: result.receiptNumber,
      invoiceId: result.invoiceId,
    };
  });
}

/**
 * Edit an existing payment (ADMIN and MANAGER only)
 */
export async function updatePaymentAction(rawInput: UpdatePaymentInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to edit payments.' };
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return { error: 'Access denied: Only Admins and Managers can edit payments.' };
    }

    const parsed = updatePaymentSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || 'Invalid payment update data.' };
    }

    const { id, amount, paymentMethod, paymentDate, referenceNumber, notes } =
      parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id },
        include: {
          invoice: {
            include: {
              payments: true,
            },
          },
        },
      });

      if (!payment) {
        throw new Error('Payment record not found.');
      }

      // Sum of other payments on this invoice
      const otherPaymentsSum = payment.invoice.payments
        .filter((p) => p.id !== payment.id)
        .reduce((sum, p) => sum + Number(p.amount), 0);

      const totalAmount = Number(payment.invoice.totalAmount);
      const remainingBalanceAllowed = Math.max(
        0,
        Math.round((totalAmount - otherPaymentsSum) * 100) / 100
      );

      if (amount > remainingBalanceAllowed) {
        throw new Error(
          `Amount exceeds remaining balance of ₹${remainingBalanceAllowed.toLocaleString('en-IN')}`
        );
      }

      await tx.payment.update({
        where: { id },
        data: {
          amount,
          paymentMethod,
          paymentDate: paymentDate ? new Date(paymentDate) : undefined,
          referenceNumber: referenceNumber?.trim() || null,
          notes: notes?.trim() || null,
        },
      });

      const updated = await recalculateInvoiceWithinTx(tx, payment.invoiceId);

      return {
        paymentId: payment.id,
        invoiceId: payment.invoiceId,
        clientId: payment.clientId,
        newPaidAmount: updated?.paidAmount,
        newStatus: updated?.status,
      };
    });

    revalidatePath('/dashboard/payments');
    revalidatePath('/dashboard/invoices');
    revalidatePath(`/dashboard/invoices/${result.invoiceId}`);
    revalidatePath(`/dashboard/clients/${result.clientId}`);
    revalidatePath('/dashboard');

    return { success: true };
  } catch (err: unknown) {
    console.error('Failed to update payment:', err);
    const msg =
      err instanceof Error ? err.message : 'An unexpected error occurred while updating payment.';
    return { error: msg };
  }
}

/**
 * Delete an existing payment (ADMIN and MANAGER only)
 */
export async function deletePaymentAction(rawInput: DeletePaymentInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to delete payments.' };
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return { error: 'Access denied: Only Admins and Managers can delete payments.' };
    }

    const parsed = deletePaymentSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || 'Invalid payment delete request.' };
    }

    const { id } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id },
        select: {
          id: true,
          invoiceId: true,
          clientId: true,
          receiptNumber: true,
          amount: true,
        },
      });

      if (!payment) {
        throw new Error('Payment record not found.');
      }

      await tx.payment.delete({
        where: { id },
      });

      const updated = await recalculateInvoiceWithinTx(tx, payment.invoiceId);

      return {
        invoiceId: payment.invoiceId,
        clientId: payment.clientId,
        receiptNumber: payment.receiptNumber,
        newPaidAmount: updated?.paidAmount,
        newStatus: updated?.status,
      };
    });

    logActivity({
      userId: session.user.id,
      action: 'PAYMENT_DELETED',
      entityType: 'Payment',
      entityId: id,
      description: `Deleted payment receipt ${result.receiptNumber}`,
    });

    revalidatePath('/dashboard/payments');
    revalidatePath('/dashboard/invoices');
    revalidatePath(`/dashboard/invoices/${result.invoiceId}`);
    revalidatePath(`/dashboard/clients/${result.clientId}`);
    revalidatePath('/dashboard');

    return { success: true, receiptNumber: result.receiptNumber };
  } catch (err: unknown) {
    console.error('Failed to delete payment:', err);
    const msg =
      err instanceof Error ? err.message : 'An unexpected error occurred while deleting payment.';
    return { error: msg };
  }
}

/**
 * Helper to fetch outstanding invoices for the standalone payment creation dropdown
 */
export async function getOutstandingInvoicesAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { invoices: [], error: 'Not authenticated.' };
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        status: {
          in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'],
        },
      },
      select: {
        id: true,
        invoiceNumber: true,
        issueDate: true,
        dueDate: true,
        totalAmount: true,
        paidAmount: true,
        status: true,
        client: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const outstanding = invoices
      .map((inv) => {
        const total = Number(inv.totalAmount);
        const paid = Number(inv.paidAmount);
        const balanceDue = Math.max(0, Math.round((total - paid) * 100) / 100);
        return {
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          issueDate: inv.issueDate.toISOString(),
          dueDate: inv.dueDate.toISOString(),
          totalAmount: total,
          paidAmount: paid,
          balanceDue,
          status: inv.status,
          client: inv.client,
        };
      })
      .filter((inv) => inv.balanceDue > 0);

    return { invoices: outstanding };
  } catch (err) {
    console.error('Failed to fetch outstanding invoices:', err);
    return { invoices: [], error: 'Failed to fetch invoices.' };
  }
}
