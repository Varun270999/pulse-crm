'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  Filter,
  Users,
  Sparkles,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PipelineStatsCards } from '@/components/pipeline/pipeline-stats-cards';
import { PipelineBoardView } from '@/components/pipeline/pipeline-board-view';
import { PipelineTableView } from '@/components/pipeline/pipeline-table-view';
import { DealLostModal } from '@/components/pipeline/deal-lost-modal';
import { DealEditModal } from '@/components/pipeline/deal-edit-modal';
import { updateDealStageAction, deleteDealAction } from '@/app/actions/deals';
import { formatINR, cn } from '@/lib/utils';
import {
  STAGE_CONFIG,
  STAGES_ORDER,
  type DealData,
  type PipelineStats,
  type PipelineStageType,
} from '@/types/deal';

interface PipelineViewContainerProps {
  initialDeals: DealData[];
  stats: PipelineStats;
  clients: { id: string; companyName: string }[];
  salesReps: { id: string; name: string; role: string }[];
  currentUser: {
    id: string;
    name?: string | null;
    role: string;
  };
}

interface ToastNotification {
  type: 'celebrate' | 'success' | 'error';
  title: string;
  message?: string;
}

export function PipelineViewContainer({
  initialDeals,
  stats,
  clients,
  salesReps,
  currentUser,
}: PipelineViewContainerProps) {
  const [deals, setDeals] = useState<DealData[]>(initialDeals);
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [selectedRep, setSelectedRep] = useState<string>('ALL');

  // Modal states
  const [dealForLostModal, setDealForLostModal] = useState<DealData | null>(null);
  const [dealToEdit, setDealToEdit] = useState<DealData | null>(null);
  const [toast, setToast] = useState<ToastNotification | null>(null);

  function triggerToast(type: ToastNotification['type'], title: string, message?: string) {
    setToast({ type, title, message });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  }

  // Handle stage change
  async function handleStageChange(deal: DealData, targetStage: PipelineStageType) {
    if (targetStage === 'LOST') {
      setDealForLostModal(deal);
      return;
    }

    // Optimistic UI update
    const previousDeals = [...deals];
    const isWon = targetStage === 'WON';
    const updatedDeals = deals.map((d) =>
      d.id === deal.id
        ? {
            ...d,
            stage: targetStage,
            probability: isWon ? 100 : STAGE_CONFIG[targetStage].defaultProbability,
            wonAt: isWon ? new Date().toISOString() : null,
            lostAt: null,
            lostReason: null,
          }
        : d
    );
    setDeals(updatedDeals);

    const res = await updateDealStageAction({
      dealId: deal.id,
      stage: targetStage,
    });

    if (res?.error) {
      setDeals(previousDeals);
      triggerToast('error', 'Failed to update stage', res.error);
    } else {
      if (isWon) {
        triggerToast(
          'celebrate',
          '🎉 Deal Won!',
          `${deal.title} (${formatINR(deal.value)}) was successfully closed as won!`
        );
      } else {
        triggerToast('success', 'Stage updated', `Moved to ${STAGE_CONFIG[targetStage].label}`);
      }
    }
  }

  // Confirm Lost Reason
  async function handleConfirmLost(dealId: string, lostReason: string) {
    const previousDeals = [...deals];
    const targetDeal = deals.find((d) => d.id === dealId);

    // Optimistic UI update
    const updatedDeals = deals.map((d) =>
      d.id === dealId
        ? {
            ...d,
            stage: 'LOST' as PipelineStageType,
            probability: 0,
            lostReason,
            lostAt: new Date().toISOString(),
            wonAt: null,
          }
        : d
    );
    setDeals(updatedDeals);

    const res = await updateDealStageAction({
      dealId,
      stage: 'LOST',
      lostReason,
    });

    if (res?.error) {
      setDeals(previousDeals);
      throw new Error(res.error);
    } else {
      triggerToast(
        'success',
        'Deal marked as lost',
        `${targetDeal?.title || 'Deal'} moved to Lost`
      );
    }
  }

  // Delete Deal
  async function handleDeleteDeal(dealId: string) {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;

    if (!confirm(`Are you sure you want to delete "${deal.title}"? This cannot be undone.`)) {
      return;
    }

    const previousDeals = [...deals];
    setDeals(deals.filter((d) => d.id !== dealId));

    const res = await deleteDealAction(dealId);
    if (res?.error) {
      setDeals(previousDeals);
      triggerToast('error', 'Failed to delete deal', res.error);
    } else {
      triggerToast('success', 'Deal deleted', `"${deal.title}" has been deleted.`);
    }
  }

  // Filter deals
  const filteredDeals = deals.filter((deal) => {
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = deal.title.toLowerCase().includes(q);
      const matchClient = deal.client.companyName.toLowerCase().includes(q);
      if (!matchTitle && !matchClient) return false;
    }

    // Stage filter match
    if (selectedStage !== 'ALL' && deal.stage !== selectedStage) {
      return false;
    }

    // Rep filter match
    if (selectedRep !== 'ALL' && deal.assignedToId !== selectedRep) {
      return false;
    }

    return true;
  });

  const isSalesExecutive = currentUser.role === 'SALES_EXECUTIVE';

  return (
    <div className="space-y-6">
      {/* Toast Banner / Celebration Banner */}
      {toast && (
        <div
          className={cn(
            'fixed top-5 right-5 z-50 flex items-start gap-3 p-4 rounded-xl shadow-xl border animate-in slide-in-from-top-4 duration-300 max-w-md backdrop-blur-md',
            toast.type === 'celebrate'
              ? 'bg-gradient-to-r from-emerald-500/90 to-teal-600/90 text-white border-emerald-400/50'
              : toast.type === 'error'
              ? 'bg-rose-600/95 text-white border-rose-500'
              : 'bg-foreground/95 text-background border-border'
          )}
        >
          {toast.type === 'celebrate' ? (
            <Sparkles className="h-6 w-6 shrink-0 text-yellow-300 animate-bounce" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-200" />
          ) : (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          )}

          <div className="flex-1">
            <h5 className="font-semibold text-sm leading-none mb-1">{toast.title}</h5>
            {toast.message && <p className="text-xs opacity-90">{toast.message}</p>}
          </div>

          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Sales Pipeline
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track deals across pipeline stages, forecast revenue, and monitor close rates
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/dashboard/pipeline/new"
            className={cn(buttonVariants({ variant: 'default' }), 'gap-1.5 shadow-xs')}
          >
            <Plus className="h-4 w-4" />
            <span>New Deal</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <PipelineStatsCards stats={stats} />

      {/* Search, Filters, and View Switcher Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-card border border-border/80 p-3 rounded-xl shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search deals or clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Filter by Stage */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Stages</option>
              {STAGES_ORDER.map((stg) => (
                <option key={stg} value={stg}>
                  {STAGE_CONFIG[stg].label}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Rep (Admin/Manager only) */}
          {!isSalesExecutive && (
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
              <select
                value={selectedRep}
                onChange={(e) => setSelectedRep(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">All Sales Reps</option>
                {salesReps.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* View Switcher: Board vs Table */}
        <div className="flex items-center gap-1 border border-border/80 rounded-lg p-0.5 bg-muted/40 self-end lg:self-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('board')}
            className={cn(
              'h-8 px-2.5 text-xs font-medium gap-1.5 rounded-md transition-all',
              viewMode === 'board'
                ? 'bg-card text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Board</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('table')}
            className={cn(
              'h-8 px-2.5 text-xs font-medium gap-1.5 rounded-md transition-all',
              viewMode === 'table'
                ? 'bg-card text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <List className="h-3.5 w-3.5" />
            <span>Table</span>
          </Button>
        </div>
      </div>

      {/* Main Content: Board or Table View */}
      {viewMode === 'board' ? (
        <PipelineBoardView
          deals={filteredDeals}
          onStageChange={handleStageChange}
          onEditDeal={(deal) => setDealToEdit(deal)}
          onDeleteDeal={handleDeleteDeal}
          userRole={currentUser.role}
          currentUserId={currentUser.id}
        />
      ) : (
        <PipelineTableView
          deals={filteredDeals}
          onStageChange={handleStageChange}
          onEditDeal={(deal) => setDealToEdit(deal)}
          onDeleteDeal={handleDeleteDeal}
          userRole={currentUser.role}
          currentUserId={currentUser.id}
        />
      )}

      {/* Lost Reason Modal */}
      <DealLostModal
        deal={dealForLostModal}
        open={!!dealForLostModal}
        onClose={() => setDealForLostModal(null)}
        onConfirm={handleConfirmLost}
      />

      {/* Edit Deal Modal */}
      <DealEditModal
        deal={dealToEdit}
        open={!!dealToEdit}
        onClose={() => setDealToEdit(null)}
        clients={clients}
        salesReps={salesReps}
        currentUser={currentUser}
      />
    </div>
  );
}
