import { Users, UserCheck, UserX, Briefcase } from 'lucide-react';
import type { EmployeeData } from '@/types/employee';

interface EmployeeStatsCardsProps {
  employees: EmployeeData[];
}

export function EmployeeStatsCards({ employees }: EmployeeStatsCardsProps) {
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.isActive).length;
  const inactiveEmployees = totalEmployees - activeEmployees;

  // Department counts
  const departments = new Set(
    employees.map((e) => e.department).filter(Boolean) as string[]
  ).size;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Employees */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Total Staff
          </p>
          <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            <Users className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
          {totalEmployees}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          All registered internal accounts
        </p>
      </div>

      {/* Active Accounts */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Active Accounts
          </p>
          <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
          {activeEmployees}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Authorized to sign in
        </p>
      </div>

      {/* Inactive Accounts */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Inactive / Suspended
          </p>
          <div className="rounded-xl bg-gray-100 p-2.5 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            <UserX className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
          {inactiveEmployees}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Access blocked; history preserved
        </p>
      </div>

      {/* Departments */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Departments
          </p>
          <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
            <Briefcase className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-3 text-2xl font-bold tracking-tight text-foreground">
          {departments}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Active operational teams
        </p>
      </div>
    </div>
  );
}
