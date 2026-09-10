'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatINR, cn } from '@/lib/utils';
import {
  paymentMethods,
  PAYMENT_METHOD_CONFIG,
  type PaymentData,
} from '@/types/payment';
import type { UserRole } from '@/lib/auth/rbac';
import { EditPaymentModal } from './edit-payment-modal';
import { DeletePaymentModal } from './delete-payment-modal';
import {
  Search,
  Plus,
  Receipt,
  ExternalLink,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface PaymentTableProps {
  payments: PaymentData[];
  userRole: UserRole;
  clients: { id: string; companyName: string }[];
}

export function PaymentTable({ payments, userRole, clients }: PaymentTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [clientFilter, setClientFilter] = useState<string>('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Modals state
  const [editingPayment, setEditingPayment] = useState<PaymentData | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<PaymentData | null>(null);

  const canManage = userRole === 'ADMIN' || userRole === 'MANAGER';
  const canRecord = userRole !== 'SUPPORT_AGENT';

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // Search term
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchReceipt = p.receiptNumber.toLowerCase().includes(query);
        const matchClient = p.client?.companyName.toLowerCase().includes(query) ?? false;
        const matchInvoice = p.invoice?.invoiceNumber.toLowerCase().includes(query) ?? false;
        const matchRef = p.referenceNumber?.toLowerCase().includes(query) ?? false;

        if (!matchReceipt && !matchClient && !matchInvoice && !matchRef) {
          return false;
        }
      }

      // Method filter
      if (methodFilter !== 'ALL' && p.paymentMethod !== methodFilter) {
        return false;
      }

      // Client filter
      if (clientFilter !== 'ALL' && p.clientId !== clientFilter) {
        return false;
      }

      // Date range filter
      if (dateRangeFilter !== 'ALL') {
        const paymentDate = new Date(p.paymentDate);
        const now = new Date();

        if (dateRangeFilter === 'THIS_MONTH') {
          if (
            paymentDate.getMonth() !== now.getMonth() ||
            paymentDate.getFullYear() !== now.getFullYear()
          ) {
            return false;
          }
        } else if (dateRangeFilter === 'LAST_MONTH') {
          const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
          const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
          if (
            paymentDate.getMonth() !== lastMonth ||
            paymentDate.getFullYear() !== lastMonthYear
          ) {
            return false;
          }
        }
      }

      return true;
    });
  }, [payments, searchQuery, methodFilter, clientFilter, dateRangeFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));
  const paginatedPayments = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredPayments.slice(startIndex, startIndex + pageSize);
  }, [filteredPayments, currentPage, pageSize]);

  return (
    <div className="space-y-4">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search receipt #, client, ref..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Payment Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 px-3 text-xs rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">All Methods</option>
            {paymentMethods.map((m) => (
              <option key={m} value={m}>
                {PAYMENT_METHOD_CONFIG[m].label}
              </option>
            ))}
          </select>

          {/* Date Range Filter */}
          <select
            value={dateRangeFilter}
            onChange={(e) => {
              setDateRangeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 px-3 text-xs rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">All Time</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="LAST_MONTH">Last Month</option>
          </select>

          {/* Client Filter */}
          {clients.length > 0 && (
            <select
              value={clientFilter}
              onChange={(e) => {
                setClientFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3 text-xs rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring max-w-[180px] truncate"
            >
              <option value="ALL">All Clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          )}

          {(searchQuery || methodFilter !== 'ALL' || clientFilter !== 'ALL' || dateRangeFilter !== 'ALL') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setMethodFilter('ALL');
                setClientFilter('ALL');
                setDateRangeFilter('ALL');
                setCurrentPage(1);
              }}
              className="h-9 text-xs text-muted-foreground hover:text-foreground"
            >
              Reset Filters
            </Button>
          )}
        </div>

        {/* Action Button: Record Payment */}
        {canRecord && (
          <Link
            href="/dashboard/payments/new"
            className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5 shrink-0')}
          >
            <Plus className="h-4 w-4" />
            <span>Record Payment</span>
          </Link>
        )}
      </div>

      {/* Ledger Table */}
      <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border/70 font-semibold">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Payment Date</th>
                <th className="py-3 px-4">Recorded By</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Receipt className="h-8 w-8 text-muted-foreground/50 stroke-[1.5]" />
                      <p className="font-medium text-foreground">No payment records found</p>
                      <p className="text-xs max-w-sm">
                        {searchQuery || methodFilter !== 'ALL' || clientFilter !== 'ALL' || dateRangeFilter !== 'ALL'
                          ? 'Try clearing your search query or filter selections.'
                          : 'Record your first received payment against an outstanding invoice.'}
                      </p>
                      {canRecord && !searchQuery && methodFilter === 'ALL' && (
                        <Link
                          href="/dashboard/payments/new"
                          className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'mt-2 gap-1.5')}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Record First Payment</span>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((payment) => {
                  const methodConfig = PAYMENT_METHOD_CONFIG[payment.paymentMethod] || PAYMENT_METHOD_CONFIG.OTHER;
                  const formattedDate = new Date(payment.paymentDate).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={payment.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Receipt # */}
                      <td className="py-3 px-4">
                        <Link
                          href={`/dashboard/payments/${payment.id}/receipt`}
                          className="font-mono font-bold text-primary hover:underline flex items-center gap-1.5"
                        >
                          <span>{payment.receiptNumber}</span>
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </td>

                      {/* Invoice # */}
                      <td className="py-3 px-4">
                        {payment.invoice ? (
                          <Link
                            href={`/dashboard/invoices/${payment.invoiceId}`}
                            className="font-mono font-medium text-foreground/80 hover:text-foreground hover:underline"
                          >
                            {payment.invoice.invoiceNumber}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground font-mono">—</span>
                        )}
                      </td>

                      {/* Client */}
                      <td className="py-3 px-4">
                        {payment.client ? (
                          <Link
                            href={`/dashboard/clients/${payment.clientId}`}
                            className="font-medium text-foreground hover:text-primary transition-colors"
                          >
                            {payment.client.companyName}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right font-bold text-foreground tabular-nums">
                        {formatINR(payment.amount)}
                      </td>

                      {/* Method Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border',
                            methodConfig.badgeBg,
                            methodConfig.badgeText,
                            methodConfig.badgeBorder
                          )}
                        >
                          {methodConfig.label}
                        </span>
                        {payment.referenceNumber && (
                          <span className="block text-[10px] text-muted-foreground truncate max-w-[120px] font-mono mt-0.5">
                            Ref: {payment.referenceNumber}
                          </span>
                        )}
                      </td>

                      {/* Payment Date */}
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        {formattedDate}
                      </td>

                      {/* Recorded By */}
                      <td className="py-3 px-4 text-muted-foreground">
                        {payment.recordedBy?.name || 'System'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Receipt */}
                          <Link
                            href={`/dashboard/payments/${payment.id}/receipt`}
                            className={cn(
                              buttonVariants({ variant: 'ghost', size: 'sm' }),
                              'h-7 w-7 p-0 text-muted-foreground hover:text-foreground'
                            )}
                            title="View / Print Receipt"
                          >
                            <Receipt className="h-3.5 w-3.5" />
                          </Link>

                          {/* Edit (Admin/Manager only) */}
                          {canManage && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingPayment(payment)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              title="Edit Payment"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          {/* Delete (Admin/Manager only) */}
                          {canManage && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingPayment(payment)}
                              className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              title="Delete Payment"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredPayments.length > pageSize && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/70 text-xs text-muted-foreground">
            <div>
              Showing <span className="font-semibold text-foreground">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-foreground">
                {Math.min(currentPage * pageSize, filteredPayments.length)}
              </span>{' '}
              of <span className="font-semibold text-foreground">{filteredPayments.length}</span> payments
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs px-2">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Payment Modal */}
      {editingPayment && (
        <EditPaymentModal
          payment={editingPayment}
          open={!!editingPayment}
          onClose={() => setEditingPayment(null)}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      )}

      {/* Delete Payment Modal */}
      {deletingPayment && (
        <DeletePaymentModal
          payment={deletingPayment}
          open={!!deletingPayment}
          onClose={() => setDeletingPayment(null)}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
