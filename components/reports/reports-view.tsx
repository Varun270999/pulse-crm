'use client';

import { useState } from 'react';
import {
  BarChart3,
  Target,
  Users,
  Building2,
  FileDown,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { DateRangeSelector } from '@/components/reports/date-range-selector';
import { getReportsDataAction } from '@/app/actions/reports';
import type { ReportsData, DateRangeFilter } from '@/types/reports';
import { Skeleton } from '@/components/ui/skeleton';

const TabChartFallback = () => (
  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
    <Skeleton className="h-6 w-44" />
    <Skeleton className="h-64 w-full rounded-xl" />
  </div>
);

const SalesOverviewTab = dynamic(
  () => import('@/components/reports/sales-overview-tab').then((m) => m.SalesOverviewTab),
  { loading: TabChartFallback }
);
const LeadsConversionTab = dynamic(
  () => import('@/components/reports/leads-conversion-tab').then((m) => m.LeadsConversionTab),
  { loading: TabChartFallback }
);
const EmployeePerformanceTab = dynamic(
  () => import('@/components/reports/employee-performance-tab').then((m) => m.EmployeePerformanceTab),
  { loading: TabChartFallback }
);
const ClientRevenueTab = dynamic(
  () => import('@/components/reports/client-revenue-tab').then((m) => m.ClientRevenueTab),
  { loading: TabChartFallback }
);
const MyPerformanceView = dynamic(
  () => import('@/components/reports/my-performance-view').then((m) => m.MyPerformanceView),
  { loading: TabChartFallback }
);
const PrintableReportModal = dynamic(
  () => import('@/components/reports/printable-report-modal').then((m) => m.PrintableReportModal),
  { ssr: false }
);

interface ReportsViewProps {
  initialData: ReportsData;
}

type TabType = 'sales' | 'leads' | 'employees' | 'clients' | 'my-performance';

export function ReportsView({ initialData }: ReportsViewProps) {
  const [data, setData] = useState<ReportsData>(initialData);
  const [activeTab, setActiveTab] = useState<TabType>(
    initialData.userRole === 'SALES_EXECUTIVE' ? 'my-performance' : 'sales'
  );
  const [filter, setFilter] = useState<DateRangeFilter>(initialData.dateRange);
  const [isLoading, setIsLoading] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const isSalesExec = data.userRole === 'SALES_EXECUTIVE';

  const handleFilterChange = async (newFilter: DateRangeFilter) => {
    setFilter(newFilter);
    setIsLoading(true);

    try {
      const res = await getReportsDataAction(newFilter);
      if (res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to reload reports for range:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs: { id: TabType; label: string; icon: LucideIcon }[] = [
    { id: 'sales', label: 'Sales Overview', icon: BarChart3 },
    { id: 'leads', label: 'Leads & Conversion', icon: Target },
    { id: 'employees', label: 'Employee Performance', icon: Users },
    { id: 'clients', label: 'Client & Revenue', icon: Building2 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Global Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isSalesExec ? 'My Performance & Analytics' : 'Reports & Analytics'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isSalesExec
              ? 'Real-time tracking of your personal leads, deal milestones, and revenue contributions.'
              : 'Interactive operational metrics, conversion funnels, and revenue performance.'}
          </p>
        </div>

        {/* Global Actions: Export PDF */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsPdfModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-sm hover:bg-muted transition-colors"
          >
            <FileDown className="h-4 w-4 text-primary" />
            <span>Export PDF Summary</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector Bar */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <DateRangeSelector
          currentFilter={filter}
          onFilterChange={handleFilterChange}
          isLoading={isLoading}
        />
      </div>

      {/* Main Tabs (Admin & Manager) */}
      {!isSalesExec ? (
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex overflow-x-auto border-b border-border gap-2 pb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Panes */}
          {isLoading ? (
            <div className="flex h-72 items-center justify-center rounded-2xl border border-border bg-card">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Calculating metrics for {data.rangeLabel}...</span>
              </div>
            </div>
          ) : (
            <div>
              {activeTab === 'sales' && data.salesOverview && (
                <SalesOverviewTab data={data.salesOverview} rangeLabel={data.rangeLabel} />
              )}
              {activeTab === 'leads' && data.leadsConversion && (
                <LeadsConversionTab data={data.leadsConversion} rangeLabel={data.rangeLabel} />
              )}
              {activeTab === 'employees' && data.employeePerformance && (
                <EmployeePerformanceTab
                  data={data.employeePerformance}
                  rangeLabel={data.rangeLabel}
                />
              )}
              {activeTab === 'clients' && data.clientRevenue && (
                <ClientRevenueTab data={data.clientRevenue} rangeLabel={data.rangeLabel} />
              )}
            </div>
          )}
        </div>
      ) : (
        /* Sales Executive View */
        <div>
          {isLoading ? (
            <div className="flex h-72 items-center justify-center rounded-2xl border border-border bg-card">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Loading your performance data for {data.rangeLabel}...</span>
              </div>
            </div>
          ) : (
            data.myPerformance && (
              <MyPerformanceView data={data.myPerformance} rangeLabel={data.rangeLabel} />
            )
          )}
        </div>
      )}

      {/* Printable Executive PDF Modal */}
      <PrintableReportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        activeTab={activeTab}
        data={data}
      />
    </div>
  );
}
