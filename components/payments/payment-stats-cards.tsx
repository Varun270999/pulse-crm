'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatINR } from '@/lib/utils';
import type { PaymentStats } from '@/types/payment';
import { CreditCard, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PaymentStatsCardsProps {
  stats: PaymentStats;
}

export function PaymentStatsCards({ stats }: PaymentStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-border/70 shadow-xs">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Collected (This Month)</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {formatINR(stats.totalCollectedThisMonth)}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>Current month revenue</span>
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-xs">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Collected (All Time)</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {formatINR(stats.totalCollectedAllTime)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Across {stats.totalPaymentsCount} recorded payments
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shrink-0">
            <CreditCard className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-xs">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Total Outstanding</p>
            <p className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
              {formatINR(stats.totalOutstandingBalance)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Pending across unpaid invoices
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-xs">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Total Transactions</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {stats.totalPaymentsCount}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Verified receipts issued
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center shrink-0">
            <CreditCard className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
