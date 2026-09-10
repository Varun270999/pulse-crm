import { requireRole, type UserRole } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { TicketStatsCards } from '@/components/tickets/ticket-stats-cards';
import { TicketTable } from '@/components/tickets/ticket-table';
import type {
  SupportTicketData,
  TicketStats,
  TicketStatusType,
  TicketPriorityType,
  TicketCategoryType,
} from '@/types/ticket';

export const metadata = {
  title: 'Support Tickets | Pulse CRM',
};

export default async function TicketsPage() {
  const session = await requireRole(['ADMIN', 'MANAGER', 'SUPPORT_AGENT']);

  // Fetch tickets and support agents in parallel
  const [rawTickets, rawAgents] = await Promise.all([
    prisma.supportTicket.findMany({
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            email: true,
            phone: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            designation: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.findMany({
      where: {
        role: {
          in: ['SUPPORT_AGENT', 'ADMIN', 'MANAGER'],
        },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  const now = new Date();
  let openCount = 0;
  let inProgressCount = 0;
  let overdueCount = 0;
  let resolvedCount = 0;

  const serializedTickets: SupportTicketData[] = rawTickets.map((t) => {
    if (t.status === 'OPEN') openCount++;
    else if (t.status === 'IN_PROGRESS') inProgressCount++;
    else if (t.status === 'RESOLVED' || t.status === 'CLOSED') resolvedCount++;

    if (t.dueBy < now && t.status !== 'RESOLVED' && t.status !== 'CLOSED') {
      overdueCount++;
    }

    return {
      id: t.id,
      ticketNumber: t.ticketNumber,
      clientId: t.clientId,
      contactId: t.contactId,
      subject: t.subject,
      description: t.description,
      status: t.status as TicketStatusType,
      priority: t.priority as TicketPriorityType,
      category: t.category as TicketCategoryType,
      assignedToId: t.assignedToId,
      createdById: t.createdById,
      dueBy: t.dueBy.toISOString(),
      resolvedAt: t.resolvedAt ? t.resolvedAt.toISOString() : null,
      closedAt: t.closedAt ? t.closedAt.toISOString() : null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      client: t.client,
      contact: t.contact,
      assignedTo: t.assignedTo,
      createdBy: t.createdBy,
    };
  });

  const stats: TicketStats = {
    openCount,
    inProgressCount,
    overdueCount,
    resolvedCount,
    totalCount: rawTickets.length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Support Tickets
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track customer issues, manage SLA resolution timelines, and collaborate across cases.
        </p>
      </div>

      <TicketStatsCards stats={stats} />

      <TicketTable
        tickets={serializedTickets}
        currentUserId={session.user.id}
        userRole={session.user.role as UserRole}
        agents={rawAgents}
      />
    </div>
  );
}
