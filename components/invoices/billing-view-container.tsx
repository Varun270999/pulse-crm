'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BillingStatsCards } from '@/components/invoices/billing-stats-cards';
import { InvoiceTable } from '@/components/invoices/invoice-table';
import { QuotationTable } from '@/components/invoices/quotation-table';
import {
  invoiceStatuses,
  quotationStatuses,
  INVOICE_STATUS_CONFIG,
  QUOTATION_STATUS_CONFIG,
  type InvoiceData,
  type QuotationData,
  type BillingStats,
} from '@/types/billing';
import {
  Plus,
  Search,
  Filter,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BillingViewContainerProps {
  initialInvoices: InvoiceData[];
  initialQuotations: QuotationData[];
  stats: BillingStats;
  currentUser: {
    id: string;
    name?: string | null;
    role: string;
  };
}

export function BillingViewContainer({
  initialInvoices,
  initialQuotations,
  stats,
  currentUser,
}: BillingViewContainerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'quotations' ? 'quotations' : 'invoices';

  const [activeTab, setActiveTab] = useState<'invoices' | 'quotations'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  function handleTabChange(tab: 'invoices' | 'quotations') {
    setActiveTab(tab);
    setSelectedStatus('ALL');
    const params = new URLSearchParams(window.location.search);
    if (tab === 'quotations') {
      params.set('tab', 'quotations');
    } else {
      params.delete('tab');
    }
    router.replace(`/dashboard/invoices${params.toString() ? `?${params.toString()}` : ''}`);
  }

  // Filter Invoices
  const filteredInvoices = initialInvoices.filter((inv) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = inv.invoiceNumber.toLowerCase().includes(q);
      const matchClient = inv.client.companyName.toLowerCase().includes(q);
      if (!matchNum && !matchClient) return false;
    }
    if (selectedStatus !== 'ALL' && inv.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  // Filter Quotations
  const filteredQuotations = initialQuotations.filter((qt) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = qt.quotationNumber.toLowerCase().includes(q);
      const matchClient = qt.client.companyName.toLowerCase().includes(q);
      if (!matchNum && !matchClient) return false;
    }
    if (selectedStatus !== 'ALL' && qt.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Quotations & Invoices
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage client estimates, line-item invoices, payment receipts, and billing terms
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/dashboard/quotations/new"
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'gap-1.5 shadow-2xs text-xs'
            )}
          >
            <Plus className="h-4 w-4" />
            <span>New Quotation</span>
          </Link>
          <Link
            href="/dashboard/invoices/new"
            className={cn(buttonVariants({ variant: 'default' }), 'gap-1.5 shadow-xs text-xs')}
          >
            <Plus className="h-4 w-4" />
            <span>New Invoice</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <BillingStatsCards stats={stats} activeTab={activeTab} />

      {/* Main Tabs and Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/80 p-3 rounded-xl shadow-2xs">
        {/* Tab Switcher */}
        <div className="flex items-center gap-1 border border-border/80 rounded-lg p-0.5 bg-muted/40">
          <button
            type="button"
            onClick={() => handleTabChange('invoices')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
              activeTab === 'invoices'
                ? 'bg-card text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>Invoices</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-primary/10 text-primary">
              {initialInvoices.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('quotations')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
              activeTab === 'quotations'
                ? 'bg-card text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Quotations</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
              {initialQuotations.length}
            </span>
          </button>
        </div>

        {/* Search & Status Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1 max-w-md justify-end">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${activeTab === 'invoices' ? 'invoices' : 'quotations'} or client...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Statuses</option>
              {activeTab === 'invoices'
                ? invoiceStatuses.map((st) => (
                    <option key={st} value={st}>
                      {INVOICE_STATUS_CONFIG[st].label}
                    </option>
                  ))
                : quotationStatuses.map((st) => (
                    <option key={st} value={st}>
                      {QUOTATION_STATUS_CONFIG[st].label}
                    </option>
                  ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table View */}
      {activeTab === 'invoices' ? (
        <InvoiceTable
          invoices={filteredInvoices}
          userRole={currentUser.role}
          onRefresh={() => router.refresh()}
        />
      ) : (
        <QuotationTable
          quotations={filteredQuotations}
          userRole={currentUser.role}
          onRefresh={() => router.refresh()}
        />
      )}
    </div>
  );
}
