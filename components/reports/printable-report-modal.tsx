'use client';

import { Printer, X, Activity, FileText } from 'lucide-react';
import type { ReportsData } from '@/types/reports';

interface PrintableReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'sales' | 'leads' | 'employees' | 'clients' | 'my-performance';
  data: ReportsData;
}

export function PrintableReportModal({
  isOpen,
  onClose,
  activeTab,
  data,
}: PrintableReportModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'sales':
        return 'Sales & Revenue Overview';
      case 'leads':
        return 'Leads & Pipeline Conversion';
      case 'employees':
        return 'Employee Performance & Productivity';
      case 'clients':
        return 'Client Accounts & Revenue Concentration';
      case 'my-performance':
        return 'Individual Sales Performance Summary';
      default:
        return 'Executive Analytics Summary';
    }
  };

  const currentDateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
        {/* Modal Toolbar (hidden during window.print) */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/40 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground text-sm">
              Executive PDF Report Preview
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Canvas */}
        <div className="overflow-y-auto p-8 space-y-6 bg-background text-foreground print:p-0 print:m-0">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-border pb-6">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-base">
                  <Activity className="h-5 w-5" />
                </div>
                <span className="text-xl font-bold tracking-tight text-foreground">
                  Pulse CRM
                </span>
              </div>
              <h1 className="mt-3 text-lg font-bold text-foreground">
                {getTabTitle()}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Executive analytics and business performance report
              </p>
            </div>

            <div className="text-right text-xs space-y-1">
              <p className="text-muted-foreground">
                Filter Period: <span className="font-semibold text-foreground">{data.rangeLabel}</span>
              </p>
              <p className="text-muted-foreground">
                Generated: <span className="font-medium text-foreground">{currentDateStr}</span>
              </p>
              <p className="text-muted-foreground">
                Role Context: <span className="font-semibold text-primary">{data.userRole}</span>
              </p>
            </div>
          </div>

          {/* TAB CONTENT: SALES OVERVIEW */}
          {activeTab === 'sales' && data.salesOverview && (
            <div className="space-y-6">
              {/* Stat Tiles */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Key Sales Metrics
                </h4>
                <div className="grid grid-cols-4 gap-3">
                  <div className="rounded-xl border border-border p-3 text-center">
                    <p className="text-[11px] text-muted-foreground uppercase font-medium">Total Revenue</p>
                    <p className="text-lg font-bold mt-1">₹{data.salesOverview.totalRevenue.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="rounded-xl border border-border p-3 text-center">
                    <p className="text-[11px] text-muted-foreground uppercase font-medium">Deals Won</p>
                    <p className="text-lg font-bold mt-1">{data.salesOverview.dealsWon}</p>
                  </div>
                  <div className="rounded-xl border border-border p-3 text-center">
                    <p className="text-[11px] text-muted-foreground uppercase font-medium">Avg Deal Size</p>
                    <p className="text-lg font-bold mt-1">₹{data.salesOverview.avgDealSize.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="rounded-xl border border-border p-3 text-center">
                    <p className="text-[11px] text-muted-foreground uppercase font-medium">Win Rate</p>
                    <p className="text-lg font-bold mt-1">{data.salesOverview.winRate}%</p>
                  </div>
                </div>
              </div>

              {/* Monthly Trend Table */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Monthly Revenue & Outcome Breakdown (Last 6 Months)
                </h4>
                <table className="w-full text-left text-xs border border-border rounded-xl overflow-hidden">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Month</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Revenue Collected</th>
                      <th className="px-4 py-2.5 font-semibold text-center">Deals Won</th>
                      <th className="px-4 py-2.5 font-semibold text-center">Deals Lost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.salesOverview.revenueTrend.map((m, i) => (
                      <tr key={m.month}>
                        <td className="px-4 py-2 font-medium">{m.month}</td>
                        <td className="px-4 py-2 text-right font-mono font-semibold">₹{m.revenue.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-2 text-center text-emerald-600 font-bold">{data.salesOverview!.wonVsLostTrend[i]?.won || 0}</td>
                        <td className="px-4 py-2 text-center text-rose-600 font-bold">{data.salesOverview!.wonVsLostTrend[i]?.lost || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pipeline Stage Distribution Table */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Pipeline Stage Breakdown
                </h4>
                <table className="w-full text-left text-xs border border-border rounded-xl overflow-hidden">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Stage</th>
                      <th className="px-4 py-2.5 font-semibold text-center">Deal Count</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Potential Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.salesOverview.stageDistribution.map((s) => (
                      <tr key={s.stage}>
                        <td className="px-4 py-2 font-medium">{s.label}</td>
                        <td className="px-4 py-2 text-center font-bold">{s.count}</td>
                        <td className="px-4 py-2 text-right font-mono font-semibold">₹{s.value.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB CONTENT: LEADS & CONVERSION */}
          {activeTab === 'leads' && data.leadsConversion && (
            <div className="space-y-6">
              {/* Stat Tiles */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border p-3 text-center">
                  <p className="text-[11px] text-muted-foreground uppercase font-medium">Total Leads</p>
                  <p className="text-lg font-bold mt-1">{data.leadsConversion.totalLeads}</p>
                </div>
                <div className="rounded-xl border border-border p-3 text-center">
                  <p className="text-[11px] text-muted-foreground uppercase font-medium">Conversion Rate</p>
                  <p className="text-lg font-bold mt-1">{data.leadsConversion.conversionRate}%</p>
                </div>
                <div className="rounded-xl border border-border p-3 text-center">
                  <p className="text-[11px] text-muted-foreground uppercase font-medium">Avg Conversion Days</p>
                  <p className="text-lg font-bold mt-1">{data.leadsConversion.avgTimeToConversionDays} days</p>
                </div>
              </div>

              {/* Funnel Table */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Lead Conversion Funnel Stages
                </h4>
                <table className="w-full text-left text-xs border border-border rounded-xl overflow-hidden">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Stage</th>
                      <th className="px-4 py-2.5 font-semibold text-center">Leads Reached</th>
                      <th className="px-4 py-2.5 font-semibold text-center">Stage Conversion %</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Overall Pipeline %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.leadsConversion.funnelSteps.map((f) => (
                      <tr key={f.stage}>
                        <td className="px-4 py-2 font-semibold">{f.label}</td>
                        <td className="px-4 py-2 text-center font-bold">{f.count}</td>
                        <td className="px-4 py-2 text-center text-primary font-medium">{f.conversionRateFromPrev}%</td>
                        <td className="px-4 py-2 text-right font-mono">{f.conversionRateFromTotal}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Leads by Source Table */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Leads by Acquisition Source
                </h4>
                <table className="w-full text-left text-xs border border-border rounded-xl overflow-hidden">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Source Channel</th>
                      <th className="px-4 py-2.5 font-semibold text-center">Leads Count</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Share of Leads</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.leadsConversion.leadsBySource.map((s) => (
                      <tr key={s.source}>
                        <td className="px-4 py-2 font-medium">{s.label}</td>
                        <td className="px-4 py-2 text-center font-bold">{s.count}</td>
                        <td className="px-4 py-2 text-right font-mono">{s.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB CONTENT: EMPLOYEE PERFORMANCE */}
          {activeTab === 'employees' && data.employeePerformance && (
            <div className="space-y-6">
              {/* Sales Reps Leaderboard */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Sales Representative Performance
                </h4>
                <table className="w-full text-left text-xs border border-border rounded-xl overflow-hidden">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Rank</th>
                      <th className="px-4 py-2.5 font-semibold">Representative</th>
                      <th className="px-4 py-2.5 font-semibold text-center">Leads Assigned</th>
                      <th className="px-4 py-2.5 font-semibold text-center">Deals Won</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Revenue Generated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.employeePerformance.salesLeaderboard.map((r, i) => (
                      <tr key={r.id}>
                        <td className="px-4 py-2 font-bold text-muted-foreground">#{i + 1}</td>
                        <td className="px-4 py-2 font-semibold">{r.name}</td>
                        <td className="px-4 py-2 text-center">{r.leadsAssigned}</td>
                        <td className="px-4 py-2 text-center text-emerald-600 font-bold">{r.dealsWon}</td>
                        <td className="px-4 py-2 text-right font-mono font-bold">₹{r.revenueGenerated.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Support Agents Table */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Support Team Resolution Metrics
                </h4>
                <table className="w-full text-left text-xs border border-border rounded-xl overflow-hidden">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Support Agent</th>
                      <th className="px-4 py-2.5 font-semibold text-center">Tickets Resolved</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Avg Resolution Speed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.employeePerformance.supportAgentMetrics.map((a) => (
                      <tr key={a.id}>
                        <td className="px-4 py-2 font-semibold">{a.name}</td>
                        <td className="px-4 py-2 text-center text-blue-600 font-bold">{a.ticketsResolved}</td>
                        <td className="px-4 py-2 text-right">{a.avgResolutionHours > 0 ? `${a.avgResolutionHours} hrs` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB CONTENT: CLIENT & REVENUE */}
          {activeTab === 'clients' && data.clientRevenue && (
            <div className="space-y-6">
              {/* Stat Tiles */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border p-3 text-center">
                  <p className="text-[11px] text-muted-foreground uppercase font-medium">Active Clients</p>
                  <p className="text-lg font-bold mt-1">{data.clientRevenue.totalActiveClients}</p>
                </div>
                <div className="rounded-xl border border-border p-3 text-center">
                  <p className="text-[11px] text-muted-foreground uppercase font-medium">New Clients</p>
                  <p className="text-lg font-bold mt-1">{data.clientRevenue.newClientsCount}</p>
                </div>
                <div className="rounded-xl border border-border p-3 text-center">
                  <p className="text-[11px] text-muted-foreground uppercase font-medium">Total Outstanding</p>
                  <p className="text-lg font-bold mt-1">₹{data.clientRevenue.totalOutstanding.toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Top 10 Clients Table */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Top 10 Clients by Settled Payments
                </h4>
                <table className="w-full text-left text-xs border border-border rounded-xl overflow-hidden">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Rank</th>
                      <th className="px-4 py-2.5 font-semibold">Client Company</th>
                      <th className="px-4 py-2.5 font-semibold text-center">Invoices</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Total Revenue Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.clientRevenue.topClients.map((c, i) => (
                      <tr key={c.id}>
                        <td className="px-4 py-2 font-bold text-muted-foreground">#{i + 1}</td>
                        <td className="px-4 py-2 font-semibold">{c.companyName}</td>
                        <td className="px-4 py-2 text-center">{c.invoiceCount}</td>
                        <td className="px-4 py-2 text-right font-mono font-bold">₹{c.totalRevenue.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB CONTENT: MY PERFORMANCE */}
          {activeTab === 'my-performance' && data.myPerformance && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border p-3 text-center">
                  <p className="text-[11px] text-muted-foreground uppercase font-medium">My Assigned Leads</p>
                  <p className="text-lg font-bold mt-1">{data.myPerformance.totalLeads}</p>
                </div>
                <div className="rounded-xl border border-border p-3 text-center">
                  <p className="text-[11px] text-muted-foreground uppercase font-medium">My Deals Won</p>
                  <p className="text-lg font-bold mt-1">{data.myPerformance.dealsWonCount}</p>
                </div>
                <div className="rounded-xl border border-border p-3 text-center">
                  <p className="text-[11px] text-muted-foreground uppercase font-medium">My Revenue Contribution</p>
                  <p className="text-lg font-bold mt-1">₹{data.myPerformance.revenueContribution.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  My Pipeline Stages
                </h4>
                <table className="w-full text-left text-xs border border-border rounded-xl overflow-hidden">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Stage</th>
                      <th className="px-4 py-2.5 font-semibold text-center">Deal Count</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Potential Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.myPerformance.dealsByStage.map((s) => (
                      <tr key={s.stage}>
                        <td className="px-4 py-2 font-medium">{s.label}</td>
                        <td className="px-4 py-2 text-center font-bold">{s.count}</td>
                        <td className="px-4 py-2 text-right font-mono font-semibold">₹{s.value.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Document Footer */}
          <div className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">Pulse CRM • Automated Analytics & Reporting</p>
            <p className="mt-0.5">Confidential document generated for internal management review.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
