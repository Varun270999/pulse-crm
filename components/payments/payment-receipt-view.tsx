'use client';

import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { formatINR, cn } from '@/lib/utils';
import { PAYMENT_METHOD_CONFIG, type PaymentData } from '@/types/payment';
import {
  Printer,
  ArrowLeft,
  Activity,
  FileText,
  CheckCircle,
} from 'lucide-react';

interface PaymentReceiptViewProps {
  payment: PaymentData;
  previouslyPaid: number;
  remainingBalance: number;
}

export function PaymentReceiptView({
  payment,
  previouslyPaid,
  remainingBalance,
}: PaymentReceiptViewProps) {
  const methodConfig =
    PAYMENT_METHOD_CONFIG[payment.paymentMethod] || PAYMENT_METHOD_CONFIG.OTHER;

  const formattedPaymentDate = new Date(payment.paymentDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const formattedInvoiceDate = payment.invoice?.issueDate
    ? new Date(payment.invoice.issueDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Action Toolbar (hidden during print) */}
      <div className="flex items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/payments"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'gap-1.5 text-xs'
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Payments</span>
          </Link>
          {payment.invoice && (
            <Link
              href={`/dashboard/invoices/${payment.invoiceId}`}
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                'gap-1.5 text-xs text-muted-foreground'
              )}
            >
              <FileText className="h-4 w-4" />
              <span>View Invoice ({payment.invoice.invoiceNumber})</span>
            </Link>
          )}
        </div>

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

      {/* Main Printable Receipt Card */}
      <div className="bg-card text-card-foreground border border-border/80 rounded-2xl p-8 sm:p-12 shadow-sm print:border-none print:shadow-none print:p-0">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-border/70 pb-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                <Activity className="h-5 w-5" />
              </div>
              <span className="text-2xl font-black tracking-tight text-foreground">
                Pulse CRM
              </span>
            </div>
            <div className="mt-3 text-xs text-muted-foreground space-y-0.5 leading-relaxed">
              <p className="font-semibold text-foreground">Pulse CRM Technologies Pvt Ltd</p>
              <p>Tower B, Cyber City, DLF Phase 2</p>
              <p>Gurugram, Haryana 122002, India</p>
              <p>Email: billing@pulsecrm.in | Phone: +91 124 456 7890</p>
              <p className="font-mono text-[11px] pt-1">GSTIN: 06AAACP1234F1Z8</p>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-2">
            <div className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              Payment Receipt
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Receipt Number:</div>
              <div className="text-xl font-mono font-black text-foreground">
                {payment.receiptNumber}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Date: <span className="font-medium text-foreground">{formattedPaymentDate}</span>
            </div>
          </div>
        </div>

        {/* Client & Payment Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-border/70 text-xs">
          {/* Received From */}
          <div className="space-y-1.5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Received From:
            </h3>
            <p className="text-base font-bold text-foreground">
              {payment.client?.companyName || 'Client Account'}
            </p>
            {payment.client?.addressLine && <p className="text-muted-foreground">{payment.client.addressLine}</p>}
            {(payment.client?.city || payment.client?.state || payment.client?.postalCode) && (
              <p className="text-muted-foreground">
                {[payment.client.city, payment.client.state, payment.client.postalCode]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            )}
            {payment.client?.email && (
              <p className="text-muted-foreground">Email: {payment.client.email}</p>
            )}
            {payment.client?.phone && (
              <p className="text-muted-foreground">Phone: {payment.client.phone}</p>
            )}
          </div>

          {/* Payment Method Details */}
          <div className="sm:text-right space-y-1.5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Payment Details:
            </h3>
            <div>
              <span className="text-muted-foreground">Payment Method: </span>
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border',
                  methodConfig.badgeBg,
                  methodConfig.badgeText,
                  methodConfig.badgeBorder
                )}
              >
                {methodConfig.label}
              </span>
            </div>
            {payment.referenceNumber && (
              <p className="text-muted-foreground">
                Transaction / Ref #: <span className="font-mono font-medium text-foreground">{payment.referenceNumber}</span>
              </p>
            )}
            <p className="text-muted-foreground">
              Processed by: <span className="font-medium text-foreground">{payment.recordedBy?.name || 'Pulse Accounts'}</span>
            </p>
          </div>
        </div>

        {/* Payment Allocation Table */}
        <div className="py-6 border-b border-border/70">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/70">
              <tr>
                <th className="py-2.5 px-3">Description / Allocation</th>
                <th className="py-2.5 px-3">Invoice Details</th>
                <th className="py-2.5 px-3 text-right">Invoice Total</th>
                <th className="py-2.5 px-3 text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr>
                <td className="py-3 px-3 font-medium text-foreground">
                  Payment against Invoice {payment.invoice?.invoiceNumber}
                </td>
                <td className="py-3 px-3 text-muted-foreground">
                  Dated: {formattedInvoiceDate}
                </td>
                <td className="py-3 px-3 text-right tabular-nums text-muted-foreground font-medium">
                  {payment.invoice ? formatINR(payment.invoice.totalAmount) : '—'}
                </td>
                <td className="py-3 px-3 text-right tabular-nums font-bold text-emerald-600 text-sm">
                  {formatINR(payment.amount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Financial Accounting Breakdown */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 py-6 border-b border-border/70 text-xs">
          <div className="space-y-2 max-w-sm">
            {payment.notes && (
              <div>
                <span className="font-semibold text-foreground block mb-0.5">Remarks / Notes:</span>
                <p className="text-muted-foreground whitespace-pre-wrap">{payment.notes}</p>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px] pt-1 font-medium">
              <CheckCircle className="h-4 w-4" />
              <span>Official payment receipt verified and recorded in Pulse CRM ledger.</span>
            </div>
          </div>

          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Invoice Total:</span>
              <span className="font-medium text-foreground tabular-nums">
                {payment.invoice ? formatINR(payment.invoice.totalAmount) : '—'}
              </span>
            </div>

            <div className="flex justify-between text-muted-foreground">
              <span>Previously Paid:</span>
              <span className="font-medium text-foreground tabular-nums">
                {formatINR(previouslyPaid)}
              </span>
            </div>

            <div className="flex justify-between font-bold text-foreground pt-2 border-t border-border/70 text-sm">
              <span>Amount Paid This Receipt:</span>
              <span className="text-emerald-600 tabular-nums text-base">
                {formatINR(payment.amount)}
              </span>
            </div>

            <div className="flex justify-between font-bold pt-1 border-t border-border/60 text-foreground">
              <span>Remaining Balance Due:</span>
              <span className={cn('tabular-nums', remainingBalance > 0 ? 'text-amber-600' : 'text-emerald-600')}>
                {formatINR(remainingBalance)}
              </span>
            </div>
          </div>
        </div>

        {/* Signatory Footer */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs text-muted-foreground">
          <div className="text-[11px] space-y-1">
            <p className="font-medium text-foreground">Important Note:</p>
            <p>This is a computer-generated receipt issued by Pulse CRM. No physical signature is required.</p>
            <p>For any billing inquiries, please contact billing@pulsecrm.in.</p>
          </div>

          <div className="text-center sm:text-right w-48 space-y-1 sm:self-end">
            <div className="h-12 border-b border-dashed border-border/80 flex items-end justify-center sm:justify-end pb-1">
              <span className="font-mono text-[10px] text-muted-foreground/60">[Pulse CRM Authorized]</span>
            </div>
            <p className="font-semibold text-foreground pt-1">Authorized Signatory</p>
            <p className="text-[11px] text-muted-foreground">Pulse CRM Technologies</p>
          </div>
        </div>
      </div>
    </div>
  );
}
