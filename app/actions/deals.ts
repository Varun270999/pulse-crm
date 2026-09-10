'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  dealCaptureSchema,
  dealStageUpdateSchema,
  dealUpdateSchema,
  type DealCaptureInput,
  type DealStageUpdateInput,
  type DealUpdateInput,
} from '@/lib/schemas/deal';
import { STAGE_DEFAULT_PROBABILITY, type PipelineStageType } from '@/types/deal';
import { revalidatePath } from 'next/cache';
import { createNotification } from '@/lib/notifications';
import { executeAction } from '@/lib/actionWrapper';
import { logActivity } from '@/lib/activityLog';

export async function createDealAction(rawInput: DealCaptureInput) {
  return executeAction('createDealAction', async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to create a deal.' };
    }

    const userRole = session.user.role;
    if (userRole === 'SUPPORT_AGENT') {
      return { error: 'Access denied: Support agents do not have permission to create deals.' };
    }

    const parsed = dealCaptureSchema.safeParse(rawInput);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid input data';
      return { error: firstError };
    }

    const data = parsed.data;

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
    });
    if (!client) {
      return { error: 'The selected client does not exist.' };
    }

    // Determine assigned representative
    let finalAssignedToId = data.assignedToId;
    if (userRole === 'SALES_EXECUTIVE') {
      finalAssignedToId = session.user.id;
    } else {
      const rep = await prisma.user.findUnique({
        where: { id: finalAssignedToId },
      });
      if (!rep || !rep.isActive) {
        return { error: 'The selected sales representative does not exist or is inactive.' };
      }
    }

    const dealStage = data.stage as PipelineStageType;
    const probability = data.probability !== undefined && data.probability !== null
      ? data.probability
      : STAGE_DEFAULT_PROBABILITY[dealStage];

    const isWon = dealStage === 'WON';
    const isLost = dealStage === 'LOST';

    const deal = await prisma.deal.create({
      data: {
        title: data.title.trim(),
        clientId: data.clientId,
        value: parseFloat(data.value),
        stage: dealStage,
        probability,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
        notes: data.notes ? data.notes.trim() : null,
        assignedToId: finalAssignedToId,
        createdById: session.user.id,
        wonAt: isWon ? new Date() : null,
        lostAt: isLost ? new Date() : null,
      },
    });

    logActivity({
      userId: session.user.id,
      action: 'DEAL_CREATED',
      entityType: 'Deal',
      entityId: deal.id,
      description: `Created deal "${deal.title}" (₹${deal.value})`,
    });

    revalidatePath('/dashboard/pipeline');
    revalidatePath('/dashboard/clients');
    revalidatePath(`/dashboard/clients/${data.clientId}`);
    revalidatePath('/dashboard');

    return { success: true, dealId: deal.id };
  });
}

export async function updateDealStageAction(rawInput: DealStageUpdateInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to update a deal.' };
    }

    const userRole = session.user.role;
    if (userRole === 'SUPPORT_AGENT') {
      return { error: 'Access denied: Support agents do not have permission to manage deals.' };
    }

    const parsed = dealStageUpdateSchema.safeParse(rawInput);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid stage data';
      return { error: firstError };
    }

    const data = parsed.data;

    const existingDeal = await prisma.deal.findUnique({
      where: { id: data.dealId },
    });

    if (!existingDeal) {
      return { error: 'Deal not found.' };
    }

    if (userRole === 'SALES_EXECUTIVE' && existingDeal.assignedToId !== session.user.id) {
      return { error: 'You do not have permission to update this deal.' };
    }

    const newStage = data.stage as PipelineStageType;
    let newProbability: number;

    if (data.probability !== undefined && data.probability !== null) {
      newProbability = data.probability;
    } else {
      newProbability = STAGE_DEFAULT_PROBABILITY[newStage];
    }

    let wonAt = existingDeal.wonAt;
    let lostAt = existingDeal.lostAt;
    let lostReason = existingDeal.lostReason;

    if (newStage === 'WON') {
      wonAt = new Date();
      lostAt = null;
      lostReason = null;
    } else if (newStage === 'LOST') {
      lostAt = new Date();
      wonAt = null;
      lostReason = data.lostReason?.trim() || null;
    } else {
      // Transitioning to an in-progress stage resets won/lost flags
      wonAt = null;
      lostAt = null;
      lostReason = null;
    }

    await prisma.deal.update({
      where: { id: data.dealId },
      data: {
        stage: newStage,
        probability: newProbability,
        wonAt,
        lostAt,
        lostReason,
      },
    });

    if (existingDeal.assignedToId) {
      await createNotification({
        userId: existingDeal.assignedToId,
        type: 'DEAL_STAGE_CHANGED',
        title: 'Deal Stage Updated',
        message: `"${existingDeal.title}" moved to ${newStage}`,
        linkUrl: `/dashboard/pipeline`,
      });
    }

    if (newStage === 'WON' && existingDeal.createdById && existingDeal.createdById !== existingDeal.assignedToId) {
      await createNotification({
        userId: existingDeal.createdById,
        type: 'DEAL_WON',
        title: '🎉 Deal Won!',
        message: `🎉 Deal won: "${existingDeal.title}"`,
        linkUrl: `/dashboard/pipeline`,
      });
    }

    logActivity({
      userId: session.user.id,
      action: 'DEAL_STAGE_CHANGED',
      entityType: 'Deal',
      entityId: data.dealId,
      description: `Moved deal "${existingDeal.title}" stage from ${existingDeal.stage} to ${newStage}`,
    });

    revalidatePath('/dashboard/pipeline');
    revalidatePath(`/dashboard/clients/${existingDeal.clientId}`);
    revalidatePath('/dashboard');

    return { success: true };
  } catch (err) {
    console.error('Failed to update deal stage:', err);
    return { error: 'An unexpected database error occurred while updating the deal.' };
  }
}

export async function updateDealDetailsAction(rawInput: DealUpdateInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to edit a deal.' };
    }

    const userRole = session.user.role;
    if (userRole === 'SUPPORT_AGENT') {
      return { error: 'Access denied: Support agents do not have permission to edit deals.' };
    }

    const parsed = dealUpdateSchema.safeParse(rawInput);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid deal data';
      return { error: firstError };
    }

    const data = parsed.data;

    const existingDeal = await prisma.deal.findUnique({
      where: { id: data.id },
    });

    if (!existingDeal) {
      return { error: 'Deal not found.' };
    }

    if (userRole === 'SALES_EXECUTIVE' && existingDeal.assignedToId !== session.user.id) {
      return { error: 'You do not have permission to edit this deal.' };
    }

    let finalAssignedToId = existingDeal.assignedToId;
    if (userRole === 'SALES_EXECUTIVE') {
      finalAssignedToId = session.user.id;
    } else {
      const rep = await prisma.user.findUnique({
        where: { id: data.assignedToId },
      });
      if (!rep || !rep.isActive) {
        return { error: 'The selected sales representative does not exist or is inactive.' };
      }
      finalAssignedToId = data.assignedToId;
    }

    const newStage = data.stage as PipelineStageType;
    let wonAt = existingDeal.wonAt;
    let lostAt = existingDeal.lostAt;
    let lostReason = existingDeal.lostReason;

    if (newStage === 'WON') {
      wonAt = existingDeal.wonAt || new Date();
      lostAt = null;
      lostReason = null;
    } else if (newStage === 'LOST') {
      lostAt = existingDeal.lostAt || new Date();
      wonAt = null;
      lostReason = data.lostReason?.trim() || null;
    } else {
      wonAt = null;
      lostAt = null;
      lostReason = null;
    }

    await prisma.deal.update({
      where: { id: data.id },
      data: {
        title: data.title.trim(),
        clientId: data.clientId,
        value: parseFloat(data.value),
        stage: newStage,
        probability: data.probability,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
        notes: data.notes ? data.notes.trim() : null,
        assignedToId: finalAssignedToId,
        wonAt,
        lostAt,
        lostReason,
      },
    });

    logActivity({
      userId: session.user.id,
      action: 'DEAL_UPDATED',
      entityType: 'Deal',
      entityId: data.id,
      description: `Updated deal "${data.title}"`,
    });

    revalidatePath('/dashboard/pipeline');
    revalidatePath(`/dashboard/clients/${existingDeal.clientId}`);
    revalidatePath(`/dashboard/clients/${data.clientId}`);
    revalidatePath('/dashboard');

    return { success: true };
  } catch (err) {
    console.error('Failed to update deal:', err);
    return { error: 'An unexpected database error occurred while updating the deal.' };
  }
}

export async function deleteDealAction(dealId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to delete a deal.' };
    }

    const userRole = session.user.role;
    if (userRole === 'SUPPORT_AGENT') {
      return { error: 'Access denied: Support agents do not have permission to delete deals.' };
    }

    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      return { error: 'Deal not found.' };
    }

    if (userRole === 'SALES_EXECUTIVE' && deal.assignedToId !== session.user.id && deal.createdById !== session.user.id) {
      return { error: 'You can only delete deals assigned to or created by you.' };
    }

    await prisma.deal.delete({
      where: { id: dealId },
    });

    logActivity({
      userId: session.user.id,
      action: 'DEAL_DELETED',
      entityType: 'Deal',
      entityId: dealId,
      description: `Deleted deal "${deal.title}"`,
    });

    revalidatePath('/dashboard/pipeline');
    revalidatePath(`/dashboard/clients/${deal.clientId}`);
    revalidatePath('/dashboard');

    return { success: true };
  } catch (err) {
    console.error('Failed to delete deal:', err);
    return { error: 'An unexpected database error occurred while deleting the deal.' };
  }
}
