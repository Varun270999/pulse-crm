import { TableSkeleton } from '@/components/ui/skeleton';

export default function NotificationsLoading() {
  return <TableSkeleton columns={4} rowCount={6} />;
}
