import { requireRole } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { TicketForm, type ClientOption, type AgentOption } from '@/components/tickets/ticket-form';

export const metadata = {
  title: 'Create Support Ticket | Pulse CRM',
};

interface NewTicketPageProps {
  searchParams?: {
    clientId?: string;
  };
}

export default async function NewTicketPage({ searchParams }: NewTicketPageProps) {
  await requireRole(['ADMIN', 'MANAGER', 'SUPPORT_AGENT']);

  const clients: ClientOption[] = await prisma.client.findMany({
    select: {
      id: true,
      companyName: true,
    },
    orderBy: { companyName: 'asc' },
  });

  const rawAgents = await prisma.user.findMany({
    where: {
      role: {
        in: ['SUPPORT_AGENT', 'ADMIN', 'MANAGER'],
      },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      role: true,
    },
    orderBy: { name: 'asc' },
  });

  const agents: AgentOption[] = rawAgents.map((a) => ({
    id: a.id,
    name: a.name,
    role: a.role,
  }));

  return (
    <div className="py-2">
      <TicketForm
        clients={clients}
        agents={agents}
        preselectedClientId={searchParams?.clientId}
      />
    </div>
  );
}
