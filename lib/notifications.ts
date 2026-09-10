import { prisma } from '@/lib/prisma';
import type { Prisma, NotificationType } from '@prisma/client';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string | null;
  tx?: Prisma.TransactionClient;
}

/**
 * Creates an in-app notification for a user, respecting their notification preferences.
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  linkUrl,
  tx,
}: CreateNotificationParams) {
  try {
    const db = tx || prisma;

    // Check user preferences
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        notifyOnLeadAssigned: true,
        notifyOnDealUpdates: true,
        notifyOnFollowUps: true,
        notifyOnTickets: true,
        notifyOnPayments: true,
      },
    });

    if (!user) return null;

    // Verify preference mapping
    let isAllowed = true;
    switch (type) {
      case 'LEAD_ASSIGNED':
        isAllowed = user.notifyOnLeadAssigned;
        break;
      case 'DEAL_STAGE_CHANGED':
      case 'DEAL_WON':
        isAllowed = user.notifyOnDealUpdates;
        break;
      case 'FOLLOW_UP_DUE':
        isAllowed = user.notifyOnFollowUps;
        break;
      case 'TICKET_ASSIGNED':
      case 'TICKET_REPLY':
        isAllowed = user.notifyOnTickets;
        break;
      case 'PAYMENT_RECEIVED':
      case 'INVOICE_OVERDUE':
        isAllowed = user.notifyOnPayments;
        break;
      case 'GENERAL':
      default:
        isAllowed = true;
        break;
    }

    if (!isAllowed) {
      return null;
    }

    return await db.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        linkUrl: linkUrl || null,
        isRead: false,
      },
    });
  } catch (err) {
    // Notification failure should never crash the main operation
    console.error('Failed to create notification:', err);
    return null;
  }
}

/**
 * Checks for follow-ups due today and invoices that are overdue for the current user.
 * De-duplicates against notifications sent within the last 20 hours to prevent spam.
 */
export async function checkDueFollowUpsAndOverdueInvoices(userId: string) {
  try {
    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const twentyHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000);

    // 1. Check Follow-ups Due Today
    const dueFollowUps = await prisma.followUp.findMany({
      where: {
        assignedToId: userId,
        status: 'PENDING',
        dueDate: { lte: endOfToday },
      },
      select: { id: true, title: true, dueDate: true },
      take: 10,
    });

    for (const f of dueFollowUps) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId,
          type: 'FOLLOW_UP_DUE',
          message: { contains: f.title },
          createdAt: { gte: twentyHoursAgo },
        },
      });

      if (!existing) {
        await createNotification({
          userId,
          type: 'FOLLOW_UP_DUE',
          title: 'Follow-up Due Today',
          message: `Reminder: "${f.title}" is scheduled for today.`,
          linkUrl: '/dashboard/follow-ups',
        });
      }
    }

    // 2. Check Overdue Invoices
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        OR: [
          { createdById: userId },
          { client: { assignedToId: userId } },
        ],
        dueDate: { lt: now },
        status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
      },
      include: { client: { select: { companyName: true } } },
      take: 10,
    });

    for (const inv of overdueInvoices) {
      // Auto-update status to OVERDUE if needed
      if (inv.status !== 'OVERDUE') {
        await prisma.invoice.update({
          where: { id: inv.id },
          data: { status: 'OVERDUE' },
        });
      }

      const existing = await prisma.notification.findFirst({
        where: {
          userId,
          type: 'INVOICE_OVERDUE',
          linkUrl: `/dashboard/invoices/${inv.id}`,
          createdAt: { gte: twentyHoursAgo },
        },
      });

      if (!existing) {
        const remaining = Math.max(0, Number(inv.totalAmount) - Number(inv.paidAmount));
        const diffDays = Math.max(1, Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24)));

        await createNotification({
          userId,
          type: 'INVOICE_OVERDUE',
          title: 'Invoice Overdue',
          message: `Invoice ${inv.invoiceNumber} for ${inv.client.companyName} is overdue by ${diffDays} day${diffDays > 1 ? 's' : ''} (Balance: ₹${remaining.toLocaleString('en-IN')}).`,
          linkUrl: `/dashboard/invoices/${inv.id}`,
        });
      }
    }
  } catch (err) {
    console.error('Failed to check due follow-ups and overdue invoices:', err);
  }
}
