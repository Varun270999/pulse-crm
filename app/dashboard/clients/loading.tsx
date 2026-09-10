import { TableSkeleton } from '@/components/ui/skeleton';

export default function ClientsLoading() {
  return <TableSkeleton columns={5} rowCount={8} />;
}
