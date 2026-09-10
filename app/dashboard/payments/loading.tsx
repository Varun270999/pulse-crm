import { TableSkeleton } from '@/components/ui/skeleton';

export default function PaymentsLoading() {
  return <TableSkeleton columns={6} rowCount={8} />;
}
