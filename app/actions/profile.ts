'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import {
  changePasswordSchema,
  updateEmailSchema,
  type ChangePasswordInput,
  type UpdateEmailInput,
} from '@/lib/schemas';
import { logActivity } from '@/lib/activityLog';
import { executeAction } from '@/lib/actionWrapper';

export async function changePasswordAction(data: ChangePasswordInput) {
  return executeAction('changePasswordAction', async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required. Please sign in.' };
    }

    const parseResult = changePasswordSchema.safeParse(data);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Invalid input data';
      return { success: false, error: firstError };
    }

    const { currentPassword, newPassword } = parseResult.data;

    // Fetch user from database to verify current password hash
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      return { success: false, error: 'User account not found.' };
    }

    // Verify current password with bcrypt
    const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Hash the new password with bcrypt
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Save updated password hash
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    // Log in ActivityLog
    await logActivity({
      userId: user.id,
      action: 'PASSWORD_CHANGED',
      entityType: 'User',
      entityId: user.id,
      description: `User changed password: ${user.name} (${user.email})`,
    });

    revalidatePath('/dashboard/profile');
    return { success: true, message: 'Password updated successfully.' };
  });
}

export async function updateEmailAction(data: UpdateEmailInput) {
  return executeAction('updateEmailAction', async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required. Please sign in.' };
    }

    const parseResult = updateEmailSchema.safeParse(data);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Invalid input data';
      return { success: false, error: firstError };
    }

    const { currentPassword } = parseResult.data;
    const newEmail = parseResult.data.newEmail.trim().toLowerCase();

    // Fetch user from DB to verify current password hash and email
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      return { success: false, error: 'User account not found.' };
    }

    // Verify current password with bcrypt
    const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Check if new email is identical to current email
    if (newEmail === user.email.toLowerCase()) {
      return {
        success: false,
        error: 'The new email address is identical to your current email address.',
      };
    }

    // Check unique constraint across all users
    const existingUser = await prisma.user.findFirst({
      where: {
        email: { equals: newEmail, mode: 'insensitive' },
        NOT: { id: user.id },
      },
      select: { id: true },
    });

    if (existingUser) {
      return { success: false, error: 'This email is already in use' };
    }

    const oldEmail = user.email;

    // Update email in database
    await prisma.user.update({
      where: { id: user.id },
      data: { email: newEmail },
    });

    // Log the event in ActivityLog with old and new email in description
    await logActivity({
      userId: user.id,
      action: 'EMAIL_CHANGED',
      entityType: 'User',
      entityId: user.id,
      description: `User email updated from ${oldEmail} to ${newEmail} for ${user.name}`,
    });

    revalidatePath('/dashboard/profile');
    return {
      success: true,
      message: 'Your email has been updated. Please use this new email to log in next time.',
      newEmail,
    };
  });
}
