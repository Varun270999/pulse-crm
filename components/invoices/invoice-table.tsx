'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { RecordPaymentModal } from '@/components/invoices/record-payment-modal';
import { formatINR, cn } from '@/lib/utils';
import {
  INVOICE_STATUS_CONFIG,
  invoiceStatuses,
  type InvoiceData,
  type InvoiceStatusType,
} from '@/types/billing';
import { updateInvoiceStatusAction, deleteInvoiceAction } from '@/app/actions/billing';
import {
  Building2,
  Calendar,
  CreditCard,
  Printer,
  Trash2,
  MoreHorizontal,
  ArrowUpDown,
  AlertCircle,
  Receipt,
  Plus,
} from 'lucide-react';

interface InvoiceTableProps {
  invoices: InvoiceData[];
  userRole?: string;
  onRefresh?: () => void;
}

type SortField = 'invoiceNumber' | 'client' | 'issueDate' | 'dueDate' | 'totalAmount' | 'paidAmount' | 'status';

export function InvoiceTable({ invoices, userRole, onRefresh }: InvoiceTableProps) {
  const [sortField, setSortField] = useState<SortField>('issueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<InvoiceData | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }

  async function handleStatusChange(invoiceId: string, newStatus: InvoiceStatusType) {
    await updateInvoiceStatusAction(invoiceId, newStatus);
    if (onRefresh) onRefresh();
  }

  async function handleDelete(invoice: InvoiceData) {
    if (!confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}? This cannot be undone.`)) {
      return;
    }
    await deleteInvoiceAction(invoice.id);
    if (onRefresh) onRefresh();
  }

  const sortedInvoices = [...invoices].sort((a, b) => {
    let comp = 0;
    if (sortField === 'invoiceNumber') {
      comp = a.invoiceNumber.localeCompare(b.invoiceNumber);
    } else if (sortField === 'client') {
      comp = a.client.companyName.localeCompare(b.client.companyName);
    } else if (sortField === 'issueDate') {
      comp = new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
    } else if (sortField === 'dueDate') {
      comp = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    } else if (sortField === 'totalAmount') {
      comp = a.totalAmount - b.totalAmount;
    } else if (sortField === 'paidAmount') {
      comp = a.paidAmount - b.paidAmount;
    } else if (sortField === 'status') {
      comp = a.status.localeCompare(b.status);
    }
    return sortOrder === 'asc' ? comp : -comp;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 border-b border-border/70 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
            <tr>
              <th className="py-3.5 px-4 cursor-pointer hover:text-foreground" onClick={() => handleSort('invoiceNumber')}>
                <div className="flex items-center gap-1.5">
                  Invoice #
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
              <th className="py-3.5 px-4 cursor-pointer hover:text-foreground" onClick={() => handleSort('dueDate')}>
                <div className="flex items-center gap-1.5">
                  Due Date
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-foreground text-right" onClick={() => handleSort('totalAmount')}>
                <div className="flex items-center justify-end gap-1.5">
                  Total
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 text-right cursor-pointer hover:text-foreground" onClick={() => handleSort('paidAmount')}>
                <div className="flex items-center justify-end gap-1.5">
                  Balance Due
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
            {sortedInvoices.map((inv) => {
              const statusConfig = INVOICE_STATUS_CONFIG[inv.status];
              const remainingBalance = Math.max(0, inv.totalAmount - inv.paidAmount);
              const dueDate = new Date(inv.dueDate);
              const isOverdue = dueDate < today && inv.status !== 'PAID' && inv.status !== 'CANCELLED';

              return (
                <tr key={inv.id} className="hover:bg-muted/30 transition-colors group">
                  {/* Invoice # */}
                  <td className="py-3 px-4 font-semibold text-foreground">
                    <Link
                      href={`/dashboard/invoices/${inv.id}`}
                      className="text-primary hover:underline font-mono"
                    >
                      {inv.invoiceNumber}
                    </Link>
                  </td>

                  {/* Client */}
                  <td className="py-3 px-4 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate max-w-[150px]" title={inv.client.companyName}>
                        {inv.client.companyName}
                      </span>
                    </div>
                  </td>

                  {/* Issue Date */}
                  <td className="py-3 px-4 text-xs text-muted-foreground">
                    {new Date(inv.issueDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>

                  {/* Due Date */}
                  <td className="py-3 px-4 text-xs">
                    <div
                      className={cn(
                        'flex items-center gap-1.5 font-medium',
                        isOverdue
                          ? 'text-rose-600 dark:text-rose-400 font-semibold'
                          : 'text-muted-foreground'
                      )}
                    >
                      {isOverdue ? (
                        <AlertCircle className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
                      ) : (
                        <Calendar className="h-3 w-3" />
                      )}
                      <span>
                        {dueDate.toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </td>

                  {/* Total Amount */}
                  <td className="py-3 px-4 font-semibold text-foreground text-right tabular-nums">
                    {formatINR(inv.totalAmount)}
                  </td>

                  {/* Balance Due */}
                  <td className="py-3 px-4 text-right tabular-nums text-xs font-medium">
                    <span
                      className={cn(
                        remainingBalance > 0
                          ? 'text-amber-600 dark:text-amber-400 font-semibold'
                          : 'text-emerald-600'
                      )}
                    >
                      {formatINR(remainingBalance)}
                    </span>
                  </td>

                  {/* Status Dropdown */}
                  <td className="py-3 px-4">
                    <select
                      value={inv.status}
                      onChange={(e) =>
                        handleStatusChange(inv.id, e.target.value as InvoiceStatusType)
                      }
                      className={cn(
                        'text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer bg-transparent focus:outline-none focus:ring-1 focus:ring-primary',
                        statusConfig.badgeBg,
                        statusConfig.badgeText,
                        statusConfig.badgeBorder
                      )}
                    >
                      {invoiceStatuses.map((st) => (
                        <option
                          key={st}
                          value={st}
                          className="bg-popover text-popover-foreground font-normal"
                        >
                          {INVOICE_STATUS_CONFIG[st].label}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Record Payment Button (Quick Action) */}
                      {remainingBalance > 0 && inv.status !== 'CANCELLED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedInvoiceForPayment(inv)}
                          className="h-8 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1"
                          title="Record Payment"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Pay</span>
                        </Button>
                      )}

                      {/* View / Print Button */}
                      <Link
                        href={`/dashboard/invoices/${inv.id}`}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="View / Print Invoice"
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
                            setOpenMenuId(openMenuId === inv.id ? null : inv.id)
                          }
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>

                        {openMenuId === inv.id && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-0 mt-1 w-40 rounded-md border border-border bg-popover p-1 shadow-lg z-50 text-xs text-left">
                              <Link
                                href={`/dashboard/invoices/${inv.id}`}
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
                                    handleDelete(inv);
                                  }}
                                  className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete Invoice
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

            {sortedInvoices.length === 0 && (
              <tr>
                <td colSpan={8} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-1">
                      <Receipt className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-gray-900">No invoices found</p>
                    <p className="text-xs text-gray-500 max-w-sm">
                      Create invoices for your clients to track payments, outstanding balances, and receivables.
                    </p>
                    {userRole !== 'SUPPORT_AGENT' && (
                      <Link
                        href="/dashboard/invoices/new"
                        className={cn(buttonVariants({ size: 'sm' }), 'mt-2 inline-flex items-center gap-1.5')}
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create Invoice</span>
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Modal */}
      <RecordPaymentModal
        invoice={selectedInvoiceForPayment}
        open={!!selectedInvoiceForPayment}
        onClose={() => setSelectedInvoiceForPayment(null)}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
}
