import {
  UserPlus,
  TrendingUp,
  Award,
  Clock,
  AlertTriangle,
  LifeBuoy,
  MessageSquare,
  Banknote,
  Bell,
  type LucideIcon,
} from 'lucide-react';
import type { NotificationType } from '@prisma/client';

export interface NotificationMeta {
  icon: LucideIcon;
  color: string;
  badgeBg: string;
  badgeText: string;
  label: string;
}

export function getNotificationMeta(type: NotificationType): NotificationMeta {
  switch (type) {
    case 'LEAD_ASSIGNED':
      return {
        icon: UserPlus,
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
        badgeText: 'Lead Assigned',
        label: 'Lead Assigned',
      };
    case 'DEAL_STAGE_CHANGED':
      return {
        icon: TrendingUp,
        color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
        badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        badgeText: 'Deal Stage',
        label: 'Deal Stage Changed',
      };
    case 'DEAL_WON':
      return {
        icon: Award,
        color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        badgeText: 'Deal Won',
        label: 'Deal Won',
      };
    case 'FOLLOW_UP_DUE':
      return {
        icon: Clock,
        color: 'text-amber-600 bg-amber-50 border-amber-200',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
        badgeText: 'Follow-up Due',
        label: 'Follow-up Due',
      };
    case 'INVOICE_OVERDUE':
      return {
        icon: AlertTriangle,
        color: 'text-rose-600 bg-rose-50 border-rose-200',
        badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
        badgeText: 'Invoice Overdue',
        label: 'Invoice Overdue',
      };
    case 'TICKET_ASSIGNED':
      return {
        icon: LifeBuoy,
        color: 'text-purple-600 bg-purple-50 border-purple-200',
        badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
        badgeText: 'Ticket Assigned',
        label: 'Ticket Assigned',
      };
    case 'TICKET_REPLY':
      return {
        icon: MessageSquare,
        color: 'text-sky-600 bg-sky-50 border-sky-200',
        badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
        badgeText: 'Ticket Reply',
        label: 'Ticket Reply',
      };
    case 'PAYMENT_RECEIVED':
      return {
        icon: Banknote,
        color: 'text-green-600 bg-green-50 border-green-200',
        badgeBg: 'bg-green-50 text-green-700 border-green-200',
        badgeText: 'Payment Received',
        label: 'Payment Received',
      };
    case 'GENERAL':
    default:
      return {
        icon: Bell,
        color: 'text-gray-600 bg-gray-50 border-gray-200',
        badgeBg: 'bg-gray-50 text-gray-700 border-gray-200',
        badgeText: 'Notification',
        label: 'Notification',
      };
  }
}

export function formatRelativeTime(dateInput: Date | string | number): string {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 30) return 'Just now';
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
  });
}
