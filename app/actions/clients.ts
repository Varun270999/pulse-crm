'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  clientRegistrationSchema,
  clientUpdateSchema,
  addContactSchema,
  type ClientRegistrationInput,
  type ClientUpdateInput,
  type AddContactInput,
} from '@/lib/schemas/client';
import { revalidatePath } from 'next/cache';
import { executeAction } from '@/lib/actionWrapper';
import { logActivity } from '@/lib/activityLog';

export async function createClientAction(rawInput: ClientRegistrationInput) {
  return executeAction('createClientAction', async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to register a client.' };
    }

    const userRole = session.user.role;
    if (userRole === 'SUPPORT_AGENT') {
      return { error: 'Access denied: Support agents do not have permission to register clients.' };
    }

    // Server-side validation
    const parsed = clientRegistrationSchema.safeParse(rawInput);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid input data';
      return { error: firstError };
    }

    const data = parsed.data;

    // If SALES_EXECUTIVE, enforce assignment to themselves
    let finalAssignedToId = data.assignedToId;
    if (userRole === 'SALES_EXECUTIVE') {
      finalAssignedToId = session.user.id;
    } else {
      // For Admin/Manager, ensure the assigned rep exists and is active
      const rep = await prisma.user.findUnique({
        where: { id: finalAssignedToId },
      });
      if (!rep || !rep.isActive) {
        return { error: 'The selected sales representative does not exist or is inactive.' };
      }
    }

    // Atomic transaction creating Client and Primary Contact
    const client = await prisma.$transaction(async (tx) => {
      return await tx.client.create({
        data: {
          companyName: data.companyName,
          industry: data.industry || null,
          website: data.website || null,
          email: data.email || null,
          phone: data.phone || null,
          addressLine: data.addressLine || null,
          city: data.city || null,
          state: data.state || null,
          postalCode: data.postalCode || null,
          country: data.country || 'India',
          status: data.status,
          source: data.source,
          notes: data.notes || null,
          assignedToId: finalAssignedToId,
          createdById: session.user.id,
          contacts: {
            create: {
              name: data.contactName,
              designation: data.contactDesignation || null,
              email: data.contactEmail || null,
              phone: data.contactPhone || null,
              isPrimary: true,
            },
          },
        },
        include: {
          contacts: true,
        },
      });
    });

    logActivity({
      userId: session.user.id,
      action: 'CLIENT_CREATED',
      entityType: 'Client',
      entityId: client.id,
      description: `Created client "${client.companyName}"`,
    });

    revalidatePath('/dashboard/clients');
    revalidatePath('/dashboard');

    return { success: true, clientId: client.id };
  });
}

export async function updateClientAction(rawInput: ClientUpdateInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to edit a client.' };
    }

    const userRole = session.user.role;
    if (userRole === 'SUPPORT_AGENT') {
      return { error: 'Access denied: Support agents do not have permission to edit clients.' };
    }

    const parsed = clientUpdateSchema.safeParse(rawInput);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid input data';
      return { error: firstError };
    }

    const data = parsed.data;

    // Verify existing client and permissions
    const existingClient = await prisma.client.findUnique({
      where: { id: data.id },
    });

    if (!existingClient) {
      return { error: 'Client not found.' };
    }

    // Role check: SALES_EXECUTIVE can only edit their own assigned clients
    if (userRole === 'SALES_EXECUTIVE' && existingClient.assignedToId !== session.user.id) {
      return { error: 'Access denied: You can only edit clients assigned to your portfolio.' };
    }

    // Determine assigned rep
    let finalAssignedToId = existingClient.assignedToId;
    if (userRole === 'ADMIN' || userRole === 'MANAGER') {
      finalAssignedToId = data.assignedToId;
      const rep = await prisma.user.findUnique({
        where: { id: finalAssignedToId },
      });
      if (!rep || !rep.isActive) {
        return { error: 'Selected sales representative does not exist or is inactive.' };
      }
    }

    await prisma.client.update({
      where: { id: data.id },
      data: {
        companyName: data.companyName,
        industry: data.industry || null,
        website: data.website || null,
        email: data.email || null,
        phone: data.phone || null,
        addressLine: data.addressLine || null,
        city: data.city || null,
        state: data.state || null,
        postalCode: data.postalCode || null,
        country: data.country || 'India',
        status: data.status,
        source: data.source,
        notes: data.notes || null,
        assignedToId: finalAssignedToId,
      },
    });

    logActivity({
      userId: session.user.id,
      action: 'CLIENT_UPDATED',
      entityType: 'Client',
      entityId: data.id,
      description: `Updated client "${data.companyName}"`,
    });

    revalidatePath('/dashboard/clients');
    revalidatePath(`/dashboard/clients/${data.id}`);
    revalidatePath('/dashboard');

    return { success: true };
  } catch (err) {
    console.error('Failed to update client:', err);
    return { error: 'An unexpected database error occurred while updating the client.' };
  }
}

export async function deleteClientAction(clientId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to delete a client.' };
    }

    const userRole = session.user.role;
    // Strict RBAC: Only ADMIN and MANAGER can delete
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
      return { error: 'Access denied: Only administrators and managers have permission to delete clients.' };
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return { error: 'Client record not found.' };
    }

    // Cascade delete automatically deletes associated contacts due to Prisma schema
    await prisma.client.delete({
      where: { id: clientId },
    });

    logActivity({
      userId: session.user.id,
      action: 'CLIENT_DELETED',
      entityType: 'Client',
      entityId: clientId,
      description: `Deleted client "${client.companyName}"`,
    });

    revalidatePath('/dashboard/clients');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (err) {
    console.error('Failed to delete client:', err);
    return { error: 'An unexpected database error occurred while deleting the client.' };
  }
}

export async function addContactAction(rawInput: AddContactInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in to add a contact.' };
    }

    const userRole = session.user.role;
    if (userRole === 'SUPPORT_AGENT') {
      return { error: 'Access denied: Support agents cannot add contacts.' };
    }

    const parsed = addContactSchema.safeParse(rawInput);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid contact data';
      return { error: firstError };
    }

    const data = parsed.data;

    // Check client ownership
    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
    });

    if (!client) {
      return { error: 'Client record not found.' };
    }

    if (userRole === 'SALES_EXECUTIVE' && client.assignedToId !== session.user.id) {
      return { error: 'Access denied: You can only manage contacts for your assigned clients.' };
    }

    // If marked as primary, atomically unset previous primary contact for this client
    await prisma.$transaction(async (tx) => {
      if (data.isPrimary) {
        await tx.contact.updateMany({
          where: { clientId: data.clientId },
          data: { isPrimary: false },
        });
      }

      await tx.contact.create({
        data: {
          clientId: data.clientId,
          name: data.name,
          designation: data.designation || null,
          email: data.email || null,
          phone: data.phone || null,
          isPrimary: data.isPrimary,
        },
      });
    });

    revalidatePath(`/dashboard/clients/${data.clientId}`);
    revalidatePath('/dashboard/clients');

    return { success: true };
  } catch (err) {
    console.error('Failed to add contact:', err);
    return { error: 'An unexpected error occurred while adding the contact.' };
  }
}

export async function setPrimaryContactAction(clientId: string, contactId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in.' };
    }

    const userRole = session.user.role;
    if (userRole === 'SUPPORT_AGENT') {
      return { error: 'Access denied.' };
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return { error: 'Client not found.' };
    }

    if (userRole === 'SALES_EXECUTIVE' && client.assignedToId !== session.user.id) {
      return { error: 'Access denied: You can only modify your assigned clients.' };
    }

    await prisma.$transaction([
      prisma.contact.updateMany({
        where: { clientId },
        data: { isPrimary: false },
      }),
      prisma.contact.update({
        where: { id: contactId },
        data: { isPrimary: true },
      }),
    ]);

    revalidatePath(`/dashboard/clients/${clientId}`);
    revalidatePath('/dashboard/clients');

    return { success: true };
  } catch (err) {
    console.error('Failed to update primary contact:', err);
    return { error: 'An unexpected error occurred.' };
  }
}

export async function deleteContactAction(clientId: string, contactId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be signed in.' };
    }

    const userRole = session.user.role;
    if (userRole === 'SUPPORT_AGENT') {
      return { error: 'Access denied.' };
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: { contacts: true },
    });

    if (!client) {
      return { error: 'Client not found.' };
    }

    if (userRole === 'SALES_EXECUTIVE' && client.assignedToId !== session.user.id) {
      return { error: 'Access denied.' };
    }

    if (client.contacts.length <= 1) {
      return { error: 'Cannot delete the only contact. A client must have at least one contact.' };
    }

    const targetContact = client.contacts.find((c) => c.id === contactId);
    if (!targetContact) {
      return { error: 'Contact not found.' };
    }

    await prisma.$transaction(async (tx) => {
      await tx.contact.delete({
        where: { id: contactId },
      });

      // If we deleted the primary contact, promote another contact to primary
      if (targetContact.isPrimary) {
        const nextContact = client.contacts.find((c) => c.id !== contactId);
        if (nextContact) {
          await tx.contact.update({
            where: { id: nextContact.id },
            data: { isPrimary: true },
          });
        }
      }
    });

    revalidatePath(`/dashboard/clients/${clientId}`);
    revalidatePath('/dashboard/clients');

    return { success: true };
  } catch (err) {
    console.error('Failed to delete contact:', err);
    return { error: 'An unexpected error occurred.' };
  }
}
