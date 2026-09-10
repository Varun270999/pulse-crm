import { requireRole } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { EmployeeStatsCards } from '@/components/employees/employee-stats-cards';
import { EmployeeTable } from '@/components/employees/employee-table';
import type { EmployeeData } from '@/types/employee';

export const metadata = {
  title: 'Employee Management | Pulse CRM',
};

export default async function EmployeesPage() {
  // Strict ADMIN-only RBAC guard
  const session = await requireRole(['ADMIN']);

  const users = await prisma.user.findMany({
    orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
  });

  const serializedEmployees: EmployeeData[] = users.map((u) => ({
    id: u.id,
    employeeId: u.employeeId,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.department,
    phone: u.phone,
    joiningDate: u.joiningDate ? u.joiningDate.toISOString() : null,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Employee & Role Management
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Administer staff accounts, operational roles, credentials, and access statuses.
        </p>
      </div>

      {/* KPI Stats */}
      <EmployeeStatsCards employees={serializedEmployees} />

      {/* Table with search, filters, actions */}
      <EmployeeTable
        initialEmployees={serializedEmployees}
        currentUserId={session.user.id}
      />
    </div>
  );
}
