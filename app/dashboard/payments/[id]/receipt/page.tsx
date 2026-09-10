import { notFound } from 'next/navigation';
import { requireRole, ALL_ROLES } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { PaymentReceiptView } from '@/components/payments/payment-receipt-view';
import type { PaymentData, PaymentMethodType } from '@/types/payment';

export const metadata = {
  title: 'Payment Receipt | Pulse CRM',
};

interface PaymentReceiptPageProps {
  params: {
    id: string;
  };
}

export default async function PaymentReceiptPage({ params }: PaymentReceiptPageProps) {
  await requireRole(ALL_ROLES);

  const rawPayment = await prisma.payment.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      invoice: {
        include: {
          payments: {
            orderBy: { createdAt: 'asc' },
            select: { id: true, amount: true, createdAt: true },
          },
        },
      },
      recordedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!rawPayment) {
    notFound();
  }

  // Calculate previously paid before this transaction
  const earlierPayments = rawPayment.invoice.payments.filter(
    (p) => new Date(p.createdAt) < new Date(rawPayment.createdAt)
  );
  const previouslyPaid = earlierPayments.reduce(
    (acc, p) => acc + Number(p.amount),
    0
  );

  const invoiceTotal = Number(rawPayment.invoice.totalAmount);
  const currentPaid = Number(rawPayment.amount);
  const remainingBalance = Math.max(
    0,
    Math.round((invoiceTotal - (previouslyPaid + currentPaid)) * 100) / 100
  );

  const serializedPayment: PaymentData = {
    id: rawPayment.id,
    receiptNumber: rawPayment.receiptNumber,
    invoiceId: rawPayment.invoiceId,
    clientId: rawPayment.clientId,
    amount: currentPaid,
    paymentMethod: rawPayment.paymentMethod as PaymentMethodType,
    paymentDate: rawPayment.paymentDate.toISOString(),
    referenceNumber: rawPayment.referenceNumber,
    notes: rawPayment.notes,
    recordedById: rawPayment.recordedById,
    createdAt: rawPayment.createdAt.toISOString(),
    client: {
      id: rawPayment.client.id,
      companyName: rawPayment.client.companyName,
      email: rawPayment.client.email,
      phone: rawPayment.client.phone,
      addressLine: rawPayment.client.addressLine,
      city: rawPayment.client.city,
      state: rawPayment.client.state,
      postalCode: rawPayment.client.postalCode,
      country: rawPayment.client.country,
    },
    invoice: {
      id: rawPayment.invoice.id,
      invoiceNumber: rawPayment.invoice.invoiceNumber,
      totalAmount: invoiceTotal,
      paidAmount: Number(rawPayment.invoice.paidAmount),
      status: rawPayment.invoice.status,
      dueDate: rawPayment.invoice.dueDate.toISOString(),
      issueDate: rawPayment.invoice.issueDate.toISOString(),
    },
    recordedBy: rawPayment.recordedBy,
  };

  return (
    <div className="py-2">
      <PaymentReceiptView
        payment={serializedPayment}
        previouslyPaid={previouslyPaid}
        remainingBalance={remainingBalance}
      />
    </div>
  );
}
