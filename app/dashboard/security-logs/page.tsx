import { requireRole } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { getSecurityLogsAction } from '@/lib/activityLog';
import { SecurityLogsViewer } from '@/components/security/security-logs-viewer';

export const metadata = {
  title: 'Security & Activity Logs | Pulse CRM',
};

interface PageProps {
  searchParams: {
    page?: string;
    pageSize?: string;
    search?: string;
    actionFilter?: string;
    userFilter?: string;
    dateRange?: 'all' | 'today' | '7d' | '30d';
  };
}

export default async function SecurityLogsPage({ searchParams }: PageProps) {
  // Strict RBAC: Enforce ADMIN-only access
  await requireRole(['ADMIN']);

  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const pageSize = searchParams.pageSize ? parseInt(searchParams.pageSize, 10) : 20;

  const [logsResult, users] = await Promise.all([
    getSecurityLogsAction({
      page,
      pageSize,
      search: searchParams.search,
      actionFilter: searchParams.actionFilter,
      userFilter: searchParams.userFilter,
      dateRange: searchParams.dateRange,
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <SecurityLogsViewer
      initialLogs={JSON.parse(JSON.stringify(logsResult.logs || []))}
      initialPagination={
        logsResult.pagination || { page: 1, pageSize: 20, totalCount: 0, totalPages: 1 }
      }
      initialStats={
        logsResult.stats || {
          failedLoginsLast24h: 0,
          totalActionsLast24h: 0,
          mostActiveUser: null,
        }
      }
      users={users}
    />
  );
}
