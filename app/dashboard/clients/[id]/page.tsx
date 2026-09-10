import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { ClientDetailView } from '@/components/clients/client-detail-view';

interface ClientDetailPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: ClientDetailPageProps) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    select: { companyName: true },
  });

  return {
    title: client ? `${client.companyName} | Pulse CRM` : 'Client Details | Pulse CRM',
  };
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      contacts: {
        orderBy: [
          { isPrimary: 'desc' },
          { createdAt: 'asc' },
        ],
      },
    },
  });

  if (!client) {
    notFound();
  }

  // Role Access: SALES_EXECUTIVE can only view their own assigned clients
  if (session.user.role === 'SALES_EXECUTIVE' && client.assignedToId !== session.user.id) {
    redirect('/dashboard/clients?error=access_denied');
  }

  return (
    <ClientDetailView
      client={{
        ...client,
        createdAt: client.createdAt.toISOString(),
        updatedAt: client.updatedAt.toISOString(),
        contacts: client.contacts.map((c) => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
        })),
      }}
      currentUser={{
        id: session.user.id,
        name: session.user.name,
        role: session.user.role,
      }}
    />
  );
}
