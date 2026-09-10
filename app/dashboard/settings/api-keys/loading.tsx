import { TableSkeleton } from '@/components/ui/skeleton';

export default function ApiKeysLoading() {
  return <TableSkeleton columns={5} rowCount={5} />;
}
