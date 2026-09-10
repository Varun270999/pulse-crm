import { prisma } from '@/lib/prisma';

export interface LogActivityParams {
  userId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  description: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  request?: Request | null;
}

/**
 * Fire-and-forget activity logger.
 * Captures user actions, entity modifications, and security events.
 * Never throws an error or halts main application execution.
 */
export async function logActivity({
  userId,
  action,
  entityType,
  entityId,
  description,
  ipAddress,
  userAgent,
  request,
}: LogActivityParams): Promise<void> {
  try {
    let resolvedIp = ipAddress || null;
    let resolvedUserAgent = userAgent || null;

    // 1. Try reading from provided request
    if (request) {
      resolvedIp =
        resolvedIp ||
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        null;
      resolvedUserAgent = resolvedUserAgent || request.headers.get('user-agent') || null;
    }

    // 2. Fall back to Next.js headers() if available in server action context
    if (!resolvedIp || !resolvedUserAgent) {
      try {
        const { headers } = await import('next/headers');
        const headerList = headers();
        if (!resolvedIp) {
          resolvedIp =
            headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            headerList.get('x-real-ip') ||
            null;
        }
        if (!resolvedUserAgent) {
          resolvedUserAgent = headerList.get('user-agent') || null;
        }
      } catch {
        // headers() is unavailable in certain background/worker contexts
      }
    }

    // 3. Persist record in database
    await prisma.activityLog.create({
      data: {
        userId: userId || null,
        action,
        entityType: entityType || null,
        entityId: entityId || null,
        description,
        ipAddress: resolvedIp,
        userAgent: resolvedUserAgent,
      },
    });
  } catch (err) {
    // Non-blocking logging failure
    console.error('[ActivityLog Error] Failed to write log entry:', err);
  }
}

export { getSecurityLogsAction, type SecurityLogsFilterParams } from '@/app/actions/security';
