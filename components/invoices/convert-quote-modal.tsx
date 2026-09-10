'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { formatINR } from '@/lib/utils';
import { convertQuotationToInvoiceAction } from '@/app/actions/billing';
import type { QuotationData } from '@/types/billing';
import { Loader2, ArrowRightLeft, AlertCircle } from 'lucide-react';

interface ConvertQuoteModalProps {
  quotation: QuotationData | null;
  open: boolean;
  onClose: () => void;
}

export function ConvertQuoteModal({
  quotation,
  open,
  onClose,
}: ConvertQuoteModalProps) {
  const router = useRouter();

  const defaultDueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!quotation) return null;

  async function handleConvert() {
    if (!quotation) return;
    setLoading(true);
    setError(null);

    try {
      const res = await convertQuotationToInvoiceAction(quotation.id, dueDate);
      if (res.error) {
        setError(res.error);
        setLoading(false);
      } else if (res.invoiceId) {
        setLoading(false);
        onClose();
        router.push(`/dashboard/invoices/${res.invoiceId}`);
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to convert quotation.';
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <div className="space-y-4">
        <DialogHeader>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-950/50">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <DialogTitle>Convert Quotation to Invoice</DialogTitle>
          </div>
          <DialogDescription>
            Convert <span className="font-semibold text-foreground">{quotation.quotationNumber}</span> ({quotation.client.companyName}) into an active billing invoice.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-muted/40 p-3 rounded-lg border border-border/70 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Quoted Total:</span>
            <span className="font-semibold text-foreground">{formatINR(quotation.totalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Line Items:</span>
            <span className="font-medium text-foreground">{quotation.items.length} items</span>
          </div>
          <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/50">
            Converting will automatically set the quotation status to <strong className="text-emerald-600">ACCEPTED</strong> and generate a new sequential invoice.
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="due-date" className="text-xs font-semibold">
            Invoice Due Date <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={loading}
            className="h-9 text-xs"
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
            onClick={handleConvert}
            disabled={loading || !dueDate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Converting...
              </>
            ) : (
              'Confirm & Generate Invoice'
            )}
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
