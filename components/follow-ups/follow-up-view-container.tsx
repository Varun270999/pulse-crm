'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  type FollowUpData,
  FOLLOW_UP_TYPES,
  FOLLOW_UP_STATUSES,
  TYPE_CONFIG,
  STATUS_CONFIG,
  isOverdue,
} from '@/types/follow-up';
import {
  completeFollowUpAction,
  updateFollowUpStatusAction,
  deleteFollowUpAction,
} from '@/app/actions/follow-ups';
import { FollowUpListView } from './follow-up-list-view';
import { FollowUpCalendarView } from './follow-up-calendar-view';
import { Input } from '@/components/ui/input';
import { buttonVariants } from '@/components/ui/button';
import {
  Search,
  Plus,
  List,
  Calendar as CalendarIcon,
  X,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SalesRepOption {
  id: string;
  name: string;
  role: string;
}

interface FollowUpViewContainerProps {
  initialFollowUps: FollowUpData[];
  salesReps: SalesRepOption[];
  currentUser: {
    id: string;
    name?: string | null;
    role: string;
  };
}

export function FollowUpViewContainer({
  initialFollowUps,
  salesReps,
  currentUser,
}: FollowUpViewContainerProps) {
  const router = useRouter();
  const [followUps, setFollowUps] = useState<FollowUpData[]>(initialFollowUps);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [repFilter, setRepFilter] = useState<string>('ALL');

  // Processing state
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Filter follow-ups
  const filteredFollowUps = useMemo(() => {
    return followUps.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        const matchesClient = item.client?.companyName?.toLowerCase().includes(q);
        const matchesLead = item.lead?.name?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesClient && !matchesLead) {
          return false;
        }
      }

      // Status
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }

      // Type
      if (typeFilter !== 'ALL' && item.type !== typeFilter) {
        return false;
      }

      // Rep
      if (repFilter !== 'ALL' && item.assignedToId !== repFilter) {
        return false;
      }

      return true;
    });
  }, [followUps, searchQuery, statusFilter, typeFilter, repFilter]);

  // Overdue count for alert
  const overdueCount = useMemo(() => {
    return followUps.filter((fu) => isOverdue(fu.dueDate, fu.status)).length;
  }, [followUps]);

  // Complete action
  const handleComplete = async (item: FollowUpData) => {
    setProcessingId(item.id);
    setErrorBanner(null);
    setSuccessBanner(null);

    // Optimistic update
    setFollowUps((prev) =>
      prev.map((f) =>
        f.id === item.id ? { ...f, status: 'COMPLETED', completedAt: new Date().toISOString() } : f
      )
    );

    try {
      const res = await completeFollowUpAction(item.id);
      if (res.error) {
        setErrorBanner(res.error);
        router.refresh();
      } else {
        if (res.isRecurring) {
          setSuccessBanner(
            `Follow-up marked complete! The next recurring touchpoint has been automatically scheduled.`
          );
        } else {
          setSuccessBanner(`Follow-up marked complete.`);
        }
        router.refresh();
      }
    } catch {
      setErrorBanner('Failed to complete follow-up. Please try again.');
      router.refresh();
    } finally {
      setProcessingId(null);
    }
  };

  // Reopen action
  const handleReopen = async (item: FollowUpData) => {
    setProcessingId(item.id);
    setErrorBanner(null);

    setFollowUps((prev) =>
      prev.map((f) => (f.id === item.id ? { ...f, status: 'PENDING', completedAt: null } : f))
    );

    try {
      const res = await updateFollowUpStatusAction(item.id, 'PENDING');
      if (res.error) {
        setErrorBanner(res.error);
        router.refresh();
      } else {
        router.refresh();
      }
    } catch {
      setErrorBanner('Failed to reopen follow-up.');
      router.refresh();
    } finally {
      setProcessingId(null);
    }
  };

  // Delete action
  const handleDelete = async (item: FollowUpData) => {
    if (!confirm(`Are you sure you want to delete follow-up "${item.title}"?`)) return;

    setProcessingId(item.id);
    setErrorBanner(null);

    try {
      const res = await deleteFollowUpAction(item.id);
      if (res.error) {
        setErrorBanner(res.error);
      } else {
        setFollowUps((prev) => prev.filter((f) => f.id !== item.id));
        router.refresh();
      }
    } catch {
      setErrorBanner('Failed to delete follow-up.');
    } finally {
      setProcessingId(null);
    }
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    statusFilter !== 'ALL' ||
    typeFilter !== 'ALL' ||
    repFilter !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setTypeFilter('ALL');
    setRepFilter('ALL');
  };

  const selectClassName =
    'h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <div className="space-y-4">
      {/* Success Notification Banner */}
      {successBanner && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <p className="text-sm font-semibold">{successBanner}</p>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="rounded-lg p-1 text-emerald-600 hover:bg-emerald-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorBanner && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
            <p className="text-sm font-semibold">{errorBanner}</p>
          </div>
          <button
            onClick={() => setErrorBanner(null)}
            className="rounded-lg p-1 text-rose-600 hover:bg-rose-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Overdue Warning Callout */}
      {overdueCount > 0 && statusFilter !== 'COMPLETED' && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 text-rose-900">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <p className="text-xs font-medium">
              You have <strong className="font-bold text-rose-700">{overdueCount}</strong> overdue{' '}
              {overdueCount === 1 ? 'follow-up' : 'follow-ups'} requiring attention.
            </p>
          </div>
          <button
            onClick={() => {
              setStatusFilter('PENDING');
            }}
            className="text-xs font-bold text-rose-700 hover:underline"
          >
            Show Pending Only
          </button>
        </div>
      )}

      {/* Controls Bar: Search, Filters, View Switcher & Action Button */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left Side: Search & Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative min-w-[220px] max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search follow-ups..."
              className="h-9 pl-9 pr-8 text-xs rounded-xl bg-white shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={selectClassName}
          >
            <option value="ALL">All Statuses</option>
            {FOLLOW_UP_STATUSES.map((st) => (
              <option key={st} value={st}>
                {STATUS_CONFIG[st].label}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={selectClassName}
          >
            <option value="ALL">All Types</option>
            {FOLLOW_UP_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_CONFIG[t].label}
              </option>
            ))}
          </select>

          {/* Rep Filter (only ADMIN or MANAGER) */}
          {salesReps.length > 0 && (
            <select
              value={repFilter}
              onChange={(e) => setRepFilter(e.target.value)}
              className={selectClassName}
            >
              <option value="ALL">All Representatives</option>
              {salesReps.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.name}
                </option>
              ))}
            </select>
          )}

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Clear Filters
            </button>
          )}
        </div>

        {/* Right Side: View Toggle & Primary CTA */}
        <div className="flex items-center gap-3 self-end lg:self-auto">
          {/* View Mode Switcher */}
          <div className="flex items-center rounded-xl border border-gray-200 bg-gray-100/80 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              )}
            >
              <List className="h-3.5 w-3.5" />
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                viewMode === 'calendar'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              )}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              Calendar
            </button>
          </div>

          {/* Schedule Follow-up CTA */}
          <Link
            href="/dashboard/follow-ups/new"
            className={cn(
              buttonVariants({ variant: 'default', size: 'sm' }),
              'inline-flex items-center gap-1.5'
            )}
          >
            <Plus className="h-4 w-4" />
            Add Follow-up
          </Link>
        </div>
      </div>

      {/* Main View Display */}
      {viewMode === 'list' ? (
        <FollowUpListView
          followUps={filteredFollowUps}
          currentUser={currentUser}
          onComplete={handleComplete}
          onReopen={handleReopen}
          onDelete={handleDelete}
          isProcessingId={processingId}
        />
      ) : (
        <FollowUpCalendarView
          followUps={filteredFollowUps}
          currentUser={currentUser}
          onComplete={handleComplete}
          onDelete={handleDelete}
          isProcessingId={processingId}
        />
      )}
    </div>
  );
}
