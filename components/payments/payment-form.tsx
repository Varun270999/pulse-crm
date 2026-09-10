'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { formatINR, cn } from '@/lib/utils';
import { recordPaymentAction } from '@/app/actions/payments';
import {
  paymentMethods,
  PAYMENT_METHOD_CONFIG,
  type PaymentMethodType,
} from '@/types/payment';
import {
  CreditCard,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export interface OutstandingInvoiceOption {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: string;
  client: {
    id: string;
    companyName: string;
  };
}

interface PaymentFormProps {
  invoices: OutstandingInvoiceOption[];
  preselectedInvoiceId?: string;
}

export function PaymentForm({
  invoices,
  preselectedInvoiceId,
}: PaymentFormProps) {
  const router = useRouter();

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(
    preselectedInvoiceId || (invoices.length > 0 ? invoices[0].id : '')
  );

  const selectedInvoice = invoices.find((inv) => inv.id === selectedInvoiceId);

  const [amount, setAmount] = useState<string>(
    selectedInvoice ? selectedInvoice.balanceDue.toString() : ''
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('UPI');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  function handleInvoiceChange(invoiceId: string) {
    setSelectedInvoiceId(invoiceId);
    const target = invoices.find((i) => i.id === invoiceId);
    if (target) {
      setAmount(target.balanceDue.toString());
    } else {
      setAmount('');
    }
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedInvoiceId) {
      setError('Please select an invoice.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Payment amount must be greater than 0.');
      return;
    }

    if (selectedInvoice && numAmount > selectedInvoice.balanceDue) {
      setError(
        `Amount exceeds remaining balance of ₹${selectedInvoice.balanceDue.toLocaleString('en-IN')}`
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await recordPaymentAction({
        invoiceId: selectedInvoiceId,
        amount: numAmount,
        paymentMethod,
        paymentDate,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (res.error) {
        setError(res.error);
        setLoading(false);
      } else if (res.paymentId) {
        router.push(`/dashboard/payments/${res.paymentId}/receipt`);
      } else {
        router.push('/dashboard/payments');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record payment.';
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      {/* Top Header & Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/payments"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1.5 text-xs')}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Payments</span>
        </Link>
        <span className="text-xs text-muted-foreground">Pulse CRM Ledger</span>
      </div>

      <div className="bg-card border border-border/70 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <CreditCard className="h-5 w-5" />
            </div>
            Record Received Payment
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Issue a payment receipt and atomically update the invoice status and balance.
          </p>
        </div>

        {error && (
          <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Invoice Selection */}
        <div className="space-y-2">
          <Label htmlFor="invoice-select" className="text-xs font-semibold">
            Select Outstanding Invoice <span className="text-rose-500">*</span>
          </Label>
          {invoices.length === 0 ? (
            <div className="p-4 rounded-lg bg-muted/40 border border-border/70 text-xs text-muted-foreground">
              No outstanding invoices found. All invoices have been paid in full!
            </div>
          ) : (
            <select
              id="invoice-select"
              value={selectedInvoiceId}
              onChange={(e) => handleInvoiceChange(e.target.value)}
              disabled={loading}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} — {inv.client.companyName} (Balance: {formatINR(inv.balanceDue)})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Selected Invoice Context Card */}
        {selectedInvoice && (
          <Card className="bg-muted/30 border-border/70 shadow-none">
            <CardContent className="p-4">
              <div className="text-xs font-semibold text-muted-foreground mb-3 flex items-center justify-between">
                <span>Invoice Breakdown</span>
                <span className="font-mono text-primary font-bold">{selectedInvoice.invoiceNumber}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Client</span>
                  <span className="font-semibold text-foreground truncate block">
                    {selectedInvoice.client.companyName}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Total Value</span>
                  <span className="font-semibold text-foreground">
                    {formatINR(selectedInvoice.totalAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Already Paid</span>
                  <span className="font-semibold text-emerald-600">
                    {formatINR(selectedInvoice.paidAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Balance Due</span>
                  <span className="font-bold text-amber-600">
                    {formatINR(selectedInvoice.balanceDue)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Amount & Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="payment-amount" className="text-xs font-semibold">
              Payment Amount (INR ₹) <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="payment-amount"
              type="number"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (error) setError(null);
              }}
              disabled={loading || !selectedInvoice}
              className="h-10 text-sm font-semibold"
            />
            {selectedInvoice && (
              <p className="text-[11px] text-muted-foreground">
                Max allowed:{' '}
                <button
                  type="button"
                  onClick={() => setAmount(selectedInvoice.balanceDue.toString())}
                  className="font-semibold text-primary underline ml-0.5"
                >
                  {formatINR(selectedInvoice.balanceDue)}
                </button>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payment-method" className="text-xs font-semibold">
              Payment Method <span className="text-rose-500">*</span>
            </Label>
            <select
              id="payment-method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
              disabled={loading}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {paymentMethods.map((pm) => (
                <option key={pm} value={pm}>
                  {PAYMENT_METHOD_CONFIG[pm].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Payment Date & Reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="payment-date" className="text-xs font-semibold">
              Payment Date <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="payment-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              disabled={loading}
              className="h-10 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payment-ref" className="text-xs font-semibold">
              Reference / Txn ID
            </Label>
            <Input
              id="payment-ref"
              type="text"
              placeholder="e.g. UPI/2026/9821, Cheque #4012"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              disabled={loading}
              className="h-10 text-sm"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="payment-notes" className="text-xs font-semibold">
            Internal Notes / Remarks
          </Label>
          <Textarea
            id="payment-notes"
            rows={3}
            placeholder="Add any internal transaction or reconciliation notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
            className="text-xs"
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/70">
          <Link
            href="/dashboard/payments"
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            Cancel
          </Link>
          <Button
            type="submit"
            disabled={
              loading ||
              !selectedInvoiceId ||
              !amount ||
              parseFloat(amount) <= 0 ||
              (selectedInvoice && parseFloat(amount) > selectedInvoice.balanceDue)
            }
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Recording Payment...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirm & Issue Receipt</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
