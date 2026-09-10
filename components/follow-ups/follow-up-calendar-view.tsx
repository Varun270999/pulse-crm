'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  type FollowUpData,
  TYPE_CONFIG,
  isOverdue,
  isDueToday,
  formatDueDateTime,
} from '@/types/follow-up';
import {
  ChevronLeft,
  ChevronRight,
  PhoneCall,
  Mail,
  CalendarDays,
  CheckSquare,
  Clock,
  Building2,
  User,
  Check,
  AlertTriangle,
  Sparkles,
  X,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FollowUpCalendarViewProps {
  followUps: FollowUpData[];
  currentUser: {
    id: string;
    name?: string | null;
    role: string;
  };
  onComplete: (followUp: FollowUpData) => Promise<void>;
  onDelete: (followUp: FollowUpData) => Promise<void>;
  isProcessingId?: string | null;
}

const TYPE_ICONS = {
  CALL: PhoneCall,
  EMAIL: Mail,
  MEETING: CalendarDays,
  TASK: CheckSquare,
  OTHER: Clock,
};

export function FollowUpCalendarView({
  followUps,
  currentUser,
  onComplete,
  onDelete,
  isProcessingId,
}: FollowUpCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today);
  };

  const monthName = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(currentDate);

  // Build days grid
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days: {
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
        isToday: false,
      });
    }

    const today = new Date();
    // Current month days
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const d = new Date(year, month, day);
      const isToday =
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate();

      days.push({
        date: d,
        isCurrentMonth: true,
        isToday,
      });
    }

    // Next month padding to fill 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  }, [year, month]);

  // Group follow-ups by YYYY-MM-DD
  const followUpsByDate = useMemo(() => {
    const map = new Map<string, FollowUpData[]>();
    for (const item of followUps) {
      const d = new Date(item.dueDate);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d
        .getDate()
        .toString()
        .padStart(2, '0')}`;
      const list = map.get(key) || [];
      list.push(item);
      map.set(key, list);
    }
    return map;
  }, [followUps]);

  // Selected day items
  const selectedDayItems = useMemo(() => {
    if (!selectedDay) return [];
    const key = `${selectedDay.getFullYear()}-${(selectedDay.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${selectedDay.getDate().toString().padStart(2, '0')}`;
    return followUpsByDate.get(key) || [];
  }, [selectedDay, followUpsByDate]);

  const weekDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      {/* Calendar Header / Navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-gray-900">{monthName}</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="h-8 text-xs font-semibold"
          >
            Today
          </Button>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={prevMonth}
            className="h-8 w-8 p-0"
            title="Previous Month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={nextMonth}
            className="h-8 w-8 p-0"
            title="Next Month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Grid & Side Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Month Grid (3 cols on desktop) */}
        <div
          className={cn(
            'rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden transition-all',
            selectedDay ? 'lg:col-span-3' : 'lg:col-span-4'
          )}
        >
          {/* Weekday Columns */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/80 text-center text-xs font-semibold uppercase text-gray-500 py-2.5">
            {weekDayNames.map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
            {calendarDays.map((item, index) => {
              const dateKey = `${item.date.getFullYear()}-${(item.date.getMonth() + 1)
                .toString()
                .padStart(2, '0')}-${item.date.getDate().toString().padStart(2, '0')}`;
              const dayFollowUps = followUpsByDate.get(dateKey) || [];

              const isSelected =
                selectedDay &&
                selectedDay.getFullYear() === item.date.getFullYear() &&
                selectedDay.getMonth() === item.date.getMonth() &&
                selectedDay.getDate() === item.date.getDate();

              return (
                <div
                  key={index}
                  onClick={() => setSelectedDay(item.date)}
                  className={cn(
                    'min-h-[105px] p-2 transition-all cursor-pointer flex flex-col justify-between group',
                    item.isCurrentMonth ? 'bg-white' : 'bg-gray-50/40 text-gray-400',
                    item.isToday && 'bg-blue-50/20',
                    isSelected && 'ring-2 ring-blue-500 bg-blue-50/40 z-10',
                    'hover:bg-blue-50/30'
                  )}
                >
                  {/* Date Header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                        item.isToday
                          ? 'bg-blue-600 text-white font-bold'
                          : isSelected
                          ? 'bg-blue-100 text-blue-900 font-bold'
                          : item.isCurrentMonth
                          ? 'text-gray-900'
                          : 'text-gray-400'
                      )}
                    >
                      {item.date.getDate()}
                    </span>

                    {dayFollowUps.length > 0 && (
                      <span className="text-[10px] font-bold text-gray-400 group-hover:text-blue-600">
                        {dayFollowUps.length}
                      </span>
                    )}
                  </div>

                  {/* Pills List */}
                  <div className="space-y-1 mt-1 flex-1 overflow-hidden">
                    {dayFollowUps.slice(0, 3).map((fu) => {
                      const TypeIcon = TYPE_ICONS[fu.type] || Clock;
                      const overdue = isOverdue(fu.dueDate, fu.status);
                      const isCompleted = fu.status === 'COMPLETED';

                      return (
                        <div
                          key={fu.id}
                          className={cn(
                            'flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium truncate transition-colors',
                            isCompleted
                              ? 'bg-gray-100 text-gray-400 line-through'
                              : overdue
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                          )}
                          title={`${fu.title} (${TYPE_CONFIG[fu.type].label})`}
                        >
                          <TypeIcon className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate">{fu.title}</span>
                        </div>
                      );
                    })}

                    {dayFollowUps.length > 3 && (
                      <div className="text-[10px] font-bold text-gray-500 text-center">
                        +{dayFollowUps.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Drawer / Side Panel (1 col) */}
        {selectedDay && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs flex flex-col space-y-4 animate-in fade-in duration-200">
            {/* Panel Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  {new Intl.DateTimeFormat('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  }).format(selectedDay)}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedDayItems.length} {selectedDayItems.length === 1 ? 'follow-up' : 'follow-ups'} scheduled
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Panel Items */}
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px]">
              {selectedDayItems.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  No follow-ups scheduled for this day.
                </div>
              ) : (
                selectedDayItems.map((item) => {
                  const TypeIcon = TYPE_ICONS[item.type] || Clock;
                  const overdue = isOverdue(item.dueDate, item.status);
                  const dueToday = isDueToday(item.dueDate, item.status);
                  const isCompleted = item.status === 'COMPLETED';
                  const isProcessing = isProcessingId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'rounded-xl border p-3.5 space-y-2 transition-all',
                        isCompleted
                          ? 'bg-gray-50/50 border-gray-200 opacity-70'
                          : overdue
                          ? 'bg-rose-50/40 border-rose-200'
                          : 'bg-white border-gray-200 shadow-xs'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'flex h-6 w-6 items-center justify-center rounded-lg border text-xs',
                              TYPE_CONFIG[item.type].badgeBg
                            )}
                          >
                            <TypeIcon className="h-3.5 w-3.5" />
                          </span>
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {TYPE_CONFIG[item.type].label}
                          </span>
                        </div>

                        {overdue && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                            <AlertTriangle className="h-2.5 w-2.5" /> Overdue
                          </span>
                        )}

                        {dueToday && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                            <Sparkles className="h-2.5 w-2.5 text-amber-600" /> Today
                          </span>
                        )}
                      </div>

                      <div>
                        <h4
                          className={cn(
                            'text-sm font-bold text-gray-900',
                            isCompleted && 'line-through text-gray-400'
                          )}
                        >
                          {item.title}
                        </h4>
                        {item.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Related & Rep */}
                      <div className="pt-2 border-t border-gray-100 text-xs space-y-1 text-gray-500">
                        {item.client && (
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3 w-3 text-gray-400 shrink-0" />
                            <Link
                              href={`/dashboard/clients/${item.clientId}`}
                              className="font-medium text-blue-600 hover:underline truncate"
                            >
                              {item.client.companyName}
                            </Link>
                          </div>
                        )}
                        {item.lead && (
                          <div className="flex items-center gap-1.5">
                            <User className="h-3 w-3 text-gray-400 shrink-0" />
                            <Link
                              href="/dashboard/leads"
                              className="font-medium text-blue-600 hover:underline truncate"
                            >
                              {item.lead.name}
                            </Link>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span>Time: {formatDueDateTime(item.dueDate).split(',')[1]}</span>
                          <span>Rep: {item.assignedTo?.name?.split(' ')[0]}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        {((currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER') ||
                          item.assignedToId === currentUser.id) && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => onDelete(item)}
                            className="h-7 w-7 p-0 text-gray-400 hover:text-rose-600"
                            title="Delete follow-up"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {!isCompleted && (
                          <Button
                            type="button"
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => onComplete(item)}
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick add shortcut */}
            <div className="pt-2 border-t border-gray-100">
              <Link
                href={`/dashboard/follow-ups/new?date=${selectedDay.toISOString()}`}
                className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center"
              >
                + Schedule Follow-up for this day
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
