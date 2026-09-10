import { requireRole } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { DealForm } from '@/components/pipeline/deal-form';

export const metadata = {
  title: 'Add New Deal | Pulse CRM',
};

interface NewDealPageProps {
  searchParams: {
    clientId?: string;
  };
}

export default async function NewDealPage({ searchParams }: NewDealPageProps) {
  const session = await requireRole(['ADMIN', 'MANAGER', 'SALES_EXECUTIVE']);
  const userRole = session.user.role;

  // Fetch clients for selection
  const clients = await prisma.client.findMany({
    where: userRole === 'SALES_EXECUTIVE' ? { assignedToId: session.user.id } : {},
    select: {
      id: true,
      companyName: true,
    },
    orderBy: {
      companyName: 'asc',
    },
  });

  // Fetch sales representatives for assignment (Admin and Manager)
  let salesReps: { id: string; name: string; role: string }[] = [];
  if (userRole === 'ADMIN' || userRole === 'MANAGER') {
    salesReps = await prisma.user.findMany({
      where: {
        role: { in: ['SALES_EXECUTIVE', 'MANAGER', 'ADMIN'] },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        role: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  } else {
    salesReps = [
      {
        id: session.user.id,
        name: session.user.name || 'Sales Representative',
        role: session.user.role,
      },
    ];
  }

  return (
    <div className="py-2">
      <DealForm
        currentUser={{
          id: session.user.id,
          name: session.user.name,
          role: session.user.role,
        }}
        clients={clients}
        salesReps={salesReps}
        initialClientId={searchParams.clientId}
      />
    </div>
  );
}
