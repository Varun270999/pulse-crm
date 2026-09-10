'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { IndianRupee, Trophy, BarChart3, Percent, TrendingUp } from 'lucide-react';
import { ReportStatTile } from '@/components/reports/report-stat-tile';
import type { SalesOverviewData } from '@/types/reports';

interface SalesOverviewTabProps {
  data: SalesOverviewData;
  rangeLabel: string;
}

export function SalesOverviewTab({ data, rangeLabel }: SalesOverviewTabProps) {
  const {
    revenueTrend,
    wonVsLostTrend,
    stageDistribution,
    totalRevenue,
    dealsWon,
    avgDealSize,
    winRate,
  } = data;

  const hasRevenueData = revenueTrend.some((d) => d.revenue > 0);
  const hasWonLostData = wonVsLostTrend.some((d) => d.won > 0 || d.lost > 0);
  const hasStageData = stageDistribution.some((d) => d.count > 0);

  return (
    <div className="space-y-6">
      {/* 1. Stat Tiles Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportStatTile
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString('en-IN')}`}
          subtitle={rangeLabel}
          icon={<IndianRupee className="h-5 w-5" />}
        />
        <ReportStatTile
          title="Deals Won"
          value={dealsWon}
          subtitle={rangeLabel}
          icon={<Trophy className="h-5 w-5 text-amber-500" />}
        />
        <ReportStatTile
          title="Average Deal Size"
          value={`₹${avgDealSize.toLocaleString('en-IN')}`}
          subtitle="Won deals average"
          icon={<BarChart3 className="h-5 w-5 text-blue-500" />}
        />
        <ReportStatTile
          title="Win Rate"
          value={`${winRate}%`}
          subtitle="Closed deals ratio"
          icon={<Percent className="h-5 w-5 text-emerald-500" />}
        />
      </div>

      {/* 2. Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Collected Line Chart */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Revenue Collection Trend
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Payments collected per month (Last 6 Months)
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-4 h-72 w-full">
            {!hasRevenueData ? (
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                <p className="text-sm font-medium">No payment records in this 6-month period</p>
                <p className="text-xs mt-1">Recorded payments will display here automatically</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueTrend} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip
                    formatter={(val) => [`₹${Number(val ?? 0).toLocaleString('en-IN')}`, 'Revenue']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#0284c7', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Deals Won vs Lost Bar Chart */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Deals Won vs. Lost
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Monthly closed deal outcomes (Last 6 Months)
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Trophy className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-4 h-72 w-full">
            {!hasWonLostData ? (
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                <p className="text-sm font-medium">No closed deals recorded in this 6-month period</p>
                <p className="text-xs mt-1">Won and lost deals will display here as they close</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wonVsLostTrend} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
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
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="won" name="Deals Won" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="lost" name="Deals Lost" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 3. Pipeline Stage Distribution */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="pb-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">
            Pipeline Stage Distribution
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Active deal volume and potential values across each stage of the sales pipeline
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {stageDistribution.map((stage) => {
            const isWon = stage.stage === 'WON';
            const isLost = stage.stage === 'LOST';

            return (
              <div
                key={stage.stage}
                className="rounded-xl border border-border bg-muted/20 p-4 transition-all hover:bg-muted/40"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {stage.label}
                  </span>
                  {isWon ? (
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  ) : isLost ? (
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                  {stage.count}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Value: <span className="font-semibold text-foreground">₹{stage.value.toLocaleString('en-IN')}</span>
                </p>
              </div>
            );
          })}
        </div>

        {/* Bar chart overview of stage value */}
        {hasStageData && (
          <div className="mt-6 pt-4 border-t border-border h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageDistribution} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
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
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(val) => [`₹${Number(val ?? 0).toLocaleString('en-IN')}`, 'Pipeline Value']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" name="Stage Value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
