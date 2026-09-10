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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertTriangle } from 'lucide-react';
import type { DealData } from '@/types/deal';

interface DealLostModalProps {
  deal: DealData | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (dealId: string, lostReason: string) => Promise<void>;
}

export function DealLostModal({
  deal,
  open,
  onClose,
  onConfirm,
}: DealLostModalProps) {
  const [lostReason, setLostReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!deal) return null;

  async function handleConfirm() {
    if (!deal) return;
    if (!lostReason.trim()) {
      setError('Please provide a reason why this deal was lost.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onConfirm(deal.id, lostReason.trim());
      setLostReason('');
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update deal stage';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setError(null);
          setLostReason('');
          onClose();
        }
      }}
    >
      <div className="space-y-4">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <div className="p-2 rounded-full bg-rose-100 dark:bg-rose-950/50">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle>Mark Deal as Lost</DialogTitle>
          </div>
          <DialogDescription>
            You are moving <span className="font-semibold text-foreground">{deal.title}</span> ({deal.client.companyName}) to the <span className="font-semibold text-rose-600">Lost</span> stage.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="lost-reason" className="text-sm font-medium">
            Reason for Loss <span className="text-rose-500">*</span>
          </Label>
          <Textarea
            id="lost-reason"
            rows={3}
            placeholder="e.g. Competitor was cheaper by 20%, client postponed project to next fiscal year, budget frozen..."
            value={lostReason}
            onChange={(e) => {
              setLostReason(e.target.value);
              if (error) setError(null);
            }}
            disabled={loading}
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground">
            A lost reason helps your team analyze win/loss trends and refine future proposals.
          </p>
        </div>

        <DialogFooter className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setError(null);
              setLostReason('');
              onClose();
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading || !lostReason.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Confirm Deal Lost'
            )}
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
