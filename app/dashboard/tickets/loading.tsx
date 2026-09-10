import { TableSkeleton } from '@/components/ui/skeleton';

export default function TicketsLoading() {
  return <TableSkeleton columns={6} rowCount={8} />;
}
