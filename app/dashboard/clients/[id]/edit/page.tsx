import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { ClientEditForm } from '@/components/clients/client-edit-form';

interface ClientEditPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: ClientEditPageProps) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    select: { companyName: true },
  });

  return {
    title: client ? `Edit ${client.companyName} | Pulse CRM` : 'Edit Client | Pulse CRM',
  };
}

export default async function ClientEditPage({ params }: ClientEditPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const userRole = session.user.role;
  if (userRole === 'SUPPORT_AGENT') {
    redirect('/dashboard/clients?error=access_denied');
  }

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  if (!client) {
    notFound();
  }

  // SALES_EXECUTIVE can only edit their own assigned clients
  if (userRole === 'SALES_EXECUTIVE' && client.assignedToId !== session.user.id) {
    redirect('/dashboard/clients?error=access_denied');
  }

  // Fetch sales reps for ADMIN / MANAGER
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
  }

  return (
    <ClientEditForm
      client={client}
      currentUser={{
        id: session.user.id,
        name: session.user.name,
        role: userRole,
      }}
      salesReps={salesReps}
    />
  );
}
