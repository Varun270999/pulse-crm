'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { checkDueFollowUpsAndOverdueInvoices } from '@/lib/notifications';
import type { NotificationType, Prisma } from '@prisma/client';

export interface GetNotificationsParams {
  page?: number;
  pageSize?: number;
  filterRead?: 'all' | 'unread' | 'read';
  filterType?: NotificationType | 'ALL';
}

/**
 * Returns count of unread notifications for current user.
 * Runs checkDueFollowUpsAndOverdueInvoices automatically before counting.
 */
export async function getUnreadNotificationCountAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, count: 0 };
    }

    const userId = session.user.id;

    // Trigger scheduled checks (de-duplicated within 20 hours internally)
    await checkDueFollowUpsAndOverdueInvoices(userId);

    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return { success: true, count };
  } catch (err) {
    console.error('Failed to get unread notification count:', err);
    return { success: false, count: 0 };
  }
}

/**
 * Returns the top 10 recent notifications for current user (used in top-bar dropdown).
 */
export async function getRecentNotificationsAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, notifications: [] };
    }

    const userId = session.user.id;

    // Trigger scheduled checks
    await checkDueFollowUpsAndOverdueInvoices(userId);

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return { success: true, notifications };
  } catch (err) {
    console.error('Failed to get recent notifications:', err);
    return { success: false, notifications: [] };
  }
}

/**
 * Paginated notification listing for the Notification Center.
 */
export async function getNotificationsAction({
  page = 1,
  pageSize = 15,
  filterRead = 'all',
  filterType = 'ALL',
}: GetNotificationsParams = {}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        notifications: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: page,
        unreadCount: 0,
      };
    }

    const userId = session.user.id;

    // Trigger background check
    await checkDueFollowUpsAndOverdueInvoices(userId);

    const where: Prisma.NotificationWhereInput = {
      userId,
    };

    if (filterRead === 'unread') {
      where.isRead = false;
    } else if (filterRead === 'read') {
      where.isRead = true;
    }

    if (filterType && filterType !== 'ALL') {
      where.type = filterType as NotificationType;
    }

    const [totalCount, unreadCount, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    return {
      success: true,
      notifications,
      totalCount,
      totalPages,
      currentPage: page,
      unreadCount,
    };
  } catch (err) {
    console.error('Failed to get notifications:', err);
    return {
      success: false,
      notifications: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: page,
      unreadCount: 0,
    };
  }
}

/**
 * Marks a specific notification as read.
 */
export async function markNotificationAsReadAction(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!notification || notification.userId !== session.user.id) {
      return { success: false, error: 'Notification not found' };
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    revalidatePath('/dashboard/notifications');
    return { success: true };
  } catch (err) {
    console.error('Failed to mark notification as read:', err);
    return { success: false, error: 'Failed to update notification' };
  }
}

/**
 * Marks all unread notifications as read for current user.
 */
export async function markAllNotificationsAsReadAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    revalidatePath('/dashboard/notifications');
    return { success: true };
  } catch (err) {
    console.error('Failed to mark all notifications as read:', err);
    return { success: false, error: 'Failed to update notifications' };
  }
}

/**
 * Gets user notification preferences.
 */
export async function getUserNotificationPreferencesAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, preferences: null };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        notifyOnLeadAssigned: true,
        notifyOnDealUpdates: true,
        notifyOnFollowUps: true,
        notifyOnTickets: true,
        notifyOnPayments: true,
      },
    });

    return { success: true, preferences: user };
  } catch (err) {
    console.error('Failed to get notification preferences:', err);
    return { success: false, preferences: null };
  }
}

export interface UpdatePreferencesInput {
  notifyOnLeadAssigned: boolean;
  notifyOnDealUpdates: boolean;
  notifyOnFollowUps: boolean;
  notifyOnTickets: boolean;
  notifyOnPayments: boolean;
}

/**
 * Updates user notification preferences.
 */
export async function updateNotificationPreferencesAction(data: UpdatePreferencesInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        notifyOnLeadAssigned: Boolean(data.notifyOnLeadAssigned),
        notifyOnDealUpdates: Boolean(data.notifyOnDealUpdates),
        notifyOnFollowUps: Boolean(data.notifyOnFollowUps),
        notifyOnTickets: Boolean(data.notifyOnTickets),
        notifyOnPayments: Boolean(data.notifyOnPayments),
      },
    });

    revalidatePath('/dashboard/profile');
    return { success: true };
  } catch (err) {
    console.error('Failed to update notification preferences:', err);
    return { success: false, error: 'Failed to save preferences' };
  }
}
