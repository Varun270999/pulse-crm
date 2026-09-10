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
import { formatINR } from '@/lib/utils';
import { deletePaymentAction } from '@/app/actions/payments';
import type { PaymentData } from '@/types/payment';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';

interface DeletePaymentModalProps {
  payment: PaymentData | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeletePaymentModal({
  payment,
  open,
  onClose,
  onSuccess,
}: DeletePaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!payment) return null;

  async function handleDelete() {
    if (!payment) return;
    setLoading(true);
    setError(null);

    try {
      const res = await deletePaymentAction({ id: payment.id });
      if (res.error) {
        setError(res.error);
        setLoading(false);
      } else {
        setLoading(false);
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete payment.';
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <div className="space-y-4">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-600">
            <div className="p-2 rounded-full bg-rose-100 dark:bg-rose-950/50">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogTitle>Delete Payment Receipt</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete receipt{' '}
            <span className="font-mono font-bold text-foreground">
              {payment.receiptNumber}
            </span>
            ? This will increase the invoice balance due by{' '}
            <span className="font-bold text-foreground">
              {formatINR(payment.amount)}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-md flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 rounded-lg border border-border/70 bg-muted/30 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Receipt Number:</span>
            <span className="font-mono font-medium text-foreground">{payment.receiptNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Client:</span>
            <span className="font-medium text-foreground">{payment.client?.companyName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Invoice Number:</span>
            <span className="font-mono font-medium text-foreground">{payment.invoice?.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-bold text-rose-600">{formatINR(payment.amount)}</span>
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="gap-1.5"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Confirm Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
