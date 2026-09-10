'use client';

import { Dialog } from '@/components/ui/dialog';
import { DealForm } from '@/components/pipeline/deal-form';
import type { DealData } from '@/types/deal';

interface DealEditModalProps {
  deal: DealData | null;
  open: boolean;
  onClose: () => void;
  clients: { id: string; companyName: string }[];
  salesReps: { id: string; name: string; role: string }[];
  currentUser: {
    id: string;
    name?: string | null;
    role: string;
  };
}

export function DealEditModal({
  deal,
  open,
  onClose,
  clients,
  salesReps,
  currentUser,
}: DealEditModalProps) {
  if (!deal) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <div className="max-h-[85vh] overflow-y-auto pr-1">
        <DealForm
          currentUser={currentUser}
          clients={clients}
          salesReps={salesReps}
          dealToEdit={deal}
          onSuccess={onClose}
          onCancel={onClose}
        />
      </div>
    </Dialog>
  );
}
