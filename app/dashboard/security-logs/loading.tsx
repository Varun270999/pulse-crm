import { TableSkeleton } from '@/components/ui/skeleton';

export default function SecurityLogsLoading() {
  return <TableSkeleton columns={6} rowCount={8} />;
}
