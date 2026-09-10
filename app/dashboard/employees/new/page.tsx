import { requireRole } from '@/lib/auth/rbac';
import { EmployeeForm } from '@/components/employees/employee-form';

export const metadata = {
  title: 'Add New Employee | Pulse CRM',
};

export default async function NewEmployeePage() {
  // Strict ADMIN-only RBAC guard
  await requireRole(['ADMIN']);

  return (
    <div className="py-2">
      <EmployeeForm />
    </div>
  );
}
