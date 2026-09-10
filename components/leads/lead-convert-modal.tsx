'use client';

import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserCheck, Loader2, Building2, User } from 'lucide-react';
import type { LeadData } from '@/types/lead';

interface LeadConvertModalProps {
  open: boolean;
  lead: LeadData | null;
  isSubmitting?: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function LeadConvertModal({
  open,
  lead,
  isSubmitting = false,
  onConfirm,
  onCancel,
}: LeadConvertModalProps) {
  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={(openVal) => !openVal && !isSubmitting && onCancel()}>
      <DialogHeader>
        <div className="flex items-center gap-2.5 text-emerald-600 mb-1">
          <div className="rounded-full bg-emerald-100 p-2 text-emerald-600">
            <UserCheck className="h-5 w-5" />
          </div>
          <DialogTitle>Convert Lead to Active Client</DialogTitle>
        </div>
        <DialogDescription>
          Converting this lead will promote them into your permanent Client directory and register their primary contact person.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-3">
        <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Building2 className="h-4 w-4 text-gray-500 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                Client Company Name
              </p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">
                {lead.companyName || lead.name}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 pt-2 border-t border-gray-200/60">
            <User className="h-4 w-4 text-gray-500 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                Primary Contact
              </p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {lead.name} {lead.email ? `(${lead.email})` : ''}
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          Note: This action marks the lead as <span className="font-semibold text-emerald-700">Converted</span> and creates an <span className="font-semibold text-emerald-700">Active</span> client record assigned to <span className="font-medium text-gray-800">{lead.assignedTo?.name || 'Assigned Rep'}</span>.
        </p>
      </div>

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
          onClick={onConfirm}
          disabled={isSubmitting}
          className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Converting...
            </>
          ) : (
            'Confirm & Convert'
          )}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
