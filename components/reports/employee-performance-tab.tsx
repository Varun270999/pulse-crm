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
import { Download, LifeBuoy, TrendingUp, Award } from 'lucide-react';
import type { EmployeePerformanceData } from '@/types/reports';

interface EmployeePerformanceTabProps {
  data: EmployeePerformanceData;
  rangeLabel: string;
}

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const content = [
    headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function EmployeePerformanceTab({
  data,
  rangeLabel,
}: EmployeePerformanceTabProps) {
  const { salesLeaderboard, revenuePerRepChart, supportAgentMetrics } = data;

  const handleExportSalesCsv = () => {
    const headers = ['Sales Representative', 'Email', 'Leads Assigned', 'Deals Won', 'Revenue Generated (INR)'];
    const rows = salesLeaderboard.map((r) => [
      r.name,
      r.email,
      r.leadsAssigned,
      r.dealsWon,
      r.revenueGenerated,
    ]);
    downloadCsv(`sales_performance_${Date.now()}`, headers, rows);
  };

  const handleExportSupportCsv = () => {
    const headers = ['Support Agent', 'Email', 'Tickets Resolved', 'Average Resolution Time (Hours)'];
    const rows = supportAgentMetrics.map((a) => [
      a.name,
      a.email,
      a.ticketsResolved,
      a.avgResolutionHours,
    ]);
    downloadCsv(`support_performance_${Date.now()}`, headers, rows);
  };

  const hasChartData = revenuePerRepChart.length > 0;

  return (
    <div className="space-y-6">
      {/* 1. Revenue Generated per Rep Bar Chart */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Sales Revenue by Representative
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Closed revenue contribution per sales team member ({rangeLabel})
            </p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>

        {!hasChartData ? (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-sm font-medium">No sales revenue recorded in this period</p>
            <p className="text-xs mt-1">Closed deals with recorded payments will rank here</p>
          </div>
        ) : (
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenuePerRepChart} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
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
                  formatter={(val) => [`₹${Number(val ?? 0).toLocaleString('en-IN')}`, 'Revenue Generated']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="revenue" name="Revenue" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 2. Sales Rep Leaderboard Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              Sales Representative Leaderboard
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ranked by total revenue collected in {rangeLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportSalesCsv}
            disabled={salesLeaderboard.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-3">Rank</th>
                <th scope="col" className="px-5 py-3">Sales Rep</th>
                <th scope="col" className="px-5 py-3 text-center">Leads Assigned</th>
                <th scope="col" className="px-5 py-3 text-center">Deals Won</th>
                <th scope="col" className="px-5 py-3 text-right">Revenue Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {salesLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                    No sales representative activity found.
                  </td>
                </tr>
              ) : (
                salesLeaderboard.map((rep, idx) => (
                  <tr key={rep.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-xs text-muted-foreground">
                      #{idx + 1}
                    </td>
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-semibold text-foreground">{rep.name}</p>
                        <p className="text-xs text-muted-foreground">{rep.email}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center font-medium text-foreground">
                      {rep.leadsAssigned}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">
                        {rep.dealsWon}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-foreground">
                      ₹{rep.revenueGenerated.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Support Agent Performance Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <LifeBuoy className="h-4 w-4 text-primary" />
              Support Agent Resolution Metrics
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Customer support efficiency, tickets resolved, and SLA speed ({rangeLabel})
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportSupportCsv}
            disabled={supportAgentMetrics.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-3">Support Agent</th>
                <th scope="col" className="px-5 py-3 text-center">Tickets Resolved</th>
                <th scope="col" className="px-5 py-3 text-right">Avg Resolution Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {supportAgentMetrics.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-muted-foreground">
                    No support agent resolution activity in this period.
                  </td>
                </tr>
              ) : (
                supportAgentMetrics.map((agent) => (
                  <tr key={agent.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-semibold text-foreground">{agent.name}</p>
                        <p className="text-xs text-muted-foreground">{agent.email}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400">
                        {agent.ticketsResolved}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-foreground">
                      {agent.avgResolutionHours > 0 ? `${agent.avgResolutionHours} hrs` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
