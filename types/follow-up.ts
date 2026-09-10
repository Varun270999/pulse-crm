export type FollowUpType = 'CALL' | 'EMAIL' | 'MEETING' | 'TASK' | 'OTHER';
export type FollowUpStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';
export type RecurrencePattern = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface FollowUpData {
  id: string;
  title: string;
  description: string | null;
  type: FollowUpType;
  dueDate: string;
  status: FollowUpStatus;
  leadId: string | null;
  clientId: string | null;
  assignedToId: string;
  createdById: string;
  isRecurring: boolean;
  recurrencePattern: RecurrencePattern | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lead?: {
    id: string;
    name: string;
    companyName: string | null;
  } | null;
  client?: {
    id: string;
    companyName: string;
  } | null;
  assignedTo: {
    id: string;
    name: string;
    role: string;
    email: string;
  };
  createdBy: {
    id: string;
    name: string;
  };
}

export const FOLLOW_UP_TYPES: FollowUpType[] = ['CALL', 'EMAIL', 'MEETING', 'TASK', 'OTHER'];
export const FOLLOW_UP_STATUSES: FollowUpStatus[] = ['PENDING', 'COMPLETED', 'CANCELLED'];
export const RECURRENCE_PATTERNS: RecurrencePattern[] = ['DAILY', 'WEEKLY', 'MONTHLY'];

export const TYPE_CONFIG: Record<
  FollowUpType,
  {
    label: string;
    iconName: string;
    badgeBg: string;
    color: string;
  }
> = {
  CALL: {
    label: 'Call',
    iconName: 'PhoneCall',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    color: 'text-blue-600',
  },
  EMAIL: {
    label: 'Email',
    iconName: 'Mail',
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    color: 'text-indigo-600',
  },
  MEETING: {
    label: 'Meeting',
    iconName: 'CalendarDays',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    color: 'text-purple-600',
  },
  TASK: {
    label: 'Task',
    iconName: 'CheckSquare',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    color: 'text-emerald-600',
  },
  OTHER: {
    label: 'Other',
    iconName: 'Clock',
    badgeBg: 'bg-gray-100 text-gray-700 border-gray-200',
    color: 'text-gray-600',
  },
};

export const STATUS_CONFIG: Record<
  FollowUpStatus,
  {
    label: string;
    badgeBg: string;
  }
> = {
  PENDING: {
    label: 'Pending',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  COMPLETED: {
    label: 'Completed',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  CANCELLED: {
    label: 'Cancelled',
    badgeBg: 'bg-gray-100 text-gray-500 border-gray-200',
  },
};

export const RECURRENCE_LABELS: Record<RecurrencePattern, string> = {
  DAILY: 'Repeats Daily',
  WEEKLY: 'Repeats Weekly',
  MONTHLY: 'Repeats Monthly',
};

export function isOverdue(dueDate: string | Date, status: FollowUpStatus): boolean {
  if (status !== 'PENDING') return false;
  return new Date(dueDate).getTime() < Date.now();
}

export function isDueToday(dueDate: string | Date, status: FollowUpStatus): boolean {
  if (status !== 'PENDING') return false;
  const d = new Date(dueDate);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function formatDueDateTime(dateStr: string | Date): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
