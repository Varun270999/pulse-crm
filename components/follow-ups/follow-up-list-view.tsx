'use client';

import Link from 'next/link';
import {
  type FollowUpData,
  TYPE_CONFIG,
  STATUS_CONFIG,
  RECURRENCE_LABELS,
  isOverdue,
  isDueToday,
  formatDueDateTime,
} from '@/types/follow-up';
import {
  PhoneCall,
  Mail,
  CalendarDays,
  CheckSquare,
  Clock,
  Building2,
  User,
  AlertTriangle,
  Check,
  RotateCcw,
  Trash2,
  Repeat,
  Sparkles,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FollowUpListViewProps {
  followUps: FollowUpData[];
  currentUser: {
    id: string;
    name?: string | null;
    role: string;
  };
  onComplete: (followUp: FollowUpData) => Promise<void>;
  onReopen?: (followUp: FollowUpData) => Promise<void>;
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

export function FollowUpListView({
  followUps,
  currentUser,
  onComplete,
  onReopen,
  onDelete,
  isProcessingId,
}: FollowUpListViewProps) {
  const canDelete = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';

  if (followUps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-3 shadow-xs">
          <Clock className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-gray-900">No follow-ups found</h3>
        <p className="mt-1 text-xs text-gray-500 max-w-sm">
          No reminders or follow-up activities match your current search or filter criteria.
        </p>
        <Link
          href="/dashboard/follow-ups/new"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Schedule Follow-up
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50/80 text-xs font-semibold uppercase text-gray-500 border-b border-gray-200">
            <tr>
              <th scope="col" className="py-3.5 pl-6 pr-2 w-12 text-center">
                Done
              </th>
              <th scope="col" className="px-3 py-3.5">
                Follow-up Title
              </th>
              <th scope="col" className="px-3 py-3.5">
                Type
              </th>
              <th scope="col" className="px-3 py-3.5">
                Related Record
              </th>
              <th scope="col" className="px-3 py-3.5">
                Due Date & Time
              </th>
              <th scope="col" className="px-3 py-3.5">
                Status
              </th>
              <th scope="col" className="px-3 py-3.5">
                Assigned Rep
              </th>
              <th scope="col" className="py-3.5 pl-3 pr-6 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {followUps.map((item) => {
              const overdue = isOverdue(item.dueDate, item.status);
              const dueToday = isDueToday(item.dueDate, item.status);
              const isCompleted = item.status === 'COMPLETED';
              const isCancelled = item.status === 'CANCELLED';
              const isProcessing = isProcessingId === item.id;

              const TypeIcon = TYPE_ICONS[item.type] || Clock;
              const typeConf = TYPE_CONFIG[item.type];
              const statusConf = STATUS_CONFIG[item.status];

              return (
                <tr
                  key={item.id}
                  className={cn(
                    'transition-colors hover:bg-gray-50/70',
                    overdue && 'bg-rose-50/30',
                    dueToday && 'bg-amber-50/30',
                    isCompleted && 'opacity-65 bg-gray-50/30'
                  )}
                >
                  {/* Mark Complete Checkbox / Action */}
                  <td className="py-3.5 pl-6 pr-2 text-center">
                    <button
                      type="button"
                      disabled={isProcessing || isCancelled}
                      onClick={() => {
                        if (isCompleted && onReopen) {
                          onReopen(item);
                        } else if (!isCompleted) {
                          onComplete(item);
                        }
                      }}
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-md border transition-all cursor-pointer mx-auto',
                        isCompleted
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : overdue
                          ? 'border-rose-400 hover:border-rose-600 hover:bg-rose-50 text-transparent'
                          : 'border-gray-300 hover:border-blue-600 hover:bg-blue-50 text-transparent'
                      )}
                      title={isCompleted ? 'Completed (click to reopen)' : 'Click to mark complete'}
                    >
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </button>
                  </td>

                  {/* Title & Description */}
                  <td className="px-3 py-3.5 max-w-xs">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'font-semibold text-gray-900',
                          isCompleted && 'line-through text-gray-400'
                        )}
                      >
                        {item.title}
                      </span>
                      {item.isRecurring && (
                        <span
                          className="inline-flex items-center rounded-full bg-blue-50 p-1 text-blue-600"
                          title={
                            item.recurrencePattern
                              ? RECURRENCE_LABELS[item.recurrencePattern]
                              : 'Recurring'
                          }
                        >
                          <Repeat className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {item.description}
                      </p>
                    )}
                  </td>

                  {/* Type */}
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border',
                        typeConf.badgeBg
                      )}
                    >
                      <TypeIcon className="h-3.5 w-3.5" />
                      {typeConf.label}
                    </span>
                  </td>

                  {/* Related Entity */}
                  <td className="px-3 py-3.5">
                    {item.client ? (
                      <Link
                        href={`/dashboard/clients/${item.clientId}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
                      >
                        <Building2 className="h-3.5 w-3.5 text-gray-400" />
                        <span className="truncate max-w-[140px]">{item.client.companyName}</span>
                      </Link>
                    ) : item.lead ? (
                      <Link
                        href="/dashboard/leads"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
                      >
                        <User className="h-3.5 w-3.5 text-gray-400" />
                        <span className="truncate max-w-[140px]">{item.lead.name}</span>
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-400 italic">General Task</span>
                    )}
                  </td>

                  {/* Due Date & Badges */}
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-gray-700 font-medium">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        <span>{formatDueDateTime(item.dueDate)}</span>
                      </div>

                      {overdue && (
                        <div className="inline-flex items-center gap-1 rounded-md bg-rose-100/80 px-2 py-0.5 text-[11px] font-bold text-rose-700 w-fit">
                          <AlertTriangle className="h-3 w-3" />
                          Overdue
                        </div>
                      )}

                      {dueToday && (
                        <div className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 w-fit">
                          <Sparkles className="h-3 w-3 text-amber-600" />
                          Due Today
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border',
                        statusConf.badgeBg
                      )}
                    >
                      {statusConf.label}
                    </span>
                  </td>

                  {/* Assigned Rep */}
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                        {item.assignedTo?.name
                          ? item.assignedTo.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)
                          : 'U'}
                      </div>
                      <span className="text-gray-700 font-medium truncate max-w-[100px]">
                        {item.assignedTo?.name?.split(' ')[0] || 'Rep'}
                      </span>
                    </div>
                  </td>

                  {/* Row Actions */}
                  <td className="py-3.5 pl-3 pr-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {!isCompleted ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isProcessing}
                          onClick={() => onComplete(item)}
                          className="h-7 px-2.5 text-xs text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 border-emerald-200"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Complete
                        </Button>
                      ) : (
                        onReopen && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => onReopen(item)}
                            className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700"
                            title="Reopen follow-up"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Reopen
                          </Button>
                        )
                      )}

                      {(canDelete || item.assignedToId === currentUser.id) && (
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
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
