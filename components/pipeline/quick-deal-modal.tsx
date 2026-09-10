'use client';

import { Dialog } from '@/components/ui/dialog';
import { DealForm } from '@/components/pipeline/deal-form';

interface QuickDealModalProps {
  clientId: string;
  clientCompanyName: string;
  open: boolean;
  onClose: () => void;
  salesReps: { id: string; name: string; role: string }[];
  currentUser: {
    id: string;
    name?: string | null;
    role: string;
  };
}

export function QuickDealModal({
  clientId,
  clientCompanyName,
  open,
  onClose,
  salesReps,
  currentUser,
}: QuickDealModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <div className="max-h-[85vh] overflow-y-auto pr-1">
        <DealForm
          currentUser={currentUser}
          clients={[{ id: clientId, companyName: clientCompanyName }]}
          salesReps={salesReps}
          initialClientId={clientId}
          onSuccess={onClose}
          onCancel={onClose}
        />
      </div>
    </Dialog>
  );
}
