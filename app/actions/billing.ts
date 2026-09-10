'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  quotationSchema,
  invoiceSchema,
  type QuotationInput,
  type InvoiceInput,
  type RecordPaymentInput,
} from '@/lib/schemas/billing';
import type { QuotationStatusType, InvoiceStatusType } from '@/types/billing';
import { revalidatePath } from 'next/cache';
import { executeAction } from '@/lib/actionWrapper';
import { logActivity } from '@/lib/activityLog';

/**
 * Generate next sequential quotation number: "QT-0001", "QT-0002"...
 */
async function getNextQuotationNumber(): Promise<string> {
  const last = await prisma.quotation.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { quotationNumber: true },
  });

  if (!last || !last.quotationNumber) {
    return 'QT-0001';
  }

  const match = last.quotationNumber.match(/QT-(\d+)/);
  if (!match) {
    const count = await prisma.quotation.count();
    return `QT-${String(count + 1).padStart(4, '0')}`;
  }

  const nextNum = parseInt(match[1], 10) + 1;
  return `QT-${String(nextNum).padStart(4, '0')}`;
}

/**
 * Generate next sequential invoice number: "INV-0001", "INV-0002"...
 */
async function getNextInvoiceNumber(): Promise<string> {
  const last = await prisma.invoice.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { invoiceNumber: true },
  });

  if (!last || !last.invoiceNumber) {
    return 'INV-0001';
  }

  const match = last.invoiceNumber.match(/INV-(\d+)/);
  if (!match) {
    const count = await prisma.invoice.count();
    return `INV-${String(count + 1).padStart(4, '0')}`;
  }

  const nextNum = parseInt(match[1], 10) + 1;
  return `INV-${String(nextNum).padStart(4, '0')}`;
}

/**
 * Compute financial totals from line items, tax percentage, and discount percentage
 */
function computeTotals(
  items: { description: string; quantity: number; unitPrice: number }[],
  taxPercent: number,
  discountPercent: number
) {
  let subtotal = 0;
  const processedItems = items.map((item, idx) => {
    const qty = Number(item.quantity);
    const price = Number(item.unitPrice);
    const amount = Math.round(qty * price * 100) / 100;
    subtotal += amount;
    return {
      ...item,
      quantity: qty,
      unitPrice: price,
      amount,
      sortOrder: idx,
    };
  });

  subtotal = Math.round(subtotal * 100) / 100;
  const discountAmount = Math.round(subtotal * (discountPercent / 100) * 100) / 100;
  const taxableBase = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(taxableBase * (taxPercent / 100) * 100) / 100;
  const totalAmount = Math.round((taxableBase + taxAmount) * 100) / 100;

  return {
    items: processedItems,
    subtotal,
    discountAmount,
    taxAmount,
    totalAmount,
  };
}

/* ========================================================================= */
/*                              QUOTATION ACTIONS                            */
/* ========================================================================= */

export async function createQuotationAction(rawInput: QuotationInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to create a quotation.' };
    }

    if (session.user.role === 'SUPPORT_AGENT') {
      return { error: 'Access denied: Support agents cannot create quotations.' };
    }

    const parsed = quotationSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || 'Invalid quotation data' };
    }

    const data = parsed.data;

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
    });
    if (!client) {
      return { error: 'The selected client does not exist.' };
    }

    const quotationNumber = await getNextQuotationNumber();
    const financial = computeTotals(data.items, data.taxPercent, data.discountPercent);

    const quotation = await prisma.$transaction(async (tx) => {
      const quote = await tx.quotation.create({
        data: {
          quotationNumber,
          clientId: data.clientId,
          dealId: data.dealId || null,
          status: 'DRAFT',
          issueDate: new Date(data.issueDate),
          validUntil: data.validUntil ? new Date(data.validUntil) : null,
          subtotal: financial.subtotal,
          taxPercent: data.taxPercent,
          taxAmount: financial.taxAmount,
          discountPercent: data.discountPercent,
          discountAmount: financial.discountAmount,
          totalAmount: financial.totalAmount,
          notes: data.notes ? data.notes.trim() : null,
          termsAndConditions: data.termsAndConditions ? data.termsAndConditions.trim() : null,
          createdById: session.user.id,
        },
      });

      for (const item of financial.items) {
        await tx.quotationItem.create({
          data: {
            quotationId: quote.id,
            description: item.description.trim(),
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
            sortOrder: item.sortOrder,
          },
        });
      }

      return quote;
    });

    revalidatePath('/dashboard/invoices');
    revalidatePath(`/dashboard/clients/${data.clientId}`);

    return { success: true, quotationId: quotation.id, quotationNumber };
  } catch (err) {
    console.error('Failed to create quotation:', err);
    return { error: 'An unexpected database error occurred while creating the quotation.' };
  }
}

export async function updateQuotationStatusAction(id: string, status: QuotationStatusType) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to update quotation status.' };
    }

    if (session.user.role === 'SUPPORT_AGENT') {
      return { error: 'Access denied: Support agents cannot update quotations.' };
    }

    const quote = await prisma.quotation.findUnique({
      where: { id },
    });

    if (!quote) {
      return { error: 'Quotation not found.' };
    }

    await prisma.quotation.update({
      where: { id },
      data: { status },
    });

    revalidatePath('/dashboard/invoices');
    revalidatePath(`/dashboard/quotations/${id}`);

    return { success: true };
  } catch (err) {
    console.error('Failed to update quotation status:', err);
    return { error: 'An error occurred while updating the quotation status.' };
  }
}

export async function convertQuotationToInvoiceAction(quotationId: string, customDueDate?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to convert a quotation.' };
    }

    if (session.user.role === 'SUPPORT_AGENT') {
      return { error: 'Access denied: Support agents cannot convert quotations.' };
    }

    const quote = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!quote) {
      return { error: 'Quotation not found.' };
    }

    const invoiceNumber = await getNextInvoiceNumber();

    // Default due date: 15 days from now if not specified
    const dueDate = customDueDate
      ? new Date(customDueDate)
      : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    const invoice = await prisma.$transaction(async (tx) => {
      // 1. Create Invoice
      const inv = await tx.invoice.create({
        data: {
          invoiceNumber,
          clientId: quote.clientId,
          quotationId: quote.id,
          dealId: quote.dealId,
          status: 'SENT',
          issueDate: new Date(),
          dueDate,
          subtotal: quote.subtotal,
          taxPercent: quote.taxPercent,
          taxAmount: quote.taxAmount,
          discountPercent: quote.discountPercent,
          discountAmount: quote.discountAmount,
          totalAmount: quote.totalAmount,
          paidAmount: 0,
          notes: quote.notes,
          termsAndConditions: quote.termsAndConditions,
          createdById: session.user.id,
        },
      });

      // 2. Clone Line Items
      for (const item of quote.items) {
        await tx.invoiceItem.create({
          data: {
            invoiceId: inv.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
            sortOrder: item.sortOrder,
          },
        });
      }

      // 3. Mark Quotation as ACCEPTED
      await tx.quotation.update({
        where: { id: quotationId },
        data: { status: 'ACCEPTED' },
      });

      return inv;
    });

    revalidatePath('/dashboard/invoices');
    revalidatePath(`/dashboard/quotations/${quotationId}`);
    revalidatePath(`/dashboard/clients/${quote.clientId}`);
    revalidatePath('/dashboard');

    return { success: true, invoiceId: invoice.id, invoiceNumber };
  } catch (err) {
    console.error('Failed to convert quotation to invoice:', err);
    return { error: 'An unexpected database error occurred while converting quotation to invoice.' };
  }
}

export async function deleteQuotationAction(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to delete a quotation.' };
    }

    if (session.user.role === 'SUPPORT_AGENT') {
      return { error: 'Access denied: Support agents cannot delete quotations.' };
    }

    const quote = await prisma.quotation.findUnique({
      where: { id },
    });

    if (!quote) {
      return { error: 'Quotation not found.' };
    }

    await prisma.quotation.delete({
      where: { id },
    });

    revalidatePath('/dashboard/invoices');
    revalidatePath(`/dashboard/clients/${quote.clientId}`);

    return { success: true };
  } catch (err) {
    console.error('Failed to delete quotation:', err);
    return { error: 'An unexpected database error occurred while deleting the quotation.' };
  }
}

/* ========================================================================= */
/*                                INVOICE ACTIONS                            */
/* ========================================================================= */

export async function createInvoiceAction(rawInput: InvoiceInput) {
  return executeAction('createInvoiceAction', async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to create an invoice.' };
    }

    if (session.user.role === 'SUPPORT_AGENT') {
      return { error: 'Access denied: Support agents cannot create invoices.' };
    }

    const parsed = invoiceSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || 'Invalid invoice data' };
    }

    const data = parsed.data;

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
    });
    if (!client) {
      return { error: 'The selected client does not exist.' };
    }

    const invoiceNumber = await getNextInvoiceNumber();
    const financial = computeTotals(data.items, data.taxPercent, data.discountPercent);

    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          invoiceNumber,
          clientId: data.clientId,
          quotationId: data.quotationId || null,
          dealId: data.dealId || null,
          status: 'DRAFT',
          issueDate: new Date(data.issueDate),
          dueDate: new Date(data.dueDate),
          subtotal: financial.subtotal,
          taxPercent: data.taxPercent,
          taxAmount: financial.taxAmount,
          discountPercent: data.discountPercent,
          discountAmount: financial.discountAmount,
          totalAmount: financial.totalAmount,
          paidAmount: 0,
          notes: data.notes ? data.notes.trim() : null,
          termsAndConditions: data.termsAndConditions ? data.termsAndConditions.trim() : null,
          createdById: session.user.id,
        },
      });

      for (const item of financial.items) {
        await tx.invoiceItem.create({
          data: {
            invoiceId: inv.id,
            description: item.description.trim(),
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
            sortOrder: item.sortOrder,
          },
        });
      }

      return inv;
    });

    logActivity({
      userId: session.user.id,
      action: 'INVOICE_CREATED',
      entityType: 'Invoice',
      entityId: invoice.id,
      description: `Created invoice ${invoiceNumber} (₹${financial.totalAmount})`,
    });

    revalidatePath('/dashboard/invoices');
    revalidatePath(`/dashboard/clients/${data.clientId}`);
    revalidatePath('/dashboard');

    return { success: true, invoiceId: invoice.id, invoiceNumber };
  });
}

import { recordPaymentAction } from './payments';

export async function recordInvoicePaymentAction(rawInput: RecordPaymentInput) {
  return recordPaymentAction({
    invoiceId: rawInput.invoiceId,
    amount: Number(rawInput.amount),
    paymentMethod: 'BANK_TRANSFER',
    notes: rawInput.notes,
  });
}

export async function updateInvoiceStatusAction(id: string, status: InvoiceStatusType) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to update invoice status.' };
    }

    if (session.user.role === 'SUPPORT_AGENT') {
      return { error: 'Access denied: Support agents cannot update invoices.' };
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return { error: 'Invoice not found.' };
    }

    await prisma.invoice.update({
      where: { id },
      data: { status },
    });

    revalidatePath('/dashboard/invoices');
    revalidatePath(`/dashboard/invoices/${id}`);
    revalidatePath('/dashboard');

    return { success: true };
  } catch (err) {
    console.error('Failed to update invoice status:', err);
    return { error: 'An unexpected error occurred while updating the invoice status.' };
  }
}

export async function deleteInvoiceAction(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to delete an invoice.' };
    }

    if (session.user.role === 'SUPPORT_AGENT') {
      return { error: 'Access denied: Support agents cannot delete invoices.' };
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return { error: 'Invoice not found.' };
    }

    await prisma.invoice.delete({
      where: { id },
    });

    logActivity({
      userId: session.user.id,
      action: 'INVOICE_DELETED',
      entityType: 'Invoice',
      entityId: id,
      description: `Deleted invoice ${invoice.invoiceNumber}`,
    });

    revalidatePath('/dashboard/invoices');
    revalidatePath(`/dashboard/clients/${invoice.clientId}`);
    revalidatePath('/dashboard');

    return { success: true };
  } catch (err) {
    console.error('Failed to delete invoice:', err);
    return { error: 'An unexpected database error occurred while deleting the invoice.' };
  }
}
