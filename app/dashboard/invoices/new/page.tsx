import { requireRole } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { InvoiceForm } from '@/components/invoices/invoice-form';

export const metadata = {
  title: 'Create Invoice | Pulse CRM',
};

interface NewInvoicePageProps {
  searchParams: {
    clientId?: string;
    dealId?: string;
  };
}

export default async function NewInvoicePage({ searchParams }: NewInvoicePageProps) {
  const session = await requireRole(['ADMIN', 'MANAGER', 'SALES_EXECUTIVE']);
  const userRole = session.user.role;

  const clientWhere = userRole === 'SALES_EXECUTIVE' ? { assignedToId: session.user.id } : {};

  // Fetch clients
  const clients = await prisma.client.findMany({
    where: clientWhere,
    select: {
      id: true,
      companyName: true,
    },
    orderBy: { companyName: 'asc' },
  });

  // Fetch deals
  const deals = await prisma.deal.findMany({
    where: userRole === 'SALES_EXECUTIVE' ? { assignedToId: session.user.id } : {},
    select: {
      id: true,
      title: true,
      clientId: true,
    },
    orderBy: { title: 'asc' },
  });

  return (
    <div className="py-2">
      <InvoiceForm
        clients={clients}
        deals={deals}
        initialClientId={searchParams.clientId}
        initialDealId={searchParams.dealId}
      />
    </div>
  );
}
