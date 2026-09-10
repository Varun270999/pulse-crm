import { cn } from '@/lib/utils';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gray-200/80', className)}
      {...props}
    />
  );
}

/**
 * Standard table skeleton simulating header, search/filter bar, and rows
 */
export function TableSkeleton({
  rowCount = 6,
  columns = 5,
}: {
  rowCount?: number;
  columns?: number;
}) {
  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* KPI Cards / Filter bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2 shadow-sm">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-28" />
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <Skeleton className="h-10 w-full sm:w-80 rounded-xl" />
        <div className="flex gap-2 w-full sm:w-auto">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* Table Rows */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-4 space-y-4">
        <div className="flex gap-4 border-b border-gray-100 pb-3">
          {[...Array(columns)].map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {[...Array(rowCount)].map((_, i) => (
          <div key={i} className="flex gap-4 py-2 items-center">
            {[...Array(columns)].map((_, j) => (
              <Skeleton key={j} className="h-5 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Kanban board skeleton simulating multi-stage columns with cards
 */
export function KanbanSkeleton({ columnsCount = 4 }: { columnsCount?: number }) {
  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2 shadow-sm">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>

      {/* Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[...Array(columnsCount)].map((_, colIdx) => (
          <div
            key={colIdx}
            className="flex-1 min-w-[280px] bg-gray-100/70 rounded-2xl p-4 space-y-3 border border-gray-200/60"
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-8 rounded-full" />
            </div>
            {[...Array(3)].map((_, cardIdx) => (
              <div key={cardIdx} className="bg-white p-4 rounded-xl border border-gray-200 space-y-2 shadow-sm">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex justify-between items-center pt-2">
                  <Skeleton className="h-4 w-16 rounded-full" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Form skeleton simulating form inputs, section headers, and submit buttons
 */
export function FormSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
        <div className="space-y-3 pb-4 border-b border-gray-100">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-60" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Detail view skeleton simulating header, badge, tabs, and content cards
 */
export function DetailSkeleton() {
  return (
    <div className="space-y-6 py-2">
      {/* Top Bar with back link and title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-36" />
          </div>
        ))}
      </div>

      {/* Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <Skeleton className="h-6 w-44" />
          <div className="space-y-3 pt-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-3 pt-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Dashboard home page skeleton
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 py-2">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-2">
        <Skeleton className="h-7 w-60" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        ))}
      </div>

      {/* Secondary Metrics & Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <Skeleton className="h-6 w-36" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Reports and Analytics skeleton
 */
export function ReportsSkeleton() {
  return (
    <div className="space-y-6 py-2">
      {/* Header & Date Range */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-64 rounded-xl" />
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-36 rounded-xl" />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Printable receipt skeleton
 */
export function ReceiptSkeleton() {
  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-6">
        <div className="flex justify-between items-start pb-6 border-b border-gray-100">
          <div className="space-y-2">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between py-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-36" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
