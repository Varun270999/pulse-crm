'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { ConvertQuoteModal } from '@/components/invoices/convert-quote-modal';
import { formatINR, cn } from '@/lib/utils';
import {
  QUOTATION_STATUS_CONFIG,
  quotationStatuses,
  type QuotationData,
  type QuotationStatusType,
} from '@/types/billing';
import { updateQuotationStatusAction, deleteQuotationAction } from '@/app/actions/billing';
import {
  Building2,
  Printer,
  Trash2,
  MoreHorizontal,
  ArrowUpDown,
  ArrowRightLeft,
  Plus,
  FileText,
} from 'lucide-react';

interface QuotationTableProps {
  quotations: QuotationData[];
  userRole?: string;
  onRefresh?: () => void;
}

type SortField = 'quotationNumber' | 'client' | 'issueDate' | 'validUntil' | 'totalAmount' | 'status';

export function QuotationTable({ quotations, userRole, onRefresh }: QuotationTableProps) {
  const [sortField, setSortField] = useState<SortField>('issueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedQuoteForConversion, setSelectedQuoteForConversion] = useState<QuotationData | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }

  async function handleStatusChange(quotationId: string, newStatus: QuotationStatusType) {
    await updateQuotationStatusAction(quotationId, newStatus);
    if (onRefresh) onRefresh();
  }

  async function handleDelete(quotation: QuotationData) {
    if (!confirm(`Are you sure you want to delete quotation ${quotation.quotationNumber}? This cannot be undone.`)) {
      return;
    }
    await deleteQuotationAction(quotation.id);
    if (onRefresh) onRefresh();
  }

  const sortedQuotations = [...quotations].sort((a, b) => {
    let comp = 0;
    if (sortField === 'quotationNumber') {
      comp = a.quotationNumber.localeCompare(b.quotationNumber);
    } else if (sortField === 'client') {
      comp = a.client.companyName.localeCompare(b.client.companyName);
    } else if (sortField === 'issueDate') {
      comp = new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
    } else if (sortField === 'validUntil') {
      const dateA = a.validUntil ? new Date(a.validUntil).getTime() : 0;
      const dateB = b.validUntil ? new Date(b.validUntil).getTime() : 0;
      comp = dateA - dateB;
    } else if (sortField === 'totalAmount') {
      comp = a.totalAmount - b.totalAmount;
    } else if (sortField === 'status') {
      comp = a.status.localeCompare(b.status);
    }
    return sortOrder === 'asc' ? comp : -comp;
  });

  return (
    <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 border-b border-border/70 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
            <tr>
              <th className="py-3.5 px-4 cursor-pointer hover:text-foreground" onClick={() => handleSort('quotationNumber')}>
                <div className="flex items-center gap-1.5">
                  Quotation #
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-foreground" onClick={() => handleSort('client')}>
                <div className="flex items-center gap-1.5">
                  Client
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-foreground" onClick={() => handleSort('issueDate')}>
                <div className="flex items-center gap-1.5">
                  Issued
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-foreground" onClick={() => handleSort('validUntil')}>
                <div className="flex items-center gap-1.5">
                  Valid Until
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-foreground text-right" onClick={() => handleSort('totalAmount')}>
                <div className="flex items-center justify-end gap-1.5">
                  Quoted Total
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-foreground" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-1.5">
                  Status
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {sortedQuotations.map((qt) => {
              const statusConfig = QUOTATION_STATUS_CONFIG[qt.status];

              return (
                <tr key={qt.id} className="hover:bg-muted/30 transition-colors group">
                  {/* Quotation # */}
                  <td className="py-3 px-4 font-semibold text-foreground">
                    <Link
                      href={`/dashboard/quotations/${qt.id}`}
                      className="text-indigo-600 hover:underline font-mono"
                    >
                      {qt.quotationNumber}
                    </Link>
                  </td>

                  {/* Client */}
                  <td className="py-3 px-4 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate max-w-[150px]" title={qt.client.companyName}>
                        {qt.client.companyName}
                      </span>
                    </div>
                  </td>

                  {/* Issue Date */}
                  <td className="py-3 px-4 text-xs text-muted-foreground">
                    {new Date(qt.issueDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>

                  {/* Valid Until */}
                  <td className="py-3 px-4 text-xs text-muted-foreground">
                    {qt.validUntil ? (
                      new Date(qt.validUntil).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    ) : (
                      '—'
                    )}
                  </td>

                  {/* Total Amount */}
                  <td className="py-3 px-4 font-semibold text-foreground text-right tabular-nums">
                    {formatINR(qt.totalAmount)}
                  </td>

                  {/* Status Dropdown */}
                  <td className="py-3 px-4">
                    <select
                      value={qt.status}
                      onChange={(e) =>
                        handleStatusChange(qt.id, e.target.value as QuotationStatusType)
                      }
                      className={cn(
                        'text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer bg-transparent focus:outline-none focus:ring-1 focus:ring-primary',
                        statusConfig.badgeBg,
                        statusConfig.badgeText,
                        statusConfig.badgeBorder
                      )}
                    >
                      {quotationStatuses.map((st) => (
                        <option
                          key={st}
                          value={st}
                          className="bg-popover text-popover-foreground font-normal"
                        >
                          {QUOTATION_STATUS_CONFIG[st].label}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Convert to Invoice Button (Quick Action) */}
                      {qt.status !== 'ACCEPTED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedQuoteForConversion(qt)}
                          className="h-8 px-2 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 gap-1"
                          title="Convert to Invoice"
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Invoice</span>
                        </Button>
                      )}

                      {/* View / Print Button */}
                      <Link
                        href={`/dashboard/quotations/${qt.id}`}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="View / Print Quotation"
                      >
                        <Printer className="h-4 w-4" />
                      </Link>

                      {/* Menu */}
                      <div className="relative inline-block text-left">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() =>
                            setOpenMenuId(openMenuId === qt.id ? null : qt.id)
                          }
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>

                        {openMenuId === qt.id && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-0 mt-1 w-40 rounded-md border border-border bg-popover p-1 shadow-lg z-50 text-xs text-left">
                              <Link
                                href={`/dashboard/quotations/${qt.id}`}
                                className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-foreground hover:bg-muted"
                                onClick={() => setOpenMenuId(null)}
                              >
                                <Printer className="h-3.5 w-3.5 text-muted-foreground" />
                                View Details
                              </Link>
                              {userRole !== 'SUPPORT_AGENT' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleDelete(qt);
                                  }}
                                  className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete Quote
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}

            {sortedQuotations.length === 0 && (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-1">
                      <FileText className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-gray-900">No quotations found</p>
                    <p className="text-xs text-gray-500 max-w-sm">
                      Create formal quotations for your clients and convert them to invoices with one click upon acceptance.
                    </p>
                    {userRole !== 'SUPPORT_AGENT' && (
                      <Link
                        href="/dashboard/quotations/new"
                        className={cn(buttonVariants({ size: 'sm' }), 'mt-2 inline-flex items-center gap-1.5')}
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create Quotation</span>
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Convert to Invoice Modal */}
      <ConvertQuoteModal
        quotation={selectedQuoteForConversion}
        open={!!selectedQuoteForConversion}
        onClose={() => setSelectedQuoteForConversion(null)}
      />
    </div>
  );
}
