'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  type LeadData,
  type LeadStatusType,
  type LeadSourceType,
  LEAD_STATUS_CONFIG,
  LEAD_SOURCE_LABELS,
} from '@/types/lead';
import {
  updateLeadStatusAction,
  convertLeadToClientAction,
  deleteLeadAction,
} from '@/app/actions/leads';
import { LeadBoardView } from './lead-board-view';
import { LeadTableView } from './lead-table-view';
import { LeadDetailSheet } from './lead-detail-sheet';
import { LeadLostModal } from './lead-lost-modal';
import { LeadConvertModal } from './lead-convert-modal';
import { LeadDeleteModal } from './lead-delete-modal';
import { Input } from '@/components/ui/input';
import { buttonVariants } from '@/components/ui/button';
import {
  Search,
  Plus,
  Columns3,
  Table as TableIcon,
  X,
  UserCheck,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SalesRepOption {
  id: string;
  name: string;
  role: string;
}

interface LeadViewContainerProps {
  initialLeads: LeadData[];
  salesReps: SalesRepOption[];
  currentUser: {
    id: string;
    name?: string | null;
    role: string;
  };
}

export function LeadViewContainer({
  initialLeads,
  salesReps,
  currentUser,
}: LeadViewContainerProps) {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadData[]>(initialLeads);
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [repFilter, setRepFilter] = useState<string>('ALL');

  // Modal / Drawer States
  const [selectedLead, setSelectedLead] = useState<LeadData | null>(null);
  const [lostModalLead, setLostModalLead] = useState<LeadData | null>(null);
  const [convertModalLead, setConvertModalLead] = useState<LeadData | null>(null);
  const [deleteModalLead, setDeleteModalLead] = useState<LeadData | null>(null);

  // Submitting States & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [convertedClientInfo, setConvertedClientInfo] = useState<{
    id: string;
    companyName: string;
  } | null>(null);

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = lead.name.toLowerCase().includes(query);
        const matchesCompany = lead.companyName?.toLowerCase().includes(query);
        const matchesEmail = lead.email?.toLowerCase().includes(query);
        if (!matchesName && !matchesCompany && !matchesEmail) {
          return false;
        }
      }

      // Status
      if (statusFilter !== 'ALL' && lead.status !== statusFilter) {
        return false;
      }

      // Source
      if (sourceFilter !== 'ALL' && lead.source !== sourceFilter) {
        return false;
      }

      // Rep filter
      if (repFilter !== 'ALL' && lead.assignedToId !== repFilter) {
        return false;
      }

      return true;
    });
  }, [leads, searchQuery, statusFilter, sourceFilter, repFilter]);

  // Request status change
  const handleStatusChangeRequest = (lead: LeadData, newStatus: LeadStatusType) => {
    if (newStatus === 'LOST') {
      setLostModalLead(lead);
    } else if (newStatus === 'CONVERTED') {
      setConvertModalLead(lead);
    } else {
      executeStatusChange(lead.id, newStatus);
    }
  };

  // Direct status update execution
  const executeStatusChange = async (
    leadId: string,
    status: LeadStatusType,
    lostReason?: string
  ) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    // Optimistic update
    setLeads((prev) =>
      prev.map((item) =>
        item.id === leadId
          ? {
              ...item,
              status,
              lostReason: status === 'LOST' ? lostReason || null : null,
            }
          : item
      )
    );

    if (selectedLead?.id === leadId) {
      setSelectedLead((prev) =>
        prev
          ? {
              ...prev,
              status,
              lostReason: status === 'LOST' ? lostReason || null : null,
            }
          : null
      );
    }

    try {
      const result = await updateLeadStatusAction({
        leadId,
        status,
        lostReason,
      });

      if (result.error) {
        setErrorMessage(result.error);
        router.refresh();
      } else {
        router.refresh();
      }
    } catch {
      setErrorMessage('Failed to update lead status. Please try again.');
      router.refresh();
    } finally {
      setIsSubmitting(false);
      setLostModalLead(null);
    }
  };

  // Confirm Lost Modal
  const handleConfirmLost = async (lostReason: string) => {
    if (!lostModalLead) return;
    await executeStatusChange(lostModalLead.id, 'LOST', lostReason);
  };

  // Confirm Convert to Client Modal
  const handleConfirmConvert = async () => {
    if (!convertModalLead) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await convertLeadToClientAction(convertModalLead.id);

      if (result.error) {
        setErrorMessage(result.error);
      } else if (result.success && result.clientId) {
        // Optimistic update
        setLeads((prev) =>
          prev.map((item) =>
            item.id === convertModalLead.id
              ? {
                  ...item,
                  status: 'CONVERTED',
                  convertedClientId: result.clientId,
                }
              : item
          )
        );

        if (selectedLead?.id === convertModalLead.id) {
          setSelectedLead((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'CONVERTED',
                  convertedClientId: result.clientId,
                }
              : null
          );
        }

        setConvertedClientInfo({
          id: result.clientId,
          companyName: result.companyName || convertModalLead.name,
        });

        router.refresh();
      }
    } catch {
      setErrorMessage('Failed to convert lead to client. Please try again.');
    } finally {
      setIsSubmitting(false);
      setConvertModalLead(null);
    }
  };

  // Confirm Delete Lead
  const handleConfirmDelete = async () => {
    if (!deleteModalLead) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await deleteLeadAction(deleteModalLead.id);

      if (result.error) {
        setErrorMessage(result.error);
      } else {
        setLeads((prev) => prev.filter((item) => item.id !== deleteModalLead.id));
        if (selectedLead?.id === deleteModalLead.id) {
          setSelectedLead(null);
        }
        router.refresh();
      }
    } catch {
      setErrorMessage('Failed to delete lead. Please try again.');
    } finally {
      setIsSubmitting(false);
      setDeleteModalLead(null);
    }
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    statusFilter !== 'ALL' ||
    sourceFilter !== 'ALL' ||
    repFilter !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setSourceFilter('ALL');
    setRepFilter('ALL');
  };

  const selectClassName =
    'h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 shadow-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <div className="space-y-4">
      {/* Converted Success Banner */}
      {convertedClientInfo && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold">
                Lead Converted to Active Client!
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Client profile for{' '}
                <span className="font-semibold">{convertedClientInfo.companyName}</span>{' '}
                and primary contact have been successfully created.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/dashboard/clients/${convertedClientInfo.id}`}
              className={cn(
                buttonVariants({ variant: 'default', size: 'sm' }),
                'bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1.5'
              )}
            >
              View Client
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={() => setConvertedClientInfo(null)}
              className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="rounded-lg p-1 text-rose-600 hover:bg-rose-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Controls Bar: Search, Filters, View Switcher & Action Button */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left Side: Search & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative min-w-[220px] max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads or companies..."
              className="h-9 pl-9 pr-8 text-xs rounded-xl bg-white shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={selectClassName}
          >
            <option value="ALL">All Statuses</option>
            {(Object.keys(LEAD_STATUS_CONFIG) as LeadStatusType[]).map((st) => (
              <option key={st} value={st}>
                {LEAD_STATUS_CONFIG[st].label}
              </option>
            ))}
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className={selectClassName}
          >
            <option value="ALL">All Sources</option>
            {(Object.keys(LEAD_SOURCE_LABELS) as LeadSourceType[]).map((src) => (
              <option key={src} value={src}>
                {LEAD_SOURCE_LABELS[src]}
              </option>
            ))}
          </select>

          {/* Rep Filter (only ADMIN or MANAGER) */}
          {salesReps.length > 0 && (
            <select
              value={repFilter}
              onChange={(e) => setRepFilter(e.target.value)}
              className={selectClassName}
            >
              <option value="ALL">All Representatives</option>
              {salesReps.map((rep) => (
                <option key={rep.id} value={rep.id}>
                  {rep.name}
                </option>
              ))}
            </select>
          )}

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Clear Filters
            </button>
          )}
        </div>

        {/* Right Side: View Toggle & Add Lead CTA */}
        <div className="flex items-center gap-3 self-end lg:self-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-gray-200 bg-gray-100/80 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                viewMode === 'board'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              )}
            >
              <Columns3 className="h-3.5 w-3.5" />
              Board
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                viewMode === 'table'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              )}
            >
              <TableIcon className="h-3.5 w-3.5" />
              Table
            </button>
          </div>

          {/* Add Lead CTA */}
          <Link
            href="/dashboard/leads/new"
            className={cn(
              buttonVariants({ variant: 'default', size: 'sm' }),
              'inline-flex items-center gap-1.5'
            )}
          >
            <Plus className="h-4 w-4" />
            Add Lead
          </Link>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'board' ? (
        <LeadBoardView
          leads={filteredLeads}
          currentUser={currentUser}
          onSelectLead={(lead) => setSelectedLead(lead)}
          onStatusChangeRequest={handleStatusChangeRequest}
        />
      ) : (
        <LeadTableView
          leads={filteredLeads}
          currentUser={currentUser}
          onSelectLead={(lead) => setSelectedLead(lead)}
          onConvertRequest={(lead) => setConvertModalLead(lead)}
          onDeleteRequest={(lead) => setDeleteModalLead(lead)}
        />
      )}

      {/* Slide-over Detail Sheet */}
      <LeadDetailSheet
        open={!!selectedLead}
        lead={selectedLead}
        currentUser={currentUser}
        onClose={() => setSelectedLead(null)}
        onStatusChangeRequest={handleStatusChangeRequest}
        onConvertRequest={(lead) => setConvertModalLead(lead)}
        onDeleteRequest={(lead) => setDeleteModalLead(lead)}
      />

      {/* Modals */}
      <LeadLostModal
        open={!!lostModalLead}
        leadName={lostModalLead?.name}
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmLost}
        onCancel={() => setLostModalLead(null)}
      />

      <LeadConvertModal
        open={!!convertModalLead}
        lead={convertModalLead}
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmConvert}
        onCancel={() => setConvertModalLead(null)}
      />

      <LeadDeleteModal
        open={!!deleteModalLead}
        lead={deleteModalLead}
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalLead(null)}
      />
    </div>
  );
}
