'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatINR } from '@/lib/utils';
import type { BillingStats } from '@/types/billing';
import {
  Receipt,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';

interface BillingStatsCardsProps {
  stats: BillingStats;
  activeTab: 'invoices' | 'quotations';
}

export function BillingStatsCards({ stats, activeTab }: BillingStatsCardsProps) {
  if (activeTab === 'quotations') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Active Quotations Count */}
        <Card className="border border-border/80 shadow-xs hover:shadow-sm transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Active Quotations
              </span>
              <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-foreground">
                {stats.activeQuotationsCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Draft and Sent estimates awaiting decision
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Potential Pipeline Value from Quotes */}
        <Card className="border border-border/80 shadow-xs hover:shadow-sm transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Quoted Pipeline Value
              </span>
              <div className="h-9 w-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Receipt className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">
                {formatINR(stats.activeQuotationsValue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total amount across active proposals
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Collected Revenue This Month */}
        <Card className="border border-border/80 shadow-xs hover:shadow-sm transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Collected This Month
              </span>
              <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatINR(stats.collectedThisMonth)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Invoiced revenue realized
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Invoiced */}
      <Card className="border border-border/80 shadow-xs hover:shadow-sm transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Invoiced
            </span>
            <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-foreground">
              {formatINR(stats.totalInvoiced)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All non-cancelled invoices
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Outstanding / Unpaid Balance */}
      <Card className="border border-border/80 shadow-xs hover:shadow-sm transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Outstanding Balance
            </span>
            <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {formatINR(stats.totalOutstanding)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting payment collection
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Collected This Month */}
      <Card className="border border-border/80 shadow-xs hover:shadow-sm transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Collected This Month
            </span>
            <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatINR(stats.collectedThisMonth)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Receipts recorded in current month
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 4. Overdue Invoices */}
      <Card className="border border-border/80 shadow-xs hover:shadow-sm transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Overdue Invoices
            </span>
            <div className="h-9 w-9 rounded-lg bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {stats.overdueInvoicesCount} ({formatINR(stats.overdueInvoicesAmount)})
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Past payment due date
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
