'use client';

import { useState } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface LeadLostModalProps {
  open: boolean;
  leadName?: string;
  isSubmitting?: boolean;
  onConfirm: (lostReason: string) => Promise<void>;
  onCancel: () => void;
}

export function LeadLostModal({
  open,
  leadName,
  isSubmitting = false,
  onConfirm,
  onCancel,
}: LeadLostModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason why this opportunity was lost.');
      return;
    }
    setError(null);
    await onConfirm(reason.trim());
    setReason('');
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setError(null);
    setReason('');
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-rose-600 mb-1">
            <div className="rounded-full bg-rose-100 p-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle>Mark Lead as Lost</DialogTitle>
          </div>
          <DialogDescription>
            {leadName ? (
              <>
                You are marking <span className="font-semibold text-gray-900">{leadName}</span> as Lost.
              </>
            ) : (
              'Record the reason why this lead did not close.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="lostReason">
              Reason for Loss <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="lostReason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Chose competitor due to lower pricing; Project postponed to next fiscal year; Unresponsive after proposal..."
              rows={3}
              className="resize-none"
              autoFocus
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500">
              Capturing lost reasons helps your sales management team analyze trends and improve win rates.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="destructive"
            disabled={isSubmitting}
            className="min-w-[130px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Confirm Lost'
            )}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
