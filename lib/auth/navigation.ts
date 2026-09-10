export type UserRole = 'ADMIN' | 'MANAGER' | 'SALES_EXECUTIVE' | 'SUPPORT_AGENT';

export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  allowedRoles: UserRole[];
  badge?: string;
}

export const ALL_ROLES: UserRole[] = ['ADMIN', 'MANAGER', 'SALES_EXECUTIVE', 'SUPPORT_AGENT'];

export const NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    iconName: 'LayoutDashboard',
    allowedRoles: ALL_ROLES,
  },
  {
    title: 'Clients',
    href: '/dashboard/clients',
    iconName: 'Users',
    allowedRoles: ALL_ROLES,
  },
  {
    title: 'Leads',
    href: '/dashboard/leads',
    iconName: 'UserPlus',
    allowedRoles: ['ADMIN', 'MANAGER', 'SALES_EXECUTIVE'],
  },
  {
    title: 'Follow-ups',
    href: '/dashboard/follow-ups',
    iconName: 'Clock',
    allowedRoles: ['ADMIN', 'MANAGER', 'SALES_EXECUTIVE'],
  },
  {
    title: 'Sales Pipeline',
    href: '/dashboard/pipeline',
    iconName: 'Kanban',
    allowedRoles: ['ADMIN', 'MANAGER', 'SALES_EXECUTIVE'],
  },
  {
    title: 'Quotations & Invoices',
    href: '/dashboard/invoices',
    iconName: 'Receipt',
    allowedRoles: ['ADMIN', 'MANAGER', 'SALES_EXECUTIVE'],
  },
  {
    title: 'Payments',
    href: '/dashboard/payments',
    iconName: 'CreditCard',
    allowedRoles: ALL_ROLES,
  },
  {
    title: 'Support Tickets',
    href: '/dashboard/tickets',
    iconName: 'LifeBuoy',
    allowedRoles: ALL_ROLES,
  },
  {
    title: 'Employees',
    href: '/dashboard/employees',
    iconName: 'Briefcase',
    allowedRoles: ['ADMIN'],
  },
  {
    title: 'Reports & Analytics',
    href: '/dashboard/reports',
    iconName: 'BarChart3',
    allowedRoles: ['ADMIN', 'MANAGER', 'SALES_EXECUTIVE'],
  },
  {
    title: 'Notifications',
    href: '/dashboard/notifications',
    iconName: 'Bell',
    allowedRoles: ALL_ROLES,
  },
  {
    title: 'Security Logs',
    href: '/dashboard/security-logs',
    iconName: 'ShieldAlert',
    allowedRoles: ['ADMIN'],
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    iconName: 'Settings',
    allowedRoles: ['ADMIN'],
  },
];

/**
 * Checks if a given role is within the allowed roles list.
 */
export function hasRoleAccess(role: string | undefined | null, allowedRoles: UserRole[]): boolean {
  if (!role) return false;
  return allowedRoles.includes(role as UserRole);
}

/**
 * Returns the list of navigation items accessible to the specified role.
 */
export function getNavItemsForRole(role: string | undefined | null): NavItem[] {
  if (!role) return [];
  return NAV_ITEMS.filter((item) => hasRoleAccess(role, item.allowedRoles));
}
