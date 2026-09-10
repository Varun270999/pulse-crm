'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { RecordPaymentModal } from '@/components/invoices/record-payment-modal';
import { ConvertQuoteModal } from '@/components/invoices/convert-quote-modal';
import { DeletePaymentModal } from '@/components/payments/delete-payment-modal';
import { formatINR, cn } from '@/lib/utils';
import {
  INVOICE_STATUS_CONFIG,
  QUOTATION_STATUS_CONFIG,
  type InvoiceData,
  type QuotationData,
} from '@/types/billing';
import {
  PAYMENT_METHOD_CONFIG,
  type PaymentData,
} from '@/types/payment';
import type { UserRole } from '@/lib/auth/rbac';
import {
  Printer,
  ArrowLeft,
  CreditCard,
  ArrowRightLeft,
  Activity,
  Trash2,
} from 'lucide-react';

interface PrintableDocumentViewProps {
  type: 'invoice' | 'quotation';
  document: InvoiceData | QuotationData;
  userRole?: UserRole;
}

export function PrintableDocumentView({
  type,
  document,
  userRole,
}: PrintableDocumentViewProps) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState<PaymentData | null>(null);

  const isInvoice = type === 'invoice';
  const invoice = isInvoice ? (document as InvoiceData) : null;
  const quotation = !isInvoice ? (document as QuotationData) : null;

  const canManage = userRole === 'ADMIN' || userRole === 'MANAGER';
  const percentPaid = invoice
    ? Math.min(100, Math.round((invoice.paidAmount / (invoice.totalAmount || 1)) * 100))
    : 0;

  const statusConfig = isInvoice
    ? INVOICE_STATUS_CONFIG[invoice!.status]
    : QUOTATION_STATUS_CONFIG[quotation!.status];

  const remainingBalance = invoice
    ? Math.max(0, invoice.totalAmount - invoice.paidAmount)
    : 0;

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Action Toolbar (Hidden during browser print) */}
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link
          href={isInvoice ? '/dashboard/invoices' : '/dashboard/invoices?tab=quotations'}
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'gap-1.5 text-xs'
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to {isInvoice ? 'Invoices' : 'Quotations'}</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Action for Quotation: Convert to Invoice */}
          {quotation && quotation.status !== 'ACCEPTED' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsConvertModalOpen(true)}
              className="gap-1.5 text-xs text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50"
            >
              <ArrowRightLeft className="h-4 w-4" />
              <span>Convert to Invoice</span>
            </Button>
          )}

          {/* Action for Invoice: Record Payment */}
          {invoice && invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPaymentModalOpen(true)}
              className="gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50"
            >
              <CreditCard className="h-4 w-4" />
              <span>Record Payment</span>
            </Button>
          )}

          {/* Print Button */}
          <Button
            type="button"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 text-xs shadow-xs"
          >
            <Printer className="h-4 w-4" />
            <span>Print / Save PDF</span>
          </Button>
        </div>
      </div>

      {/* Main Printable Document Card */}
      <div className="bg-card text-card-foreground border border-border/80 rounded-2xl p-8 sm:p-12 shadow-sm print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-border/70 pb-8">
          {/* Company Brand & Info */}
          <div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                <Activity className="h-5 w-5" />
              </div>
              <span className="text-2xl font-black tracking-tight text-foreground">
                Pulse CRM
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Pulse Technologies India Pvt. Ltd.<br />
              Tower B, Tech Park, Outer Ring Road<br />
              Bengaluru, Karnataka 560103, India<br />
              billing@pulsecrm.local | +91 (80) 4123-4567
            </p>
          </div>

          {/* Document Title & Number */}
          <div className="sm:text-right">
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-foreground">
              {isInvoice ? 'INVOICE' : 'QUOTATION'}
            </h1>
            <p className="text-sm font-semibold text-primary mt-1 font-mono">
              {isInvoice ? invoice!.invoiceNumber : quotation!.quotationNumber}
            </p>
            <div className="mt-2.5">
              <span
                className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                  statusConfig.badgeBg,
                  statusConfig.badgeText,
                  statusConfig.badgeBorder
                )}
              >
                {statusConfig.label}
              </span>
            </div>
          </div>
        </div>

        {/* Client & Date Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-border/70">
          {/* Billed To / Quoted To */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {isInvoice ? 'Billed To' : 'Quoted To'}
            </span>
            <h3 className="text-base font-bold text-foreground mt-1">
              {document.client.companyName}
            </h3>
            <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
              {document.client.addressLine && <p>{document.client.addressLine}</p>}
              {(document.client.city || document.client.state) && (
                <p>
                  {[document.client.city, document.client.state, document.client.postalCode]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
              {document.client.email && <p>Email: {document.client.email}</p>}
              {document.client.phone && <p>Phone: {document.client.phone}</p>}
            </div>
          </div>

          {/* Invoice / Quotation Dates */}
          <div className="sm:text-right text-xs space-y-2">
            <div>
              <span className="text-muted-foreground">Date of Issue: </span>
              <span className="font-semibold text-foreground">
                {new Date(document.issueDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>

            {isInvoice && (
              <div>
                <span className="text-muted-foreground">Payment Due Date: </span>
                <span className="font-semibold text-foreground">
                  {new Date(invoice!.dueDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}

            {!isInvoice && quotation!.validUntil && (
              <div>
                <span className="text-muted-foreground">Offer Valid Until: </span>
                <span className="font-semibold text-foreground">
                  {new Date(quotation!.validUntil).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}

            {document.deal && (
              <div>
                <span className="text-muted-foreground">Associated Deal: </span>
                <span className="font-medium text-foreground">{document.deal.title}</span>
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-6">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border/80 text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
              <tr>
                <th className="py-2.5 px-2">#</th>
                <th className="py-2.5 px-2 w-1/2">Description</th>
                <th className="py-2.5 px-2 text-right">Qty</th>
                <th className="py-2.5 px-2 text-right">Unit Price</th>
                <th className="py-2.5 px-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {document.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-muted/10">
                  <td className="py-3 px-2 text-muted-foreground">{idx + 1}</td>
                  <td className="py-3 px-2 font-medium text-foreground">
                    {item.description}
                  </td>
                  <td className="py-3 px-2 text-right tabular-nums">{item.quantity}</td>
                  <td className="py-3 px-2 text-right tabular-nums">{formatINR(item.unitPrice)}</td>
                  <td className="py-3 px-2 text-right font-semibold text-foreground tabular-nums">
                    {formatINR(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Breakdown Summary */}
        <div className="flex flex-col sm:flex-row justify-end border-t border-border/70 pt-4">
          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal:</span>
              <span className="font-medium text-foreground tabular-nums">
                {formatINR(document.subtotal)}
              </span>
            </div>

            {document.discountPercent > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Discount ({document.discountPercent}%):</span>
                <span className="text-rose-600 tabular-nums">
                  -{formatINR(document.discountAmount)}
                </span>
              </div>
            )}

            {document.taxPercent > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Tax / GST ({document.taxPercent}%):</span>
                <span className="font-medium text-foreground tabular-nums">
                  +{formatINR(document.taxAmount)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm font-bold pt-2 border-t border-border text-foreground">
              <span>Grand Total:</span>
              <span className="text-primary tabular-nums text-base">
                {formatINR(document.totalAmount)}
              </span>
            </div>

            {isInvoice && (
              <>
                <div className="flex justify-between text-muted-foreground pt-1">
                  <span>Amount Paid:</span>
                  <span className="text-emerald-600 font-semibold tabular-nums">
                    {formatINR(invoice!.paidAmount)}
                  </span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-border/60 text-foreground">
                  <span>Balance Due:</span>
                  <span className={cn('tabular-nums', remainingBalance > 0 ? 'text-amber-600' : 'text-emerald-600')}>
                    {formatINR(remainingBalance)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Notes & Terms and Conditions */}
        <div className="mt-8 pt-6 border-t border-border/70 space-y-4 text-xs">
          {document.notes && (
            <div>
              <h4 className="font-semibold text-foreground mb-1">Notes:</h4>
              <p className="text-muted-foreground whitespace-pre-wrap">{document.notes}</p>
            </div>
          )}

          {document.termsAndConditions && (
            <div>
              <h4 className="font-semibold text-foreground mb-1">Terms & Conditions:</h4>
              <pre className="text-muted-foreground font-sans text-[11px] whitespace-pre-wrap leading-relaxed">
                {document.termsAndConditions}
              </pre>
            </div>
          )}
        </div>
        {/* Payment History & Progress (Invoice Only) */}
        {isInvoice && (
          <div className="mt-8 pt-6 border-t border-border/70 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  <span>Payment History</span>
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Transactions and receipts recorded against this invoice
                </p>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-3 w-full sm:w-64">
                <div className="flex-1 bg-muted/60 rounded-full h-2.5 overflow-hidden border border-border/60">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      percentPaid >= 100 ? 'bg-emerald-600' : 'bg-emerald-500'
                    )}
                    style={{ width: `${percentPaid}%` }}
                  />
                </div>
                <span className="text-xs font-semibold tabular-nums text-foreground shrink-0">
                  {percentPaid}% paid
                </span>
              </div>
            </div>

            {/* Payments List Table */}
            {invoice?.payments && invoice.payments.length > 0 ? (
              <div className="rounded-xl border border-border/70 overflow-hidden bg-background">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/70">
                    <tr>
                      <th className="py-2.5 px-3">Receipt #</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Reference #</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3">Recorded By</th>
                      <th className="py-2.5 px-3 text-right print:hidden">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {invoice.payments.map((p) => {
                      const pmConfig =
                        PAYMENT_METHOD_CONFIG[p.paymentMethod] || PAYMENT_METHOD_CONFIG.OTHER;
                      const dateStr = new Date(p.paymentDate).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      });
                      return (
                        <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-primary">
                            <Link
                              href={`/dashboard/payments/${p.id}/receipt`}
                              className="hover:underline"
                            >
                              {p.receiptNumber}
                            </Link>
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                            {dateStr}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={cn(
                                'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border',
                                pmConfig.badgeBg,
                                pmConfig.badgeText,
                                pmConfig.badgeBorder
                              )}
                            >
                              {pmConfig.label}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-muted-foreground">
                            {p.referenceNumber || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold tabular-nums text-emerald-600">
                            {formatINR(p.amount)}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground">
                            {p.recordedBy?.name || 'System'}
                          </td>
                          <td className="py-2.5 px-3 text-right print:hidden">
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                href={`/dashboard/payments/${p.id}/receipt`}
                                className={cn(
                                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                                  'h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground'
                                )}
                              >
                                View Receipt
                              </Link>
                              {canManage && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeletingPayment(p)}
                                  className="h-6 w-6 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                  title="Delete Payment"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/80 p-5 text-center bg-muted/20">
                <p className="text-xs font-medium text-muted-foreground">
                  No payments recorded yet against this invoice.
                </p>
                {invoice && invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="mt-2 text-xs gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50 print:hidden"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>Record First Payment</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {invoice && (
        <RecordPaymentModal
          invoice={invoice}
          open={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onSuccess={() => window.location.reload()}
        />
      )}

      {/* Delete Payment Modal */}
      {deletingPayment && (
        <DeletePaymentModal
          payment={deletingPayment}
          open={!!deletingPayment}
          onClose={() => setDeletingPayment(null)}
          onSuccess={() => window.location.reload()}
        />
      )}

      {/* Convert Quotation Modal */}
      {quotation && (
        <ConvertQuoteModal
          quotation={quotation}
          open={isConvertModalOpen}
          onClose={() => setIsConvertModalOpen(false)}
        />
      )}
    </div>
  );
}
