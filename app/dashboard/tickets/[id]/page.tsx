import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { TicketDetailView } from '@/components/tickets/ticket-detail-view';
import type {
  SupportTicketData,
  TicketStatusType,
  TicketPriorityType,
  TicketCategoryType,
  TicketReplyData,
} from '@/types/ticket';

export const metadata = {
  title: 'Ticket Details | Pulse CRM',
};

interface TicketDetailPageProps {
  params: {
    id: string;
  };
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  await requireRole(['ADMIN', 'MANAGER', 'SUPPORT_AGENT']);

  const t = await prisma.supportTicket.findUnique({
    where: { id: params.id },
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
      replies: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!t) {
    notFound();
  }

  const agents = await prisma.user.findMany({
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

  const serializedReplies: TicketReplyData[] = t.replies.map((r) => ({
    id: r.id,
    ticketId: r.ticketId,
    authorId: r.authorId,
    message: r.message,
    isInternal: r.isInternal,
    createdAt: r.createdAt.toISOString(),
    author: r.author,
  }));

  const serializedTicket: SupportTicketData = {
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
    replies: serializedReplies,
  };

  return (
    <div className="py-2">
      <TicketDetailView
        ticket={serializedTicket}
        agents={agents}
      />
    </div>
  );
}
