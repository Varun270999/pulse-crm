'use client';

import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import type { LeadData } from '@/types/lead';

interface LeadDeleteModalProps {
  open: boolean;
  lead: LeadData | null;
  isSubmitting?: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function LeadDeleteModal({
  open,
  lead,
  isSubmitting = false,
  onConfirm,
  onCancel,
}: LeadDeleteModalProps) {
  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={(openVal) => !openVal && !isSubmitting && onCancel()}>
      <DialogHeader>
        <div className="flex items-center gap-2.5 text-rose-600 mb-1">
          <div className="rounded-full bg-rose-100 p-2 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle>Delete Lead Record</DialogTitle>
        </div>
        <DialogDescription>
          Are you sure you want to permanently delete lead <span className="font-bold text-gray-900">{lead.name}</span>
          {lead.companyName ? ` from ${lead.companyName}` : ''}? This action cannot be undone.
        </DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete Lead
            </>
          )}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
