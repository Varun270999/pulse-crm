'use client';

import {
  type LeadData,
  type LeadStatusType,
  LEAD_STATUS_CONFIG,
  LEAD_SOURCE_LABELS,
} from '@/types/lead';
import { formatINR, cn } from '@/lib/utils';
import {
  Building2,
  Tag,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';

interface LeadBoardViewProps {
  leads: LeadData[];
  currentUser: {
    id: string;
    name?: string | null;
    role: string;
  };
  onSelectLead: (lead: LeadData) => void;
  onStatusChangeRequest: (lead: LeadData, newStatus: LeadStatusType) => void;
}

const COLUMNS: LeadStatusType[] = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL_SENT',
  'CONVERTED',
  'LOST',
];

export function LeadBoardView({
  leads,
  currentUser,
  onSelectLead,
  onStatusChangeRequest,
}: LeadBoardViewProps) {
  // Group leads by status
  const leadsByStatus = COLUMNS.reduce<Record<LeadStatusType, LeadData[]>>(
    (acc, col) => {
      acc[col] = leads.filter((l) => l.status === col);
      return acc;
    },
    {
      NEW: [],
      CONTACTED: [],
      QUALIFIED: [],
      PROPOSAL_SENT: [],
      CONVERTED: [],
      LOST: [],
    }
  );

  return (
    <div className="overflow-x-auto pb-6 pt-1">
      <div className="inline-flex min-w-full items-start gap-4">
        {COLUMNS.map((columnKey) => {
          const config = LEAD_STATUS_CONFIG[columnKey];
          const columnLeads = leadsByStatus[columnKey];
          const totalValue = columnLeads.reduce(
            (sum, item) => sum + (item.estimatedValue || 0),
            0
          );

          return (
            <div
              key={columnKey}
              className="flex w-80 shrink-0 flex-col rounded-2xl border border-gray-200/80 bg-gray-50/60 p-3"
            >
              {/* Column Header */}
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'h-2.5 w-2.5 rounded-full',
                      columnKey === 'NEW' && 'bg-blue-500',
                      columnKey === 'CONTACTED' && 'bg-amber-500',
                      columnKey === 'QUALIFIED' && 'bg-purple-500',
                      columnKey === 'PROPOSAL_SENT' && 'bg-indigo-500',
                      columnKey === 'CONVERTED' && 'bg-emerald-500',
                      columnKey === 'LOST' && 'bg-rose-500'
                    )}
                  />
                  <h3 className="text-sm font-bold text-gray-900">{config.label}</h3>
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-200/70 px-1.5 text-xs font-semibold text-gray-700">
                    {columnLeads.length}
                  </span>
                </div>
                <div className="text-xs font-semibold text-gray-500">
                  {formatINR(totalValue)}
                </div>
              </div>

              {/* Cards Container */}
              <div className="flex flex-col gap-3 min-h-[400px]">
                {columnLeads.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-400">
                    No leads in this stage
                  </div>
                ) : (
                  columnLeads.map((lead) => {
                    const repInitials = lead.assignedTo?.name
                      ? lead.assignedTo.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)
                      : 'U';

                    const canEditStatus =
                      currentUser.role === 'ADMIN' ||
                      currentUser.role === 'MANAGER' ||
                      (currentUser.role === 'SALES_EXECUTIVE' && lead.assignedToId === currentUser.id);

                    return (
                      <div
                        key={lead.id}
                        onClick={() => onSelectLead(lead)}
                        className="group relative flex cursor-pointer flex-col rounded-xl border border-gray-200/90 bg-white p-4 shadow-xs transition-all hover:border-gray-300 hover:shadow-md active:scale-[0.99]"
                      >
                        {/* Card Header: Lead Name & Company */}
                        <div className="mb-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                              {lead.name}
                            </h4>
                          </div>
                          {lead.companyName && (
                            <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5 line-clamp-1">
                              <Building2 className="h-3 w-3 shrink-0 text-gray-400" />
                              {lead.companyName}
                            </p>
                          )}
                        </div>

                        {/* Value & Source Badge */}
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <span className="text-sm font-extrabold text-gray-900">
                            {lead.estimatedValue !== null ? formatINR(lead.estimatedValue) : '₹0'}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                            <Tag className="h-2.5 w-2.5 text-gray-400" />
                            {LEAD_SOURCE_LABELS[lead.source] || lead.source}
                          </span>
                        </div>

                        {/* If Converted Note */}
                        {lead.status === 'CONVERTED' && (
                          <div className="mb-2 flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                            <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />
                            <span className="truncate">Converted to Client</span>
                          </div>
                        )}

                        {/* If Lost Reason Snippet */}
                        {lead.status === 'LOST' && lead.lostReason && (
                          <div className="mb-2 flex items-start gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-1 rounded-md">
                            <AlertTriangle className="h-3 w-3 shrink-0 text-rose-600 mt-0.5" />
                            <span className="line-clamp-1">Reason: {lead.lostReason}</span>
                          </div>
                        )}

                        {/* Bottom Row: Rep Avatar & Quick Status Dropdown */}
                        <div
                          className="mt-1 flex items-center justify-between border-t border-gray-100 pt-2.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div
                            className="flex items-center gap-1.5"
                            title={`Assigned to ${lead.assignedTo?.name || 'Rep'}`}
                          >
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                              {repInitials}
                            </div>
                            <span className="text-xs text-gray-600 max-w-[90px] truncate">
                              {lead.assignedTo?.name?.split(' ')[0] || 'Rep'}
                            </span>
                          </div>

                          {/* Quick Status Select */}
                          {canEditStatus ? (
                            <div className="relative">
                              <select
                                value={lead.status}
                                onChange={(e) => {
                                  const targetStatus = e.target.value as LeadStatusType;
                                  if (targetStatus !== lead.status) {
                                    onStatusChangeRequest(lead, targetStatus);
                                  }
                                }}
                                className="h-7 cursor-pointer appearance-none rounded-md border border-gray-200 bg-gray-50/80 pl-2 pr-6 text-[11px] font-medium text-gray-700 hover:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                {COLUMNS.map((st) => (
                                  <option key={st} value={st}>
                                    {LEAD_STATUS_CONFIG[st].label}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                            </div>
                          ) : (
                            <span
                              className={cn(
                                'text-[11px] font-medium',
                                config.badgeText
                              )}
                            >
                              {config.label}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
