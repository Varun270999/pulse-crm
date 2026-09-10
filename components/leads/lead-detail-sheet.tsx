'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Sheet,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Building2,
  Mail,
  Phone,
  Tag,
  UserCheck,
  AlertTriangle,
  ExternalLink,
  Trash2,
  Clock,
  User,
  Calendar,
} from 'lucide-react';
import { QuickFollowUpModal } from '@/components/follow-ups/quick-follow-up-modal';
import { cn, formatINR } from '@/lib/utils';
import {
  type LeadData,
  type LeadStatusType,
  LEAD_STATUS_CONFIG,
  LEAD_SOURCE_LABELS,
} from '@/types/lead';

interface LeadDetailSheetProps {
  open: boolean;
  lead: LeadData | null;
  currentUser: {
    id: string;
    name?: string | null;
    role: string;
  };
  onClose: () => void;
  onStatusChangeRequest: (lead: LeadData, newStatus: LeadStatusType) => void;
  onConvertRequest: (lead: LeadData) => void;
  onDeleteRequest: (lead: LeadData) => void;
}

export function LeadDetailSheet({
  open,
  lead,
  currentUser,
  onClose,
  onStatusChangeRequest,
  onConvertRequest,
  onDeleteRequest,
}: LeadDetailSheetProps) {
  const [isAddFollowUpOpen, setIsAddFollowUpOpen] = useState(false);

  if (!lead) return null;

  const statusConfig = LEAD_STATUS_CONFIG[lead.status];
  const isConverted = lead.status === 'CONVERTED';
  const isLost = lead.status === 'LOST';
  const canDelete = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';
  const canModify =
    currentUser.role === 'ADMIN' ||
    currentUser.role === 'MANAGER' ||
    (currentUser.role === 'SALES_EXECUTIVE' && lead.assignedToId === currentUser.id);

  const formattedCreatedDate = new Date(lead.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <>
    <Sheet open={open} onOpenChange={onClose} side="right">
      <SheetHeader onClose={onClose}>
        <div className="flex items-center gap-2 mb-1">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
              statusConfig.badgeBg
            )}
          >
            {statusConfig.label}
          </span>
          <span className="text-xs text-gray-500">
            Source: {LEAD_SOURCE_LABELS[lead.source] || lead.source}
          </span>
        </div>
        <SheetTitle className="text-xl">{lead.name}</SheetTitle>
        {lead.companyName && (
          <SheetDescription className="flex items-center gap-1.5 text-gray-600 font-medium">
            <Building2 className="h-3.5 w-3.5 text-gray-400" />
            {lead.companyName}
          </SheetDescription>
        )}
      </SheetHeader>

      <SheetBody className="space-y-6">
        {/* Status Transition Bar (if allowed to modify) */}
        {canModify && (
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">
              Update Lead Status
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(LEAD_STATUS_CONFIG) as LeadStatusType[]).map((st) => {
                const isSelected = lead.status === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      if (st !== lead.status) {
                        onStatusChangeRequest(lead, st);
                      }
                    }}
                    className={cn(
                      'px-2 py-1.5 rounded-lg text-xs font-medium border transition-all text-center',
                      isSelected
                        ? 'bg-white shadow-xs font-bold border-gray-400 text-gray-900 ring-2 ring-blue-500/20'
                        : 'bg-white/60 border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300'
                    )}
                  >
                    {LEAD_STATUS_CONFIG[st].label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Converted Callout Banner */}
        {isConverted && lead.convertedClientId && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4">
            <div className="flex items-start gap-3">
              <UserCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-emerald-900">Lead Converted to Client</p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  This lead was successfully converted into an active client record.
                </p>
                <div className="mt-3">
                  <Link
                    href={`/dashboard/clients/${lead.convertedClientId}`}
                    className={cn(
                      buttonVariants({ variant: 'default', size: 'sm' }),
                      'bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1.5'
                    )}
                  >
                    View Client Profile
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lost Callout Banner */}
        {isLost && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-rose-900">Opportunity Lost</p>
                <p className="text-xs font-medium text-rose-800 mt-1">
                  Reason: <span className="font-normal">{lead.lostReason || 'No reason specified'}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Financial & Deal Overview */}
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Deal Overview
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-500 block">Estimated Deal Value</span>
              <span className="text-lg font-bold text-gray-900 flex items-center gap-1 mt-0.5">
                {lead.estimatedValue !== null ? formatINR(lead.estimatedValue) : 'Not Estimated'}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Acquisition Source</span>
              <span className="text-sm font-semibold text-gray-800 flex items-center gap-1.5 mt-1">
                <Tag className="h-3.5 w-3.5 text-blue-500" />
                {LEAD_SOURCE_LABELS[lead.source] || lead.source}
              </span>
            </div>
          </div>
        </div>

        {/* Contact Coordinates */}
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Contact Details
          </h4>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2.5">
              <User className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-gray-900 font-medium">{lead.name}</span>
            </div>
            {lead.email ? (
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                <a
                  href={`mailto:${lead.email}`}
                  className="text-blue-600 hover:underline break-all"
                >
                  {lead.email}
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 text-gray-400 text-xs">
                <Mail className="h-4 w-4 shrink-0" />
                <span>No email provided</span>
              </div>
            )}
            {lead.phone ? (
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                <a
                  href={`tel:${lead.phone}`}
                  className="text-gray-700 hover:text-blue-600"
                >
                  {lead.phone}
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 text-gray-400 text-xs">
                <Phone className="h-4 w-4 shrink-0" />
                <span>No phone number</span>
              </div>
            )}
            {lead.companyName && (
              <div className="flex items-center gap-2.5">
                <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-gray-700">{lead.companyName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Discovery Notes */}
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Discovery Notes
          </h4>
          {lead.notes ? (
            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
              {lead.notes}
            </p>
          ) : (
            <p className="text-xs text-gray-400 italic">No notes recorded for this lead.</p>
          )}
        </div>

        {/* Ownership & Metadata */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 text-xs space-y-2">
          <div className="flex items-center justify-between text-gray-600">
            <span>Assigned Sales Rep:</span>
            <span className="font-semibold text-gray-900">
              {lead.assignedTo?.name || 'Unassigned'} ({lead.assignedTo?.role.replace('_', ' ')})
            </span>
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <span>Created By:</span>
            <span className="text-gray-900">{lead.createdBy?.name || 'System'}</span>
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <span>Captured Date:</span>
            <span className="text-gray-900 flex items-center gap-1">
              <Clock className="h-3 w-3 text-gray-400" />
              {formattedCreatedDate}
            </span>
          </div>
        </div>
      </SheetBody>

      <SheetFooter className="justify-between sm:justify-between">
        {canDelete ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onDeleteRequest(lead)}
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-rose-200"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete
          </Button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAddFollowUpOpen(true)}
            className="inline-flex items-center gap-1.5 text-blue-700 hover:text-blue-800 hover:bg-blue-50 border-blue-200"
          >
            <Calendar className="h-3.5 w-3.5 text-blue-600" />
            Schedule Follow-up
          </Button>

          {!isConverted && !isLost && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onStatusChangeRequest(lead, 'LOST')}
                className="text-gray-700"
              >
                Mark Lost
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => onConvertRequest(lead)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <UserCheck className="h-4 w-4 mr-1.5" />
                Convert to Client
              </Button>
            </>
          )}
        </div>
      </SheetFooter>
    </Sheet>

    {/* Quick Follow-up Modal */}
    <QuickFollowUpModal
      open={isAddFollowUpOpen}
      onClose={() => setIsAddFollowUpOpen(false)}
      target={{
        type: 'LEAD',
        id: lead.id,
        name: lead.name,
      }}
      currentUser={currentUser}
    />
    </>
  );
}
