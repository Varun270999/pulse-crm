'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatINR } from '@/lib/utils';
import type { PipelineStats } from '@/types/deal';
import { TrendingUp, Award, Percent, IndianRupee } from 'lucide-react';

interface PipelineStatsCardsProps {
  stats: PipelineStats;
}

export function PipelineStatsCards({ stats }: PipelineStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Open Pipeline Value */}
      <Card className="border border-border/80 shadow-xs hover:shadow-sm transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Open Pipeline Value
            </span>
            <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <IndianRupee className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-foreground">
              {formatINR(stats.totalOpenValue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active deals in pipeline
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Weighted Forecast */}
      <Card className="border border-border/80 shadow-xs hover:shadow-sm transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Weighted Forecast
            </span>
            <div className="h-9 w-9 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
              {formatINR(stats.weightedForecast)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on deal probabilities
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Deals Won This Month */}
      <Card className="border border-border/80 shadow-xs hover:shadow-sm transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Won This Month
            </span>
            <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.dealsWonThisMonth} {stats.dealsWonThisMonth === 1 ? 'deal' : 'deals'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Closed as won in current month
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 4. Win Rate (Last 90 Days) */}
      <Card className="border border-border/80 shadow-xs hover:shadow-sm transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Win Rate (90 Days)
            </span>
            <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Percent className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-foreground">
              {stats.winRate90Days}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Won vs lost closed deals
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
