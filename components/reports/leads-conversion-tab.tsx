'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Users, Target, Clock, ArrowRight, PieChart as PieIcon } from 'lucide-react';
import { ReportStatTile } from '@/components/reports/report-stat-tile';
import type { LeadsConversionData } from '@/types/reports';

interface LeadsConversionTabProps {
  data: LeadsConversionData;
  rangeLabel: string;
}

const SOURCE_COLORS = [
  '#0284c7', // Blue - Website
  '#10b981', // Emerald - Referral
  '#f59e0b', // Amber - Cold Call
  '#8b5cf6', // Purple - Social Media
  '#ec4899', // Pink - Event
  '#64748b', // Slate - Other
];

export function LeadsConversionTab({ data, rangeLabel }: LeadsConversionTabProps) {
  const {
    funnelSteps,
    leadsBySource,
    totalLeads,
    conversionRate,
    avgTimeToConversionDays,
  } = data;

  const hasSourceData = leadsBySource.some((s) => s.count > 0);

  return (
    <div className="space-y-6">
      {/* 1. Stat Tiles Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ReportStatTile
          title="Total Leads"
          value={totalLeads}
          subtitle={rangeLabel}
          icon={<Users className="h-5 w-5" />}
        />
        <ReportStatTile
          title="Conversion Rate"
          value={`${conversionRate}%`}
          subtitle="Converted to active clients"
          icon={<Target className="h-5 w-5 text-emerald-500" />}
        />
        <ReportStatTile
          title="Avg Time-to-Conversion"
          value={`${avgTimeToConversionDays} days`}
          subtitle="Lead creation to conversion"
          icon={<Clock className="h-5 w-5 text-blue-500" />}
        />
      </div>

      {/* 2. Visual Sales Funnel */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="pb-4 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">
            Lead Qualification & Conversion Funnel
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Stage progression and step-by-step conversion drop-off from initial inquiry to client acquisition
          </p>
        </div>

        {funnelSteps.every((s) => s.count === 0) ? (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-sm font-medium">No leads currently in pipeline</p>
            <p className="text-xs mt-1">Lead progression will populate this funnel visualization</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {funnelSteps.map((step, idx) => {
              const maxCount = funnelSteps[0].count || 1;
              const widthPct = Math.max(12, Math.round((step.count / maxCount) * 100));

              return (
                <div key={step.stage} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted font-bold text-[10px] text-muted-foreground">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-foreground">{step.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-foreground">{step.count} leads</span>
                      {idx > 0 && (
                        <span className="text-[11px] text-muted-foreground">
                          {step.conversionRateFromPrev}% from prev stage
                        </span>
                      )}
                      <span className="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary">
                        {step.conversionRateFromTotal}% of total
                      </span>
                    </div>
                  </div>

                  {/* Funnel Bar */}
                  <div className="h-4 w-full overflow-hidden rounded-full bg-muted/60">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-sky-500 to-indigo-600"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>

                  {/* Drop-off indicator between steps */}
                  {idx < funnelSteps.length - 1 && (
                    <div className="flex items-center justify-center py-0.5">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground/80">
                        <ArrowRight className="h-3 w-3 rotate-90" />
                        <span>
                          {100 - funnelSteps[idx + 1].conversionRateFromPrev}% drop-off
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Leads by Source Donut Chart */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Leads by Acquisition Source
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Distribution of incoming leads by channel and campaign origin
            </p>
          </div>
          <div className="rounded-xl bg-purple-50 p-2 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
            <PieIcon className="h-4 w-4" />
          </div>
        </div>

        {!hasSourceData ? (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-sm font-medium">No lead source data available for this range</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 items-center">
            {/* Chart */}
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadsBySource}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="label"
                  >
                    {leadsBySource.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={SOURCE_COLORS[index % SOURCE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [`${val ?? 0} leads`, String(name ?? '')]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Breakdown Table */}
            <div className="space-y-3">
              {leadsBySource.map((src, index) => (
                <div
                  key={src.source}
                  className="flex items-center justify-between rounded-xl border border-border p-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: SOURCE_COLORS[index % SOURCE_COLORS.length] }}
                    />
                    <span className="font-semibold text-foreground">{src.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-foreground">{src.count} leads</span>
                    <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                      {src.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
