'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Bell,
  Check,
  Loader2,
  UserPlus,
  TrendingUp,
  Clock,
  LifeBuoy,
  Banknote,
} from 'lucide-react';
import { updateNotificationPreferencesAction, type UpdatePreferencesInput } from '@/app/actions/notifications';

interface NotificationPreferencesCardProps {
  initialPreferences: UpdatePreferencesInput;
}

export function NotificationPreferencesCard({
  initialPreferences,
}: NotificationPreferencesCardProps) {
  const [preferences, setPreferences] = useState<UpdatePreferencesInput>(initialPreferences);
  const [isPending, startTransition] = useTransition();
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleToggle = (key: keyof UpdatePreferencesInput) => {
    const updated = {
      ...preferences,
      [key]: !preferences[key],
    };

    setPreferences(updated);
    setSavedSuccess(false);

    startTransition(async () => {
      const res = await updateNotificationPreferencesAction(updated);
      if (res.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    });
  };

  const PREFERENCE_ITEMS: {
    key: keyof UpdatePreferencesInput;
    title: string;
    description: string;
    icon: typeof Bell;
    color: string;
  }[] = [
    {
      key: 'notifyOnLeadAssigned',
      title: 'New Leads Assigned',
      description: 'Notify me whenever a new lead is assigned or reassigned to my account.',
      icon: UserPlus,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      key: 'notifyOnDealUpdates',
      title: 'Deal Updates & Wins',
      description: 'Receive alerts when deals move pipeline stages or are successfully won.',
      icon: TrendingUp,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      key: 'notifyOnFollowUps',
      title: 'Follow-ups Due Today',
      description: 'Daily reminders for scheduled phone calls, meetings, emails, and pending tasks.',
      icon: Clock,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      key: 'notifyOnTickets',
      title: 'Support Tickets & Replies',
      description: 'Notifications when support tickets are assigned to you or receive public replies.',
      icon: LifeBuoy,
      color: 'text-purple-600 bg-purple-50 border-purple-100',
    },
    {
      key: 'notifyOnPayments',
      title: 'Payments & Overdue Invoices',
      description: 'Alerts when invoice payments are collected or when invoices become overdue.',
      icon: Banknote,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
  ];

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">
                Notification Preferences
              </CardTitle>
              <CardDescription className="text-xs text-gray-500 mt-0.5">
                Choose which alerts and activities you want to receive in your notification feed.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isPending && (
              <span className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                Saving...
              </span>
            )}
            {savedSuccess && !isPending && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full animate-in fade-in duration-200">
                <Check className="h-3 w-3" />
                Preferences updated
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white overflow-hidden">
          {PREFERENCE_ITEMS.map((item) => {
            const isEnabled = preferences[item.key];
            const Icon = item.icon;

            return (
              <div
                key={item.key}
                onClick={() => handleToggle(item.key)}
                className="flex items-center justify-between gap-4 p-4 hover:bg-gray-50/80 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${item.color} mt-0.5`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 leading-tight">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isEnabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(item.key);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                    isEnabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                      isEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
