import { TableSkeleton } from '@/components/ui/skeleton';

export default function FollowUpsLoading() {
  return <TableSkeleton columns={5} rowCount={6} />;
}
