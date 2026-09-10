import { TableSkeleton } from '@/components/ui/skeleton';

export default function EmployeesLoading() {
  return <TableSkeleton columns={6} rowCount={8} />;
}
