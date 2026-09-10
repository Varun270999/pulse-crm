import { requireRole } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { PaymentForm, type OutstandingInvoiceOption } from '@/components/payments/payment-form';

export const metadata = {
  title: 'Record Payment | Pulse CRM',
};

interface NewPaymentPageProps {
  searchParams?: {
    invoiceId?: string;
  };
}

export default async function NewPaymentPage({ searchParams }: NewPaymentPageProps) {
  await requireRole(['ADMIN', 'MANAGER', 'SALES_EXECUTIVE']);

  const rawInvoices = await prisma.invoice.findMany({
    where: {
      status: {
        in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'],
      },
    },
    include: {
      client: {
        select: {
          id: true,
          companyName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const outstandingInvoices: OutstandingInvoiceOption[] = rawInvoices
    .map((inv) => {
      const totalAmount = Number(inv.totalAmount);
      const paidAmount = Number(inv.paidAmount);
      const balanceDue = Math.max(0, Math.round((totalAmount - paidAmount) * 100) / 100);

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        issueDate: inv.issueDate.toISOString(),
        dueDate: inv.dueDate.toISOString(),
        totalAmount,
        paidAmount,
        balanceDue,
        status: inv.status,
        client: inv.client,
      };
    })
    .filter((inv) => inv.balanceDue > 0);

  return (
    <div className="py-2">
      <PaymentForm
        invoices={outstandingInvoices}
        preselectedInvoiceId={searchParams?.invoiceId}
      />
    </div>
  );
}
