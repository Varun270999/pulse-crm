'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Check, ExternalLink, Loader2 } from 'lucide-react';
import type { Notification } from '@prisma/client';
import {
  getUnreadNotificationCountAction,
  getRecentNotificationsAction,
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from '@/app/actions/notifications';
import {
  getNotificationMeta,
  formatRelativeTime,
} from '@/components/notifications/notification-helpers';

export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [, startTransition] = useTransition();

  const dropdownRef = useRef<HTMLDivElement>(null);

  // 1. Initial count check + 30-second polling interval
  useEffect(() => {
    let isMounted = true;

    async function fetchCount() {
      try {
        const res = await getUnreadNotificationCountAction();
        if (isMounted && res.success) {
          setUnreadCount(res.count);
        }
      } catch (err) {
        console.error('Failed to poll notification count:', err);
      }
    }

    fetchCount();

    const intervalId = setInterval(fetchCount, 30000); // 30s polling
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // 2. Fetch recent notifications when dropdown opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoadingList(true);

    getRecentNotificationsAction()
      .then((res) => {
        if (isMounted && res.success) {
          setNotifications(res.notifications);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch recent notifications:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingList(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // 3. Handle click outside & escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // 4. Mark single notification as read & navigate
  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead) {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      startTransition(async () => {
        await markNotificationAsReadAction(n.id);
      });
    }

    setIsOpen(false);

    if (n.linkUrl) {
      router.push(n.linkUrl);
    }
  };

  // 5. Mark all as read
  const handleMarkAllRead = async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);

    startTransition(async () => {
      await markAllNotificationsAsReadAction();
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors focus:outline-hidden"
        title="Notifications"
        aria-label="Open notifications menu"
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5" />

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 bg-gray-50/70">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-gray-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
              >
                <Check className="h-3 w-3" />
                Mark all as read
              </button>
            )}
          </div>

          {/* List Area */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100">
            {isLoadingList ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Loader2 className="h-6 w-6 animate-spin mb-2 text-blue-600" />
                <p className="text-xs">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-2">
                  <Bell className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-gray-800">No notifications yet</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  You are all caught up with your CRM activities.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const meta = getNotificationMeta(n.type);
                const IconComponent = meta.icon;

                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`group relative flex items-start gap-3 p-3.5 transition-colors cursor-pointer hover:bg-gray-50 ${
                      !n.isRead ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {!n.isRead && (
                      <span className="absolute left-1.5 top-5 h-1.5 w-1.5 rounded-full bg-blue-600 ring-2 ring-blue-100" />
                    )}

                    {/* Type Icon */}
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${meta.color}`}
                    >
                      <IconComponent className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p
                          className={`text-xs truncate ${
                            !n.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-800'
                          }`}
                        >
                          {n.title}
                        </p>
                        <span className="text-[10px] text-gray-400 shrink-0 whitespace-nowrap">
                          {formatRelativeTime(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                    </div>

                    {/* Link indicator */}
                    {n.linkUrl && (
                      <ExternalLink className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-gray-50/70 p-2 text-center">
            <Link
              href="/dashboard/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 block py-1.5 transition-colors"
            >
              View all notifications &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
