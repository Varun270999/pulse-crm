'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatINR } from '@/lib/utils';
import { recordPaymentAction } from '@/app/actions/payments';
import {
  paymentMethods,
  PAYMENT_METHOD_CONFIG,
  type PaymentMethodType,
} from '@/types/payment';
import type { InvoiceData } from '@/types/billing';
import { Loader2, CreditCard, AlertCircle } from 'lucide-react';

interface RecordPaymentModalProps {
  invoice: InvoiceData | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RecordPaymentModal({
  invoice,
  open,
  onClose,
  onSuccess,
}: RecordPaymentModalProps) {
  if (!invoice) return null;

  const remainingBalance = Math.max(0, invoice.totalAmount - invoice.paidAmount);

  return (
    <RecordPaymentModalInner
      invoice={invoice}
      remainingBalance={remainingBalance}
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

function RecordPaymentModalInner({
  invoice,
  remainingBalance,
  open,
  onClose,
  onSuccess,
}: {
  invoice: InvoiceData;
  remainingBalance: number;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [amount, setAmount] = useState(remainingBalance.toString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('UPI');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid payment amount greater than 0.');
      return;
    }

    if (numAmount > remainingBalance) {
      setError(`Amount exceeds remaining balance of ₹${remainingBalance.toLocaleString('en-IN')}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await recordPaymentAction({
        invoiceId: invoice.id,
        amount: numAmount,
        paymentMethod,
        paymentDate,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (res.error) {
        setError(res.error);
        setLoading(false);
      } else {
        setLoading(false);
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record payment.';
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <div className="space-y-4">
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-950/50">
              <CreditCard className="h-5 w-5" />
            </div>
            <DialogTitle>Record Payment</DialogTitle>
          </div>
          <DialogDescription>
            Record receipt of payment for{' '}
            <span className="font-semibold text-foreground">{invoice.invoiceNumber}</span> (
            {invoice.client.companyName}).
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Balance Breakdown */}
        <div className="grid grid-cols-3 gap-2 bg-muted/40 p-3 rounded-lg border border-border/70 text-xs">
          <div>
            <div className="text-muted-foreground">Invoice Total</div>
            <div className="font-semibold text-foreground mt-0.5">
              {formatINR(invoice.totalAmount)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Already Paid</div>
            <div className="font-semibold text-emerald-600 mt-0.5">
              {formatINR(invoice.paidAmount)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Balance Due</div>
            <div className="font-bold text-amber-600 mt-0.5">
              {formatINR(remainingBalance)}
            </div>
          </div>
        </div>

        {/* Payment Amount & Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="payment-amount" className="text-xs font-semibold">
              Payment Amount (INR ₹) <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="payment-amount"
              type="number"
              step="any"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (error) setError(null);
              }}
              disabled={loading}
              className="h-9 text-sm font-semibold"
            />
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
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payment-ref" className="text-xs font-semibold">
              Reference / Txn ID
            </Label>
            <Input
              id="payment-ref"
              type="text"
              placeholder="e.g. UPI/123456, NEFT-889"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              disabled={loading}
              className="h-9 text-sm"
            />
          </div>
        </div>

        {/* Payment Reference / Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="payment-notes" className="text-xs font-semibold">
            Transaction Notes
          </Label>
          <Textarea
            id="payment-notes"
            rows={2}
            placeholder="e.g. Bank NEFT ref #AXIS982314, Cheque #004521..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
            className="text-xs"
          />
        </div>

        <DialogFooter className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={loading || !amount || parseFloat(amount) <= 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recording...
              </>
            ) : (
              'Confirm Payment'
            )}
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
