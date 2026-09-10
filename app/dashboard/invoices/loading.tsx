import { TableSkeleton } from '@/components/ui/skeleton';

export default function InvoicesLoading() {
  return <TableSkeleton columns={6} rowCount={8} />;
}
