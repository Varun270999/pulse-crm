import { requireRole, ALL_ROLES } from '@/lib/auth/rbac';
import { getNotificationsAction } from '@/app/actions/notifications';
import { NotificationCenterView } from '@/components/notifications/notification-center-view';
import type { NotificationType } from '@prisma/client';

export const metadata = {
  title: 'Notifications | Pulse CRM',
};

interface NotificationsPageProps {
  searchParams?: {
    page?: string;
    read?: 'all' | 'unread' | 'read';
    type?: string;
  };
}

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
  // Accessible to all authenticated CRM users
  await requireRole(ALL_ROLES);

  const page = searchParams?.page ? parseInt(searchParams.page, 10) : 1;
  const filterRead = searchParams?.read || 'all';
  const filterType = (searchParams?.type || 'ALL') as NotificationType | 'ALL';

  const res = await getNotificationsAction({
    page: isNaN(page) || page < 1 ? 1 : page,
    pageSize: 15,
    filterRead,
    filterType,
  });

  return (
    <div className="max-w-5xl mx-auto py-2">
      <NotificationCenterView
        initialNotifications={res.notifications}
        initialTotalCount={res.totalCount}
        initialTotalPages={res.totalPages}
        initialCurrentPage={res.currentPage}
        initialUnreadCount={res.unreadCount}
        currentFilterRead={filterRead}
        currentFilterType={filterType}
      />
    </div>
  );
}
