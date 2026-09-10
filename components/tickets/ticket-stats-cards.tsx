'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { TicketStats } from '@/types/ticket';
import { LifeBuoy, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface TicketStatsCardsProps {
  stats: TicketStats;
}

export function TicketStatsCards({ stats }: TicketStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Open Tickets */}
      <Card className="border-border/70 shadow-xs">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Open Tickets</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {stats.openCount}
            </p>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
              Awaiting resolution
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shrink-0">
            <LifeBuoy className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {/* In Progress */}
      <Card className="border-border/70 shadow-xs">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">In Progress</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {stats.inProgressCount}
            </p>
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
              Actively being addressed
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {/* Overdue SLA */}
      <Card className="border-border/70 shadow-xs">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Overdue SLA</p>
            <p className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
              {stats.overdueCount}
            </p>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
              {stats.overdueCount > 0 ? 'Requires immediate attention' : 'All SLAs on track'}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {/* Resolved Tickets */}
      <Card className="border-border/70 shadow-xs">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Resolved</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {stats.resolvedCount}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              Successfully completed
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
