import type { UserRole } from '@/lib/auth/rbac';

export interface EmployeeData {
  id: string;
  employeeId: string | null;
  name: string;
  email: string;
  role: UserRole;
  department: string | null;
  phone: string | null;
  joiningDate: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceSnapshotData {
  role: UserRole;
  // Sales Metrics
  assignedClientsCount: number;
  activeLeadsCount: number;
  openDealsCount: number;
  openDealsValue: number;
  // Support Metrics
  assignedOpenTicketsCount: number;
  totalAssignedTicketsCount: number;
  resolvedTicketsCount: number;
  // General Metrics
  createdClientsCount: number;
  createdTicketsCount: number;
}

export const ROLE_CONFIG: Record<
  UserRole,
  { label: string; badgeClass: string; description: string }
> = {
  ADMIN: {
    label: 'Admin',
    badgeClass: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900',
    description: 'Full system administration and user access control',
  },
  MANAGER: {
    label: 'Manager',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900',
    description: 'Team oversight, sales management, and reporting',
  },
  SALES_EXECUTIVE: {
    label: 'Sales Executive',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900',
    description: 'Direct sales, lead management, and pipeline tracking',
  },
  SUPPORT_AGENT: {
    label: 'Support Agent',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900',
    description: 'Customer inquiries, troubleshooting, and ticket resolution',
  },
};
