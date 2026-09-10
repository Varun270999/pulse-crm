'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  followUpSchema,
  quickFollowUpSchema,
  type FollowUpInput,
  type QuickFollowUpInput,
} from '@/lib/schemas/follow-up';
import type { RecurrencePattern } from '@/types/follow-up';
import { revalidatePath } from 'next/cache';

function calculateNextDueDate(currentDueDate: Date, pattern: RecurrencePattern): Date {
  const next = new Date(currentDueDate);
  if (pattern === 'DAILY') {
    next.setDate(next.getDate() + 1);
  } else if (pattern === 'WEEKLY') {
    next.setDate(next.getDate() + 7);
  } else if (pattern === 'MONTHLY') {
    next.setMonth(next.getMonth() + 1);
  }
  return next;
}

export async function createFollowUpAction(rawInput: FollowUpInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to create a follow-up.' };
    }

    const userRole = session.user.role;
    if (userRole === 'SUPPORT_AGENT') {
      return { error: 'Access denied: Support agents do not have permission to manage follow-ups.' };
    }

    const parsed = followUpSchema.safeParse(rawInput);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid input data';
      return { error: firstError };
    }

    const data = parsed.data;

    let finalAssignedToId = data.assignedToId;
    if (userRole === 'SALES_EXECUTIVE') {
      finalAssignedToId = session.user.id;
    } else {
      const rep = await prisma.user.findUnique({
        where: { id: finalAssignedToId },
      });
      if (!rep || !rep.isActive) {
        return { error: 'The selected team member does not exist or is inactive.' };
      }
    }

    const finalLeadId = data.relatedType === 'LEAD' && data.leadId ? data.leadId : null;
    const finalClientId = data.relatedType === 'CLIENT' && data.clientId ? data.clientId : null;

    const followUp = await prisma.followUp.create({
      data: {
        title: data.title.trim(),
        description: data.description ? data.description.trim() : null,
        type: data.type,
        dueDate: new Date(data.dueDate),
        status: 'PENDING',
        leadId: finalLeadId,
        clientId: finalClientId,
        assignedToId: finalAssignedToId,
        createdById: session.user.id,
        isRecurring: data.isRecurring,
        recurrencePattern: data.isRecurring && data.recurrencePattern ? data.recurrencePattern : null,
      },
    });

    revalidatePath('/dashboard/follow-ups');
    revalidatePath('/dashboard');
    if (finalClientId) {
      revalidatePath(`/dashboard/clients/${finalClientId}`);
    }

    return { success: true, followUpId: followUp.id };
  } catch (err) {
    console.error('Failed to create follow-up:', err);
    return { error: 'An unexpected database error occurred while creating the follow-up.' };
  }
}

export async function createQuickFollowUpAction(rawInput: QuickFollowUpInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to create a follow-up.' };
    }

    const userRole = session.user.role;
    if (userRole === 'SUPPORT_AGENT') {
      return { error: 'Access denied: Support agents do not have permission to manage follow-ups.' };
    }

    const parsed = quickFollowUpSchema.safeParse(rawInput);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid input data';
      return { error: firstError };
    }

    const data = parsed.data;

    let finalAssignedToId = data.assignedToId;
    if (userRole === 'SALES_EXECUTIVE') {
      finalAssignedToId = session.user.id;
    } else {
      const rep = await prisma.user.findUnique({
        where: { id: finalAssignedToId },
      });
      if (!rep || !rep.isActive) {
        return { error: 'The selected team member does not exist or is inactive.' };
      }
    }

    // Mutually exclusive: either leadId or clientId
    const finalLeadId = data.leadId ? data.leadId : null;
    const finalClientId = !finalLeadId && data.clientId ? data.clientId : null;

    const followUp = await prisma.followUp.create({
      data: {
        title: data.title.trim(),
        description: data.description ? data.description.trim() : null,
        type: data.type,
        dueDate: new Date(data.dueDate),
        status: 'PENDING',
        leadId: finalLeadId,
        clientId: finalClientId,
        assignedToId: finalAssignedToId,
        createdById: session.user.id,
        isRecurring: data.isRecurring,
        recurrencePattern: data.isRecurring && data.recurrencePattern ? data.recurrencePattern : null,
      },
    });

    revalidatePath('/dashboard/follow-ups');
    revalidatePath('/dashboard');
    if (finalClientId) {
      revalidatePath(`/dashboard/clients/${finalClientId}`);
    }

    return { success: true, followUpId: followUp.id };
  } catch (err) {
    console.error('Failed to create quick follow-up:', err);
    return { error: 'An unexpected database error occurred while creating the follow-up.' };
  }
}

export async function completeFollowUpAction(followUpId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to complete a follow-up.' };
    }

    const userRole = session.user.role;
    if (userRole === 'SUPPORT_AGENT') {
      return { error: 'Access denied: Support agents do not have permission to manage follow-ups.' };
    }

    const existing = await prisma.followUp.findUnique({
      where: { id: followUpId },
    });

    if (!existing) {
      return { error: 'Follow-up not found.' };
    }

    if (userRole === 'SALES_EXECUTIVE' && existing.assignedToId !== session.user.id) {
      return { error: 'Access denied: You can only complete follow-ups assigned to you.' };
    }

    const result = await prisma.$transaction(async (tx) => {
      // Mark current as completed
      const updated = await tx.followUp.update({
        where: { id: followUpId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // If recurring, automatically schedule the next occurrence
      let nextOccurrence = null;
      if (existing.isRecurring && existing.recurrencePattern) {
        const nextDueDate = calculateNextDueDate(
          new Date(existing.dueDate),
          existing.recurrencePattern as RecurrencePattern
        );

        nextOccurrence = await tx.followUp.create({
          data: {
            title: existing.title,
            description: existing.description,
            type: existing.type,
            dueDate: nextDueDate,
            status: 'PENDING',
            leadId: existing.leadId,
            clientId: existing.clientId,
            assignedToId: existing.assignedToId,
            createdById: session.user.id,
            isRecurring: true,
            recurrencePattern: existing.recurrencePattern,
          },
        });
      }

      return { updated, nextOccurrence };
    });

    revalidatePath('/dashboard/follow-ups');
    revalidatePath('/dashboard');
    if (existing.clientId) {
      revalidatePath(`/dashboard/clients/${existing.clientId}`);
    }

    return {
      success: true,
      nextFollowUpId: result.nextOccurrence?.id || null,
      isRecurring: Boolean(existing.isRecurring),
    };
  } catch (err) {
    console.error('Failed to complete follow-up:', err);
    return { error: 'An unexpected database error occurred while completing the follow-up.' };
  }
}

export type FollowUpActionResult = {
  success?: boolean;
  error?: string;
  nextFollowUpId?: string | null;
  isRecurring?: boolean;
};

export async function updateFollowUpStatusAction(
  followUpId: string,
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED'
): Promise<FollowUpActionResult> {
  if (status === 'COMPLETED') {
    return await completeFollowUpAction(followUpId);
  }

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to update a follow-up.' };
    }

    const userRole = session.user.role;
    if (userRole === 'SUPPORT_AGENT') {
      return { error: 'Access denied.' };
    }

    const existing = await prisma.followUp.findUnique({
      where: { id: followUpId },
    });

    if (!existing) {
      return { error: 'Follow-up not found.' };
    }

    if (userRole === 'SALES_EXECUTIVE' && existing.assignedToId !== session.user.id) {
      return { error: 'Access denied: You can only modify follow-ups assigned to you.' };
    }

    await prisma.followUp.update({
      where: { id: followUpId },
      data: {
        status,
        completedAt: status === 'PENDING' ? null : existing.completedAt,
      },
    });

    revalidatePath('/dashboard/follow-ups');
    revalidatePath('/dashboard');
    if (existing.clientId) {
      revalidatePath(`/dashboard/clients/${existing.clientId}`);
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to update follow-up status:', err);
    return { error: 'An unexpected database error occurred.' };
  }
}

export async function deleteFollowUpAction(followUpId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to delete a follow-up.' };
    }

    const userRole = session.user.role;
    if (userRole === 'SUPPORT_AGENT') {
      return { error: 'Access denied: Support agents do not have permission to manage follow-ups.' };
    }

    const existing = await prisma.followUp.findUnique({
      where: { id: followUpId },
    });

    if (!existing) {
      return { error: 'Follow-up not found.' };
    }

    // Role check: Admin and Manager can delete any; Sales Executive can only delete their own
    if (
      userRole === 'SALES_EXECUTIVE' &&
      existing.assignedToId !== session.user.id &&
      existing.createdById !== session.user.id
    ) {
      return { error: 'Access denied: You can only delete follow-ups assigned to you.' };
    }

    await prisma.followUp.delete({
      where: { id: followUpId },
    });

    revalidatePath('/dashboard/follow-ups');
    revalidatePath('/dashboard');
    if (existing.clientId) {
      revalidatePath(`/dashboard/clients/${existing.clientId}`);
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to delete follow-up:', err);
    return { error: 'An unexpected database error occurred while deleting the follow-up.' };
  }
}
