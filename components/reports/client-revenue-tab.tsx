'use client';

import { Building2, UserPlus, AlertCircle, Download, Trophy } from 'lucide-react';
import { ReportStatTile } from '@/components/reports/report-stat-tile';
import type { ClientRevenueData } from '@/types/reports';

interface ClientRevenueTabProps {
  data: ClientRevenueData;
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

export function ClientRevenueTab({ data, rangeLabel }: ClientRevenueTabProps) {
  const { totalActiveClients, newClientsCount, totalOutstanding, topClients } = data;

  const handleExportClientsCsv = () => {
    const headers = ['Rank', 'Client Company', 'Invoices Generated', 'Total Revenue Paid (INR)'];
    const rows = topClients.map((c, idx) => [
      idx + 1,
      c.companyName,
      c.invoiceCount,
      c.totalRevenue,
    ]);
    downloadCsv(`top_clients_revenue_${Date.now()}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* 1. Stat Tiles Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ReportStatTile
          title="Total Active Clients"
          value={totalActiveClients}
          subtitle="All active CRM client accounts"
          icon={<Building2 className="h-5 w-5 text-blue-500" />}
        />
        <ReportStatTile
          title="New Clients Acquired"
          value={newClientsCount}
          subtitle={rangeLabel}
          icon={<UserPlus className="h-5 w-5 text-emerald-500" />}
        />
        <ReportStatTile
          title="Total Outstanding Receivables"
          value={`₹${totalOutstanding.toLocaleString('en-IN')}`}
          subtitle="Unpaid invoice balance"
          icon={<AlertCircle className="h-5 w-5 text-amber-500" />}
        />
      </div>

      {/* 2. Top Clients by Total Revenue Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Top 10 Clients by Revenue
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ranked by cumulative settled payments across all invoices
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportClientsCsv}
            disabled={topClients.length === 0}
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
                <th scope="col" className="px-5 py-3">Client Company</th>
                <th scope="col" className="px-5 py-3 text-center">Invoices</th>
                <th scope="col" className="px-5 py-3 text-right">Total Revenue Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topClients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                    No client revenue records found.
                  </td>
                </tr>
              ) : (
                topClients.map((client, idx) => (
                  <tr key={client.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-xs text-muted-foreground">
                      #{idx + 1}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-foreground">
                      {client.companyName}
                    </td>
                    <td className="px-5 py-3.5 text-center text-muted-foreground font-medium">
                      {client.invoiceCount}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-foreground">
                      ₹{client.totalRevenue.toLocaleString('en-IN')}
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
