'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  type FollowUpData,
  TYPE_CONFIG,
  isOverdue,
  isDueToday,
  formatDueDateTime,
} from '@/types/follow-up';
import { completeFollowUpAction } from '@/app/actions/follow-ups';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import {
  Clock,
  Check,
  Building2,
  User,
  AlertTriangle,
  Sparkles,
  ArrowUpRight,
  Plus,
  PhoneCall,
  Mail,
  CalendarDays,
  CheckSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpcomingFollowUpsWidgetProps {
  initialFollowUps: FollowUpData[];
}

const TYPE_ICONS = {
  CALL: PhoneCall,
  EMAIL: Mail,
  MEETING: CalendarDays,
  TASK: CheckSquare,
  OTHER: Clock,
};

export function UpcomingFollowUpsWidget({
  initialFollowUps,
}: UpcomingFollowUpsWidgetProps) {
  const router = useRouter();
  const [followUps, setFollowUps] = useState<FollowUpData[]>(initialFollowUps);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const handleComplete = async (item: FollowUpData) => {
    setCompletingId(item.id);
    setFollowUps((prev) => prev.filter((f) => f.id !== item.id));

    try {
      await completeFollowUpAction(item.id);
      router.refresh();
    } catch {
      router.refresh();
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <Card className="shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg font-bold text-gray-900">
              Upcoming Follow-ups
            </CardTitle>
          </div>
          <CardDescription>
            Your next pending touches, reminder calls, and scheduled meetings
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/follow-ups"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center"
          >
            View All <ArrowUpRight className="ml-0.5 h-3.5 w-3.5" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="pt-2 pb-5">
        {followUps.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-10 px-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-2">
              <Check className="h-5 w-5 stroke-[2.5]" />
            </div>
            <p className="text-sm font-semibold text-gray-800">No upcoming follow-ups</p>
            <p className="text-xs text-gray-400 mt-0.5">You are all caught up on your scheduled tasks.</p>
            <Link
              href="/dashboard/follow-ups/new"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-4 inline-flex items-center gap-1.5')}
            >
              <Plus className="h-3.5 w-3.5" />
              Schedule Follow-up
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {followUps.map((item) => {
              const overdue = isOverdue(item.dueDate, item.status);
              const dueToday = isDueToday(item.dueDate, item.status);
              const TypeIcon = TYPE_ICONS[item.type] || Clock;
              const typeConf = TYPE_CONFIG[item.type];
              const isBusy = completingId === item.id;

              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border transition-all',
                    overdue
                      ? 'bg-rose-50/40 border-rose-200'
                      : dueToday
                      ? 'bg-amber-50/30 border-amber-200'
                      : 'bg-white border-gray-100 hover:border-gray-200'
                  )}
                >
                  {/* Checkbox + Title + Related Entity */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleComplete(item)}
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border mt-0.5 sm:mt-0 transition-all cursor-pointer',
                        overdue
                          ? 'border-rose-400 hover:bg-rose-50'
                          : 'border-gray-300 hover:border-blue-600 hover:bg-blue-50'
                      )}
                      title="Mark complete"
                    >
                      <Check className="h-3 w-3 text-transparent hover:text-blue-600" />
                    </button>

                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs',
                          typeConf.badgeBg
                        )}
                        title={typeConf.label}
                      >
                        <TypeIcon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate max-w-xs sm:max-w-md">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                          {item.client ? (
                            <Link
                              href={`/dashboard/clients/${item.clientId}`}
                              className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <Building2 className="h-3 w-3" />
                              <span className="truncate max-w-[120px] sm:max-w-[180px]">
                                {item.client.companyName}
                              </span>
                            </Link>
                          ) : item.lead ? (
                            <Link
                              href="/dashboard/leads"
                              className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <User className="h-3 w-3" />
                              <span className="truncate max-w-[120px] sm:max-w-[180px]">
                                {item.lead.name}
                              </span>
                            </Link>
                          ) : (
                            <span className="italic">General Task</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Badges & Due Date */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pl-8 sm:pl-0">
                    <div className="flex items-center gap-1.5">
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
                    <span className="text-xs text-gray-500 font-medium">
                      {formatDueDateTime(item.dueDate)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
