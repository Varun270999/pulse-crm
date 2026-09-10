'use server';

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { executeAction } from '@/lib/actionWrapper';
import { logActivity } from '@/lib/activityLog';

function maskApiKey(key: string): string {
  if (key.length <= 12) return 'pulse_live_••••••••';
  const prefix = key.slice(0, 11); // "pulse_live_"
  const suffix = key.slice(-4);
  return `${prefix}••••••••••••••••${suffix}`;
}

/**
 * Returns all API keys with masked secret values (ADMIN only).
 */
export async function getApiKeysAction() {
  return executeAction('getApiKeysAction', async () => {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { error: 'Unauthorized: Only administrators can view API keys.' };
    }

    const keys = await prisma.apiKey.findMany({
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const maskedKeys = keys.map((k) => ({
      id: k.id,
      label: k.label,
      maskedKey: maskApiKey(k.key),
      isActive: k.isActive,
      createdById: k.createdById,
      createdByName: k.createdBy.name,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
    }));

    return { success: true, keys: maskedKeys };
  });
}

/**
 * Generates and saves a new API key. Returns the unmasked key ONCE (ADMIN only).
 */
export async function createApiKeyAction(label: string) {
  return executeAction('createApiKeyAction', async () => {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { error: 'Unauthorized: Only administrators can create API keys.' };
    }

    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      return { error: 'Please provide a descriptive label for the API key.' };
    }

    // Generate secure random key: "pulse_live_" + 48 hex characters (24 bytes)
    const rawKey = `pulse_live_${crypto.randomBytes(24).toString('hex')}`;

    const created = await prisma.apiKey.create({
      data: {
        key: rawKey,
        label: trimmedLabel,
        isActive: true,
        createdById: session.user.id,
      },
    });

    logActivity({
      userId: session.user.id,
      action: 'API_KEY_GENERATED',
      entityType: 'ApiKey',
      entityId: created.id,
      description: `Generated API key "${trimmedLabel}"`,
    });

    revalidatePath('/dashboard/settings/api-keys');
    revalidatePath('/dashboard/settings');

    return {
      success: true,
      rawKey,
      key: {
        id: created.id,
        label: created.label,
        maskedKey: maskApiKey(rawKey),
        isActive: created.isActive,
        createdById: created.createdById,
        createdByName: session.user.name,
        createdAt: created.createdAt,
      },
    };
  });
}

/**
 * Toggles the active status of an API key (ADMIN only).
 */
export async function toggleApiKeyStatusAction(id: string, isActive: boolean) {
  return executeAction('toggleApiKeyStatusAction', async () => {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { error: 'Unauthorized: Only administrators can update API keys.' };
    }

    await prisma.apiKey.update({
      where: { id },
      data: { isActive },
    });

    logActivity({
      userId: session.user.id,
      action: isActive ? 'API_KEY_ACTIVATED' : 'API_KEY_REVOKED',
      entityType: 'ApiKey',
      entityId: id,
      description: `${isActive ? 'Activated' : 'Revoked'} API key`,
    });

    revalidatePath('/dashboard/settings/api-keys');
    revalidatePath('/dashboard/settings');

    return { success: true };
  });
}

/**
 * Permanently deletes an API key (ADMIN only).
 */
export async function deleteApiKeyAction(id: string) {
  return executeAction('deleteApiKeyAction', async () => {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { error: 'Unauthorized: Only administrators can delete API keys.' };
    }

    await prisma.apiKey.delete({
      where: { id },
    });

    logActivity({
      userId: session.user.id,
      action: 'API_KEY_DELETED',
      entityType: 'ApiKey',
      entityId: id,
      description: `Permanently deleted API key`,
    });

    revalidatePath('/dashboard/settings/api-keys');
    revalidatePath('/dashboard/settings');

    return { success: true };
  });
}
