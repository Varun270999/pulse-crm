'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { UserCheck, Trophy, IndianRupee, Kanban } from 'lucide-react';
import { ReportStatTile } from '@/components/reports/report-stat-tile';
import type { MyPerformanceData } from '@/types/reports';

interface MyPerformanceViewProps {
  data: MyPerformanceData;
  rangeLabel: string;
}

export function MyPerformanceView({ data, rangeLabel }: MyPerformanceViewProps) {
  const {
    totalLeads,
    convertedLeads,
    dealsWonCount,
    dealsWonValue,
    revenueContribution,
    dealsByStage,
  } = data;

  const hasDealsData = dealsByStage.some((d) => d.count > 0);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl border border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary p-2.5 text-primary-foreground shadow-sm">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">My Sales Performance</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Personal quota tracking, deal pipeline breakdown, and revenue attribution ({rangeLabel})
            </p>
          </div>
        </div>
      </div>

      {/* Stat Tiles Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ReportStatTile
          title="My Assigned Leads"
          value={totalLeads}
          subtitle={`${convertedLeads} converted (${rangeLabel})`}
          icon={<UserCheck className="h-5 w-5 text-blue-500" />}
        />
        <ReportStatTile
          title="My Deals Won"
          value={dealsWonCount}
          subtitle={`Value: ₹${dealsWonValue.toLocaleString('en-IN')}`}
          icon={<Trophy className="h-5 w-5 text-amber-500" />}
        />
        <ReportStatTile
          title="My Revenue Contribution"
          value={`₹${revenueContribution.toLocaleString('en-IN')}`}
          subtitle="Collected payments in range"
          icon={<IndianRupee className="h-5 w-5 text-emerald-500" />}
        />
      </div>

      {/* Deals by Stage Bar Chart */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Kanban className="h-4 w-4 text-primary" />
              My Deals by Pipeline Stage
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Distribution of your current active deals across sales pipeline milestones
            </p>
          </div>
        </div>

        {!hasDealsData ? (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-sm font-medium">No deals currently assigned</p>
            <p className="text-xs mt-1">Deals created in your pipeline will appear here</p>
          </div>
        ) : (
          <div className="mt-6 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dealsByStage} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(val, _name, item) => [
                    `${val ?? 0} deals (₹${Number(item?.payload?.value ?? 0).toLocaleString('en-IN')})`,
                    'Stage Volume',
                  ]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="Deals" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
