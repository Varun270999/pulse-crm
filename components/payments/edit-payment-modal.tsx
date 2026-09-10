'use client';

import { useState, useEffect } from 'react';
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
import { updatePaymentAction } from '@/app/actions/payments';
import {
  paymentMethods,
  PAYMENT_METHOD_CONFIG,
  type PaymentData,
  type PaymentMethodType,
} from '@/types/payment';
import { Loader2, Edit, AlertCircle } from 'lucide-react';

interface EditPaymentModalProps {
  payment: PaymentData | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditPaymentModal({
  payment,
  open,
  onClose,
  onSuccess,
}: EditPaymentModalProps) {
  if (!payment) return null;

  return (
    <EditPaymentModalInner
      payment={payment}
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

function EditPaymentModalInner({
  payment,
  open,
  onClose,
  onSuccess,
}: {
  payment: PaymentData;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [amount, setAmount] = useState(payment.amount.toString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>(payment.paymentMethod);
  const [paymentDate, setPaymentDate] = useState(
    payment.paymentDate ? payment.paymentDate.split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [referenceNumber, setReferenceNumber] = useState(payment.referenceNumber || '');
  const [notes, setNotes] = useState(payment.notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAmount(payment.amount.toString());
    setPaymentMethod(payment.paymentMethod);
    setPaymentDate(
      payment.paymentDate ? payment.paymentDate.split('T')[0] : new Date().toISOString().split('T')[0]
    );
    setReferenceNumber(payment.referenceNumber || '');
    setNotes(payment.notes || '');
    setError(null);
  }, [payment]);

  async function handleSave() {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid payment amount greater than 0.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await updatePaymentAction({
        id: payment.id,
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
      const msg = err instanceof Error ? err.message : 'Failed to update payment.';
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <div className="space-y-4">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <div className="p-2 rounded-full bg-primary/10">
              <Edit className="h-5 w-5" />
            </div>
            <DialogTitle>Edit Payment ({payment.receiptNumber})</DialogTitle>
          </div>
          <DialogDescription>
            Correct receipt details for invoice <span className="font-semibold text-foreground">{payment.invoice?.invoiceNumber}</span>.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-amount" className="text-xs font-semibold">
              Amount (INR ₹) <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="edit-amount"
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
            <Label htmlFor="edit-method" className="text-xs font-semibold">
              Payment Method <span className="text-rose-500">*</span>
            </Label>
            <select
              id="edit-method"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-date" className="text-xs font-semibold">
              Payment Date <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="edit-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              disabled={loading}
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-ref" className="text-xs font-semibold">
              Reference Number / Txn ID
            </Label>
            <Input
              id="edit-ref"
              type="text"
              placeholder="e.g. UPI/123456, NEFT-889"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              disabled={loading}
              className="h-9 text-sm"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-notes" className="text-xs font-semibold">
            Notes / Remarks
          </Label>
          <Textarea
            id="edit-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
            placeholder="Add any internal transaction notes..."
            className="text-xs"
          />
        </div>

        <DialogFooter className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading || !amount || parseFloat(amount) <= 0}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
