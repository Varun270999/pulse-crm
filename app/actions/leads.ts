'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  leadCaptureSchema,
  leadStatusUpdateSchema,
  leadUpdateSchema,
  type LeadCaptureInput,
  type LeadStatusUpdateInput,
  type LeadUpdateInput,
} from '@/lib/schemas/lead';
import { revalidatePath } from 'next/cache';
import { createNotification } from '@/lib/notifications';
import { executeAction } from '@/lib/actionWrapper';

export async function createLeadAction(rawInput: LeadCaptureInput) {
  return executeAction('createLeadAction', async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to create a lead.' };
    }

    const userRole = session.user.role;
    if (userRole === 'SUPPORT_AGENT') {
      return { error: 'Access denied: Support agents do not have permission to create leads.' };
    }

    const parsed = leadCaptureSchema.safeParse(rawInput);
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
        return { error: 'The selected sales representative does not exist or is inactive.' };
      }
    }

    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        companyName: data.companyName ? data.companyName.trim() : null,
        email: data.email ? data.email.trim() : null,
        phone: data.phone ? data.phone.trim() : null,
        source: data.source,
        status: 'NEW',
        estimatedValue: data.estimatedValue ? parseFloat(data.estimatedValue) : null,
        notes: data.notes ? data.notes.trim() : null,
        assignedToId: finalAssignedToId,
        createdById: session.user.id,
      },
    });

    if (lead.assignedToId) {
      await createNotification({
        userId: lead.assignedToId,
        type: 'LEAD_ASSIGNED',
        title: 'New Lead Assigned',
        message: `New lead assigned: ${lead.name}`,
        linkUrl: `/dashboard/leads`,
      });
    }

    revalidatePath('/dashboard/leads');
    revalidatePath('/dashboard');

    return { success: true, leadId: lead.id };
  });
}

export async function updateLeadStatusAction(rawInput: LeadStatusUpdateInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to update a lead.' };
    }

    const userRole = session.user.role;
    if (userRole === 'SUPPORT_AGENT') {
      return { error: 'Access denied: Support agents do not have permission to manage leads.' };
    }

    const parsed = leadStatusUpdateSchema.safeParse(rawInput);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid status data';
      return { error: firstError };
    }

    const data = parsed.data;

    const existingLead = await prisma.lead.findUnique({
      where: { id: data.leadId },
    });

    if (!existingLead) {
      return { error: 'Lead not found.' };
    }

    if (userRole === 'SALES_EXECUTIVE' && existingLead.assignedToId !== session.user.id) {
      return { error: 'Access denied: You can only update leads assigned to your portfolio.' };
    }

    await prisma.lead.update({
      where: { id: data.leadId },
      data: {
        status: data.status,
        lostReason: data.status === 'LOST' ? (data.lostReason?.trim() || null) : null,
      },
    });

    revalidatePath('/dashboard/leads');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (err) {
    console.error('Failed to update lead status:', err);
    return { error: 'An unexpected database error occurred while updating the lead status.' };
  }
}

export async function convertLeadToClientAction(leadId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to convert a lead.' };
    }

    const userRole = session.user.role;
    if (userRole === 'SUPPORT_AGENT') {
      return { error: 'Access denied: Support agents do not have permission to convert leads.' };
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return { error: 'Lead not found.' };
    }

    if (userRole === 'SALES_EXECUTIVE' && lead.assignedToId !== session.user.id) {
      return { error: 'Access denied: You can only convert leads assigned to your portfolio.' };
    }

    if (lead.status === 'CONVERTED' || lead.convertedClientId) {
      return {
        error: 'This lead has already been converted to a client.',
        clientId: lead.convertedClientId,
      };
    }

    // Atomic transaction: Create Client (ACTIVE) + Primary Contact, then update Lead status and convertedClientId
    const createdClient = await prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          companyName: lead.companyName?.trim() || lead.name.trim(),
          email: lead.email || null,
          phone: lead.phone || null,
          source: lead.source,
          status: 'ACTIVE',
          notes: lead.notes
            ? `[Converted from Lead: ${lead.name}]\n${lead.notes}`
            : `[Converted from Lead: ${lead.name}]`,
          assignedToId: lead.assignedToId,
          createdById: session.user.id,
          contacts: {
            create: {
              name: lead.name,
              email: lead.email || null,
              phone: lead.phone || null,
              isPrimary: true,
            },
          },
        },
      });

      await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: 'CONVERTED',
          convertedClientId: client.id,
        },
      });

      return client;
    });

    revalidatePath('/dashboard/leads');
    revalidatePath('/dashboard/clients');
    revalidatePath('/dashboard');

    return {
      success: true,
      clientId: createdClient.id,
      companyName: createdClient.companyName,
    };
  } catch (err) {
    console.error('Failed to convert lead:', err);
    return { error: 'An unexpected database error occurred while converting the lead to a client.' };
  }
}

export async function updateLeadDetailsAction(rawInput: LeadUpdateInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to edit a lead.' };
    }

    const userRole = session.user.role;
    if (userRole === 'SUPPORT_AGENT') {
      return { error: 'Access denied: Support agents do not have permission to edit leads.' };
    }

    const parsed = leadUpdateSchema.safeParse(rawInput);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid input data';
      return { error: firstError };
    }

    const data = parsed.data;

    const existingLead = await prisma.lead.findUnique({
      where: { id: data.id },
    });

    if (!existingLead) {
      return { error: 'Lead not found.' };
    }

    if (userRole === 'SALES_EXECUTIVE' && existingLead.assignedToId !== session.user.id) {
      return { error: 'Access denied: You can only edit leads assigned to your portfolio.' };
    }

    let finalAssignedToId = existingLead.assignedToId;
    if (userRole === 'ADMIN' || userRole === 'MANAGER') {
      finalAssignedToId = data.assignedToId;
      const rep = await prisma.user.findUnique({
        where: { id: finalAssignedToId },
      });
      if (!rep || !rep.isActive) {
        return { error: 'Selected sales representative does not exist or is inactive.' };
      }
    }

    const wasReassigned = finalAssignedToId && finalAssignedToId !== existingLead.assignedToId;

    await prisma.lead.update({
      where: { id: data.id },
      data: {
        name: data.name,
        companyName: data.companyName ? data.companyName.trim() : null,
        email: data.email ? data.email.trim() : null,
        phone: data.phone ? data.phone.trim() : null,
        source: data.source,
        estimatedValue: data.estimatedValue ? parseFloat(data.estimatedValue) : null,
        notes: data.notes ? data.notes.trim() : null,
        assignedToId: finalAssignedToId,
      },
    });

    if (wasReassigned && finalAssignedToId) {
      await createNotification({
        userId: finalAssignedToId,
        type: 'LEAD_ASSIGNED',
        title: 'Lead Assigned to You',
        message: `New lead assigned: ${data.name}`,
        linkUrl: `/dashboard/leads`,
      });
    }

    revalidatePath('/dashboard/leads');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (err) {
    console.error('Failed to update lead:', err);
    return { error: 'An unexpected database error occurred while updating the lead.' };
  }
}

export async function deleteLeadAction(leadId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to delete a lead.' };
    }

    const userRole = session.user.role;
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      return { error: 'Access denied: Only administrators and managers have permission to delete leads.' };
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return { error: 'Lead not found.' };
    }

    await prisma.lead.delete({
      where: { id: leadId },
    });

    revalidatePath('/dashboard/leads');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (err) {
    console.error('Failed to delete lead:', err);
    return { error: 'An unexpected database error occurred while deleting the lead.' };
  }
}
