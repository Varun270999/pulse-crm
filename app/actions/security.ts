'use server';

import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/rbac';
import type { Prisma } from '@prisma/client';

export interface SecurityLogsFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  actionFilter?: string;
  userFilter?: string;
  dateRange?: 'all' | 'today' | '7d' | '30d';
}

/**
 * Server action to query security and activity audit logs (ADMIN only).
 */
export async function getSecurityLogsAction({
  page = 1,
  pageSize = 20,
  search,
  actionFilter,
  userFilter,
  dateRange = 'all',
}: SecurityLogsFilterParams = {}) {
  try {
    await requireRole(['ADMIN']);

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Build Prisma query filter
    const where: Prisma.ActivityLogWhereInput = {};

    // Date range filtering
    if (dateRange === 'today') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      where.createdAt = { gte: startOfToday };
    } else if (dateRange === '7d') {
      where.createdAt = { gte: sevenDaysAgo };
    } else if (dateRange === '30d') {
      where.createdAt = { gte: thirtyDaysAgo };
    }

    // Action filter
    if (actionFilter && actionFilter !== 'ALL') {
      if (actionFilter === 'AUTH') {
        where.action = {
          in: ['USER_LOGIN', 'USER_LOGIN_FAILED', 'RATE_LIMIT_EXCEEDED', 'USER_LOGOUT'],
        };
      } else if (actionFilter === 'CLIENT') {
        where.action = { in: ['CLIENT_CREATED', 'CLIENT_UPDATED', 'CLIENT_DELETED'] };
      } else if (actionFilter === 'DEAL') {
        where.action = { in: ['DEAL_STAGE_CHANGED', 'DEAL_CREATED', 'DEAL_DELETED'] };
      } else if (actionFilter === 'BILLING') {
        where.action = {
          in: ['INVOICE_CREATED', 'INVOICE_DELETED', 'PAYMENT_RECORDED', 'PAYMENT_DELETED'],
        };
      } else if (actionFilter === 'EMPLOYEE') {
        where.action = {
          in: [
            'EMPLOYEE_CREATED',
            'EMPLOYEE_ROLE_CHANGED',
            'EMPLOYEE_DEACTIVATED',
            'EMPLOYEE_REACTIVATED',
            'EMPLOYEE_PASSWORD_RESET',
          ],
        };
      } else if (actionFilter === 'INTEGRATION') {
        where.action = {
          in: ['API_KEY_GENERATED', 'API_KEY_REVOKED', 'API_KEY_DELETED', 'DATA_EXPORTED'],
        };
      } else {
        where.action = actionFilter;
      }
    }

    // User filter
    if (userFilter && userFilter !== 'ALL') {
      if (userFilter === 'SYSTEM') {
        where.userId = null;
      } else {
        where.userId = userFilter;
      }
    }

    // Search query (matches description, user name, or email)
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { description: { contains: q, mode: 'insensitive' } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { action: { contains: q, mode: 'insensitive' } },
        { ipAddress: { contains: q } },
      ];
    }

    const currentPage = Math.max(1, page);
    const limit = Math.max(1, Math.min(100, pageSize));

    // Parallel queries for logs and KPI stats
    const [totalCount, logs, failedLoginsLast24h, totalActionsLast24h, activeUsers] =
      await Promise.all([
        prisma.activityLog.count({ where }),
        prisma.activityLog.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (currentPage - 1) * limit,
          take: limit,
        }),
        prisma.activityLog.count({
          where: {
            action: { in: ['USER_LOGIN_FAILED', 'RATE_LIMIT_EXCEEDED'] },
            createdAt: { gte: twentyFourHoursAgo },
          },
        }),
        prisma.activityLog.count({
          where: {
            createdAt: { gte: twentyFourHoursAgo },
          },
        }),
        prisma.activityLog.groupBy({
          by: ['userId'],
          where: {
            userId: { not: null },
            createdAt: { gte: sevenDaysAgo },
          },
          _count: {
            id: true,
          },
          orderBy: {
            _count: {
              id: 'desc',
            },
          },
          take: 1,
        }),
      ]);

    // Resolve most active user details
    let mostActiveUser: { name: string; email: string; actionCount: number } | null = null;
    if (activeUsers.length > 0 && activeUsers[0].userId) {
      const topUserId = activeUsers[0].userId;
      const count = activeUsers[0]._count.id;
      const topUserRecord = await prisma.user.findUnique({
        where: { id: topUserId },
        select: { name: true, email: true },
      });
      if (topUserRecord) {
        mostActiveUser = {
          name: topUserRecord.name,
          email: topUserRecord.email,
          actionCount: count,
        };
      }
    }

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return {
      success: true,
      logs,
      pagination: {
        page: currentPage,
        pageSize: limit,
        totalCount,
        totalPages,
      },
      stats: {
        failedLoginsLast24h,
        totalActionsLast24h,
        mostActiveUser,
      },
    };
  } catch (err) {
    console.error('[getSecurityLogsAction Error]', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to retrieve security logs',
      logs: [],
      pagination: { page: 1, pageSize: 20, totalCount: 0, totalPages: 1 },
      stats: { failedLoginsLast24h: 0, totalActionsLast24h: 0, mostActiveUser: null },
    };
  }
}
