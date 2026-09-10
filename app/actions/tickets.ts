'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { createNotification } from '@/lib/notifications';
import { computeTicketDueBy } from '@/types/ticket';
import {
  createTicketSchema,
  updateTicketStatusSchema,
  updateTicketPrioritySchema,
  reassignTicketSchema,
  createTicketReplySchema,
  type CreateTicketInput,
  type UpdateTicketStatusInput,
  type UpdateTicketPriorityInput,
  type ReassignTicketInput,
  type CreateTicketReplyInput,
} from '@/lib/schemas/ticket';

/**
 * Generate sequential ticket number in format "TCK-0001", "TCK-0002", etc.
 */
async function generateTicketNumber(tx: Prisma.TransactionClient): Promise<string> {
  const lastTicket = await tx.supportTicket.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { ticketNumber: true },
  });

  let nextNum = 1;
  if (lastTicket?.ticketNumber) {
    const match = lastTicket.ticketNumber.match(/TCK-(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  } else {
    const count = await tx.supportTicket.count();
    nextNum = count + 1;
  }

  return `TCK-${String(nextNum).padStart(4, '0')}`;
}

/**
 * Create a new support ticket
 */
export async function createTicketAction(rawInput: CreateTicketInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to create a support ticket.' };
    }

    if (session.user.role === 'SALES_EXECUTIVE') {
      return { error: 'Access denied: Sales executives cannot manage support tickets.' };
    }

    const parsed = createTicketSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || 'Invalid ticket data.' };
    }

    const data = parsed.data;
    const now = new Date();
    const dueBy = computeTicketDueBy(now, data.priority);

    const ticket = await prisma.$transaction(async (tx) => {
      const ticketNumber = await generateTicketNumber(tx);

      return tx.supportTicket.create({
        data: {
          ticketNumber,
          clientId: data.clientId,
          contactId: data.contactId || null,
          subject: data.subject,
          description: data.description,
          priority: data.priority,
          category: data.category,
          status: 'OPEN',
          assignedToId: data.assignedToId || null,
          createdById: session.user.id,
          dueBy,
        },
      });
    });

    revalidatePath('/dashboard/tickets');
    revalidatePath(`/dashboard/clients/${data.clientId}`);
    revalidatePath('/dashboard');

    if (ticket.assignedToId) {
      await createNotification({
        userId: ticket.assignedToId,
        type: 'TICKET_ASSIGNED',
        title: 'Support Ticket Assigned',
        message: `Ticket assigned: ${ticket.ticketNumber} - ${ticket.subject}`,
        linkUrl: `/dashboard/tickets/${ticket.id}`,
      });
    }

    return {
      success: true,
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
    };
  } catch (err: unknown) {
    console.error('Failed to create support ticket:', err);
    const msg =
      err instanceof Error ? err.message : 'An unexpected error occurred while creating ticket.';
    return { error: msg };
  }
}

/**
 * Quick status update on a support ticket
 */
export async function updateTicketStatusAction(rawInput: UpdateTicketStatusInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to update ticket status.' };
    }

    if (session.user.role === 'SALES_EXECUTIVE') {
      return { error: 'Access denied.' };
    }

    const parsed = updateTicketStatusSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || 'Invalid status data.' };
    }

    const { id, status } = parsed.data;

    const existing = await prisma.supportTicket.findUnique({
      where: { id },
      select: { id: true, status: true, resolvedAt: true, clientId: true },
    });

    if (!existing) {
      return { error: 'Ticket not found.' };
    }

    const now = new Date();
    let resolvedAt = existing.resolvedAt;
    let closedAt: Date | null = null;

    if (status === 'RESOLVED') {
      resolvedAt = now;
      closedAt = null;
    } else if (status === 'CLOSED') {
      closedAt = now;
      if (!resolvedAt) resolvedAt = now;
    } else {
      // OPEN, IN_PROGRESS, ON_HOLD: Reopening resets timestamps
      resolvedAt = null;
      closedAt = null;
    }

    await prisma.supportTicket.update({
      where: { id },
      data: {
        status,
        resolvedAt,
        closedAt,
      },
    });

    revalidatePath('/dashboard/tickets');
    revalidatePath(`/dashboard/tickets/${id}`);
    revalidatePath(`/dashboard/clients/${existing.clientId}`);
    revalidatePath('/dashboard');

    return { success: true, status };
  } catch (err: unknown) {
    console.error('Failed to update ticket status:', err);
    const msg =
      err instanceof Error ? err.message : 'Failed to update ticket status.';
    return { error: msg };
  }
}

/**
 * Quick priority update on a support ticket
 */
export async function updateTicketPriorityAction(rawInput: UpdateTicketPriorityInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to update ticket priority.' };
    }

    if (session.user.role === 'SALES_EXECUTIVE') {
      return { error: 'Access denied.' };
    }

    const parsed = updateTicketPrioritySchema.safeParse(rawInput);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || 'Invalid priority data.' };
    }

    const { id, priority } = parsed.data;

    const existing = await prisma.supportTicket.findUnique({
      where: { id },
      select: { id: true, createdAt: true, clientId: true },
    });

    if (!existing) {
      return { error: 'Ticket not found.' };
    }

    const newDueBy = computeTicketDueBy(existing.createdAt, priority);

    await prisma.supportTicket.update({
      where: { id },
      data: {
        priority,
        dueBy: newDueBy,
      },
    });

    revalidatePath('/dashboard/tickets');
    revalidatePath(`/dashboard/tickets/${id}`);
    revalidatePath(`/dashboard/clients/${existing.clientId}`);

    return { success: true, priority, dueBy: newDueBy.toISOString() };
  } catch (err: unknown) {
    console.error('Failed to update ticket priority:', err);
    const msg =
      err instanceof Error ? err.message : 'Failed to update ticket priority.';
    return { error: msg };
  }
}

/**
 * Reassign ticket to another agent or unassign
 */
export async function reassignTicketAction(rawInput: ReassignTicketInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to reassign tickets.' };
    }

    if (session.user.role === 'SALES_EXECUTIVE') {
      return { error: 'Access denied.' };
    }

    const parsed = reassignTicketSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || 'Invalid assignment data.' };
    }

    const { id, assignedToId } = parsed.data;

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: {
        assignedToId: assignedToId || null,
      },
      select: { id: true, ticketNumber: true, subject: true },
    });

    if (assignedToId) {
      await createNotification({
        userId: assignedToId,
        type: 'TICKET_ASSIGNED',
        title: 'Support Ticket Assigned',
        message: `Ticket assigned: ${ticket.ticketNumber} - ${ticket.subject}`,
        linkUrl: `/dashboard/tickets/${id}`,
      });
    }

    revalidatePath('/dashboard/tickets');
    revalidatePath(`/dashboard/tickets/${id}`);

    return { success: true };
  } catch (err: unknown) {
    console.error('Failed to reassign ticket:', err);
    const msg =
      err instanceof Error ? err.message : 'Failed to reassign ticket.';
    return { error: msg };
  }
}

/**
 * Post a reply or internal note to a support ticket
 */
export async function addTicketReplyAction(rawInput: CreateTicketReplyInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to post a reply.' };
    }

    if (session.user.role === 'SALES_EXECUTIVE') {
      return { error: 'Access denied.' };
    }

    const parsed = createTicketReplySchema.safeParse(rawInput);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || 'Invalid reply data.' };
    }

    const { ticketId, message, isInternal } = parsed.data;

    const reply = await prisma.$transaction(async (tx) => {
      const rep = await tx.ticketReply.create({
        data: {
          ticketId,
          authorId: session.user.id,
          message,
          isInternal,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              role: true,
              avatarUrl: true,
            },
          },
        },
      });

      // Touch the ticket's updatedAt timestamp
      await tx.supportTicket.update({
        where: { id: ticketId },
        data: { updatedAt: new Date() },
      });

      return rep;
    });

    // Notify ticket creator or assigned agent on public replies
    if (!isInternal) {
      const parentTicket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        select: { id: true, ticketNumber: true, subject: true, createdById: true, assignedToId: true },
      });

      if (parentTicket) {
        if (parentTicket.createdById && parentTicket.createdById !== session.user.id) {
          await createNotification({
            userId: parentTicket.createdById,
            type: 'TICKET_REPLY',
            title: 'New Reply on Ticket',
            message: `New reply on ${parentTicket.ticketNumber}: ${parentTicket.subject}`,
            linkUrl: `/dashboard/tickets/${parentTicket.id}`,
          });
        }
        if (
          parentTicket.assignedToId &&
          parentTicket.assignedToId !== session.user.id &&
          parentTicket.assignedToId !== parentTicket.createdById
        ) {
          await createNotification({
            userId: parentTicket.assignedToId,
            type: 'TICKET_REPLY',
            title: 'New Reply on Ticket',
            message: `New reply on ${parentTicket.ticketNumber}: ${parentTicket.subject}`,
            linkUrl: `/dashboard/tickets/${parentTicket.id}`,
          });
        }
      }
    }

    revalidatePath(`/dashboard/tickets/${ticketId}`);

    return {
      success: true,
      reply: {
        id: reply.id,
        ticketId: reply.ticketId,
        authorId: reply.authorId,
        message: reply.message,
        isInternal: reply.isInternal,
        createdAt: reply.createdAt.toISOString(),
        author: reply.author,
      },
    };
  } catch (err: unknown) {
    console.error('Failed to post ticket reply:', err);
    const msg =
      err instanceof Error ? err.message : 'Failed to post reply.';
    return { error: msg };
  }
}

/**
 * Fetch contacts for a client (for the new ticket form dropdown)
 */
export async function getClientContactsAction(clientId: string) {
  try {
    const contacts = await prisma.contact.findMany({
      where: { clientId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        designation: true,
        isPrimary: true,
      },
      orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
    });

    return { contacts };
  } catch (err) {
    console.error('Failed to fetch client contacts:', err);
    return { contacts: [] };
  }
}
