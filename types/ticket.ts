export type TicketStatusType =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'RESOLVED'
  | 'CLOSED';

export type TicketPriorityType = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TicketCategoryType =
  | 'TECHNICAL'
  | 'BILLING'
  | 'GENERAL'
  | 'FEATURE_REQUEST'
  | 'OTHER';

export const ticketStatuses: TicketStatusType[] = [
  'OPEN',
  'IN_PROGRESS',
  'ON_HOLD',
  'RESOLVED',
  'CLOSED',
];

export const ticketPriorities: TicketPriorityType[] = [
  'URGENT',
  'HIGH',
  'MEDIUM',
  'LOW',
];

export const ticketCategories: TicketCategoryType[] = [
  'TECHNICAL',
  'BILLING',
  'GENERAL',
  'FEATURE_REQUEST',
  'OTHER',
];

export interface BadgeConfig {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const TICKET_STATUS_CONFIG: Record<TicketStatusType, BadgeConfig> = {
  OPEN: {
    label: 'Open',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    badgeText: 'text-blue-700 dark:text-blue-400',
    badgeBorder: 'border-blue-200 dark:border-blue-800',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    badgeText: 'text-indigo-700 dark:text-indigo-400',
    badgeBorder: 'border-indigo-200 dark:border-indigo-800',
  },
  ON_HOLD: {
    label: 'On Hold',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
    badgeText: 'text-purple-700 dark:text-purple-400',
    badgeBorder: 'border-purple-200 dark:border-purple-800',
  },
  RESOLVED: {
    label: 'Resolved',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-400',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800',
  },
  CLOSED: {
    label: 'Closed',
    badgeBg: 'bg-slate-50 dark:bg-slate-900/40',
    badgeText: 'text-slate-700 dark:text-slate-400',
    badgeBorder: 'border-slate-200 dark:border-slate-800',
  },
};

export interface PriorityConfig extends BadgeConfig {
  slaHours: number;
}

export const TICKET_PRIORITY_CONFIG: Record<TicketPriorityType, PriorityConfig> = {
  URGENT: {
    label: 'Urgent',
    slaHours: 4,
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
    badgeText: 'text-rose-700 dark:text-rose-400',
    badgeBorder: 'border-rose-200 dark:border-rose-800',
  },
  HIGH: {
    label: 'High',
    slaHours: 24,
    badgeBg: 'bg-orange-50 dark:bg-orange-950/40',
    badgeText: 'text-orange-700 dark:text-orange-400',
    badgeBorder: 'border-orange-200 dark:border-orange-800',
  },
  MEDIUM: {
    label: 'Medium',
    slaHours: 48,
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-700 dark:text-amber-400',
    badgeBorder: 'border-amber-200 dark:border-amber-800',
  },
  LOW: {
    label: 'Low',
    slaHours: 72,
    badgeBg: 'bg-slate-50 dark:bg-slate-900/40',
    badgeText: 'text-slate-700 dark:text-slate-400',
    badgeBorder: 'border-slate-200 dark:border-slate-800',
  },
};

export const TICKET_CATEGORY_CONFIG: Record<TicketCategoryType, BadgeConfig> = {
  TECHNICAL: {
    label: 'Technical',
    badgeBg: 'bg-cyan-50 dark:bg-cyan-950/40',
    badgeText: 'text-cyan-700 dark:text-cyan-400',
    badgeBorder: 'border-cyan-200 dark:border-cyan-800',
  },
  BILLING: {
    label: 'Billing',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-400',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800',
  },
  GENERAL: {
    label: 'General',
    badgeBg: 'bg-slate-50 dark:bg-slate-900/40',
    badgeText: 'text-slate-700 dark:text-slate-400',
    badgeBorder: 'border-slate-200 dark:border-slate-800',
  },
  FEATURE_REQUEST: {
    label: 'Feature Request',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
    badgeText: 'text-purple-700 dark:text-purple-400',
    badgeBorder: 'border-purple-200 dark:border-purple-800',
  },
  OTHER: {
    label: 'Other',
    badgeBg: 'bg-zinc-50 dark:bg-zinc-900/40',
    badgeText: 'text-zinc-700 dark:text-zinc-400',
    badgeBorder: 'border-zinc-200 dark:border-zinc-800',
  },
};

/**
 * Computes ticket SLA dueBy date from creation date based on priority
 */
export function computeTicketDueBy(createdAt: Date, priority: TicketPriorityType): Date {
  const due = new Date(createdAt.getTime());
  const hours = TICKET_PRIORITY_CONFIG[priority]?.slaHours || 48;
  due.setHours(due.getHours() + hours);
  return due;
}

export interface TicketReplyData {
  id: string;
  ticketId: string;
  authorId: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
  author: {
    id: string;
    name: string;
    email?: string;
    role?: string;
    avatarUrl?: string | null;
  };
}

export interface SupportTicketData {
  id: string;
  ticketNumber: string;
  clientId: string;
  contactId: string | null;
  subject: string;
  description: string;
  status: TicketStatusType;
  priority: TicketPriorityType;
  category: TicketCategoryType;
  assignedToId: string | null;
  createdById: string;
  dueBy: string;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    companyName: string;
    email?: string | null;
    phone?: string | null;
  };
  contact?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    designation?: string | null;
  } | null;
  assignedTo?: {
    id: string;
    name: string;
    email?: string;
    role?: string;
    avatarUrl?: string | null;
  } | null;
  createdBy: {
    id: string;
    name: string;
    role?: string;
  };
  replies?: TicketReplyData[];
}

export interface TicketStats {
  openCount: number;
  inProgressCount: number;
  overdueCount: number;
  resolvedCount: number;
  totalCount: number;
}
