import { requireRole, ALL_ROLES, type UserRole } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { PaymentStatsCards } from '@/components/payments/payment-stats-cards';
import { PaymentTable } from '@/components/payments/payment-table';
import type { PaymentData, PaymentStats, PaymentMethodType } from '@/types/payment';

export const metadata = {
  title: 'Payments | Pulse CRM',
};

export default async function PaymentsPage() {
  const session = await requireRole(ALL_ROLES);

  // Fetch payments with relations and clients in parallel
  const [rawPayments, clients] = await Promise.all([
    prisma.payment.findMany({
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            email: true,
            phone: true,
            addressLine: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            paidAmount: true,
            status: true,
            dueDate: true,
            issueDate: true,
          },
        },
        recordedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.client.findMany({
      select: {
        id: true,
        companyName: true,
      },
      orderBy: { companyName: 'asc' },
    }),
  ]);

  // Calculate current month date range
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  let totalCollectedAllTime = 0;
  let totalCollectedThisMonth = 0;

  const serializedPayments: PaymentData[] = rawPayments.map((p) => {
    const amt = Number(p.amount);
    totalCollectedAllTime += amt;

    const pDate = new Date(p.paymentDate);
    if (pDate >= startOfMonth && pDate <= endOfMonth) {
      totalCollectedThisMonth += amt;
    }

    return {
      id: p.id,
      receiptNumber: p.receiptNumber,
      invoiceId: p.invoiceId,
      clientId: p.clientId,
      amount: amt,
      paymentMethod: p.paymentMethod as PaymentMethodType,
      paymentDate: p.paymentDate.toISOString(),
      referenceNumber: p.referenceNumber,
      notes: p.notes,
      recordedById: p.recordedById,
      createdAt: p.createdAt.toISOString(),
      client: p.client,
      invoice: p.invoice
        ? {
            id: p.invoice.id,
            invoiceNumber: p.invoice.invoiceNumber,
            totalAmount: Number(p.invoice.totalAmount),
            paidAmount: Number(p.invoice.paidAmount),
            status: p.invoice.status,
            dueDate: p.invoice.dueDate.toISOString(),
            issueDate: p.invoice.issueDate.toISOString(),
          }
        : undefined,
      recordedBy: p.recordedBy,
    };
  });

  // Outstanding balance across all unpaid/partially paid invoices
  const unpaidInvoices = await prisma.invoice.findMany({
    where: {
      status: {
        in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'],
      },
    },
    select: {
      totalAmount: true,
      paidAmount: true,
    },
  });

  const totalOutstandingBalance = unpaidInvoices.reduce((acc, inv) => {
    const balance = Math.max(0, Number(inv.totalAmount) - Number(inv.paidAmount));
    return acc + balance;
  }, 0);

  const stats: PaymentStats = {
    totalCollectedThisMonth: Math.round(totalCollectedThisMonth * 100) / 100,
    totalCollectedAllTime: Math.round(totalCollectedAllTime * 100) / 100,
    totalOutstandingBalance: Math.round(totalOutstandingBalance * 100) / 100,
    totalPaymentsCount: rawPayments.length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Payments Ledger
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor incoming receipts, track reconciliation, and manage accounts receivable.
        </p>
      </div>

      <PaymentStatsCards stats={stats} />

      <PaymentTable
        payments={serializedPayments}
        userRole={session.user.role as UserRole}
        clients={clients}
      />
    </div>
  );
}
