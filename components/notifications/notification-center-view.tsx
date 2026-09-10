'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Notification, NotificationType } from '@prisma/client';
import {
  Check,
  CheckCheck,
  ExternalLink,
  Filter,
  Inbox,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from '@/app/actions/notifications';
import {
  getNotificationMeta,
  formatRelativeTime,
} from '@/components/notifications/notification-helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface NotificationCenterViewProps {
  initialNotifications: Notification[];
  initialTotalCount: number;
  initialTotalPages: number;
  initialCurrentPage: number;
  initialUnreadCount: number;
  currentFilterRead: 'all' | 'unread' | 'read';
  currentFilterType: string;
}

const TYPE_OPTIONS: { label: string; value: NotificationType | 'ALL' }[] = [
  { label: 'All Types', value: 'ALL' },
  { label: 'Lead Assigned', value: 'LEAD_ASSIGNED' },
  { label: 'Deal Stage Changed', value: 'DEAL_STAGE_CHANGED' },
  { label: 'Deal Won', value: 'DEAL_WON' },
  { label: 'Follow-up Due', value: 'FOLLOW_UP_DUE' },
  { label: 'Invoice Overdue', value: 'INVOICE_OVERDUE' },
  { label: 'Ticket Assigned', value: 'TICKET_ASSIGNED' },
  { label: 'Ticket Reply', value: 'TICKET_REPLY' },
  { label: 'Payment Received', value: 'PAYMENT_RECEIVED' },
  { label: 'General', value: 'GENERAL' },
];

export function NotificationCenterView({
  initialNotifications,
  initialTotalCount,
  initialTotalPages,
  initialCurrentPage,
  initialUnreadCount,
  currentFilterRead,
  currentFilterType,
}: NotificationCenterViewProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState<number>(initialUnreadCount);
  const [isPending, startTransition] = useTransition();

  // Handle single notification mark as read
  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    // Optimistic update
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    startTransition(async () => {
      await markNotificationAsReadAction(id);
      router.refresh();
    });
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    // Optimistic update
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);

    startTransition(async () => {
      await markAllNotificationsAsReadAction();
      router.refresh();
    });
  };

  // Navigate on filter changes
  const applyFilter = (newRead: string, newType: string, page = 1) => {
    const params = new URLSearchParams();
    if (newRead !== 'all') params.set('read', newRead);
    if (newType !== 'ALL') params.set('type', newType);
    if (page > 1) params.set('page', page.toString());

    router.push(`/dashboard/notifications${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Bulk Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Notification Center
            </h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="rounded-full px-2.5 py-0.5 text-xs font-semibold">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Stay on top of updates, assignments, client requests, and activity alerts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={isPending}
              className="border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <CheckCheck className="h-4 w-4 mr-1.5 text-blue-600" />
              Mark all as read
            </Button>
          )}

          <Link href="/dashboard/profile">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-gray-100">
              Preferences
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Read / Unread Tabs */}
        <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => applyFilter('all', currentFilterType, 1)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentFilterRead === 'all'
                ? 'bg-white text-gray-900 shadow-2xs font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => applyFilter('unread', currentFilterType, 1)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              currentFilterRead === 'unread'
                ? 'bg-white text-gray-900 shadow-2xs font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] text-white">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => applyFilter('read', currentFilterType, 1)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentFilterRead === 'read'
                ? 'bg-white text-gray-900 shadow-2xs font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Read
          </button>
        </div>

        {/* Type Selector Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400 shrink-0" />
          <select
            value={currentFilterType}
            onChange={(e) => applyFilter(currentFilterRead, e.target.value, 1)}
            className="w-full sm:w-56 text-xs bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs divide-y divide-gray-100">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="h-14 w-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 mb-3 shadow-inner">
              <Inbox className="h-7 w-7 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-800">No notifications found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm">
              {currentFilterRead === 'unread'
                ? 'You have caught up with all your notifications!'
                : 'No notification records match the selected filter criteria.'}
            </p>
          </div>
        ) : (
          notifications.map((n) => {
            const meta = getNotificationMeta(n.type);
            const Icon = meta.icon;

            return (
              <div
                key={n.id}
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 transition-colors ${
                  !n.isRead ? 'bg-blue-50/30' : 'hover:bg-gray-50/80'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Icon */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${meta.color} mt-0.5`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Body */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${meta.badgeBg}`}>
                        {meta.badgeText}
                      </span>
                      {!n.isRead && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                          Unread
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        • {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>

                    <h4
                      className={`text-sm ${
                        !n.isRead ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'
                      }`}
                    >
                      {n.title}
                    </h4>
                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {!n.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleMarkAsRead(n.id, e)}
                      title="Mark as read"
                      className="text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg px-2.5 py-1.5 h-auto"
                    >
                      <Check className="h-3.5 w-3.5 mr-1 text-blue-600" />
                      Mark read
                    </Button>
                  )}

                  {n.linkUrl && (
                    <Link
                      href={n.linkUrl}
                      onClick={() => {
                        if (!n.isRead) handleMarkAsRead(n.id);
                      }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg px-2.5 py-1.5 h-auto"
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1 text-gray-400" />
                        View
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      {initialTotalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-2xs">
          <p className="text-xs text-gray-500">
            Showing Page <span className="font-semibold text-gray-900">{initialCurrentPage}</span> of{' '}
            <span className="font-semibold text-gray-900">{initialTotalPages}</span> (
            {initialTotalCount} total items)
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={initialCurrentPage <= 1}
              onClick={() =>
                applyFilter(currentFilterRead, currentFilterType, initialCurrentPage - 1)
              }
              className="h-8 px-2.5 text-xs rounded-xl"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={initialCurrentPage >= initialTotalPages}
              onClick={() =>
                applyFilter(currentFilterRead, currentFilterType, initialCurrentPage + 1)
              }
              className="h-8 px-2.5 text-xs rounded-xl"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
