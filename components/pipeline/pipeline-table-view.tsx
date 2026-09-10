'use client';

import { useState } from 'react';
import {
  ArrowUpDown,
  Building2,
  Calendar,
  AlertCircle,
  Edit2,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatINR, cn } from '@/lib/utils';
import {
  STAGE_CONFIG,
  STAGES_ORDER,
  type DealData,
  type PipelineStageType,
} from '@/types/deal';

interface PipelineTableViewProps {
  deals: DealData[];
  onStageChange: (deal: DealData, targetStage: PipelineStageType) => void;
  onEditDeal: (deal: DealData) => void;
  onDeleteDeal: (dealId: string) => void;
  userRole?: string;
  currentUserId?: string;
}

type SortField = 'title' | 'client' | 'value' | 'stage' | 'probability' | 'expectedCloseDate' | 'createdAt';

export function PipelineTableView({
  deals,
  onStageChange,
  onEditDeal,
  onDeleteDeal,
  userRole,
  currentUserId,
}: PipelineTableViewProps) {
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }

  const sortedDeals = [...deals].sort((a, b) => {
    let comp = 0;
    if (sortField === 'title') {
      comp = a.title.localeCompare(b.title);
    } else if (sortField === 'client') {
      comp = a.client.companyName.localeCompare(b.client.companyName);
    } else if (sortField === 'value') {
      comp = a.value - b.value;
    } else if (sortField === 'probability') {
      comp = a.probability - b.probability;
    } else if (sortField === 'stage') {
      comp = STAGES_ORDER.indexOf(a.stage) - STAGES_ORDER.indexOf(b.stage);
    } else if (sortField === 'expectedCloseDate') {
      const dateA = a.expectedCloseDate ? new Date(a.expectedCloseDate).getTime() : 0;
      const dateB = b.expectedCloseDate ? new Date(b.expectedCloseDate).getTime() : 0;
      comp = dateA - dateB;
    } else if (sortField === 'createdAt') {
      comp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return sortOrder === 'asc' ? comp : -comp;
  });

  return (
    <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/40 border-b border-border/70 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
            <tr>
              <th className="py-3.5 px-4 cursor-pointer hover:text-foreground" onClick={() => handleSort('title')}>
                <div className="flex items-center gap-1.5">
                  Deal Title
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-foreground" onClick={() => handleSort('client')}>
                <div className="flex items-center gap-1.5">
                  Client
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-foreground text-right" onClick={() => handleSort('value')}>
                <div className="flex items-center justify-end gap-1.5">
                  Value (INR)
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-foreground" onClick={() => handleSort('stage')}>
                <div className="flex items-center gap-1.5">
                  Stage
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-foreground" onClick={() => handleSort('probability')}>
                <div className="flex items-center gap-1.5">
                  Win Prob.
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer hover:text-foreground" onClick={() => handleSort('expectedCloseDate')}>
                <div className="flex items-center gap-1.5">
                  Expected Close
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3.5 px-4">Assigned Rep</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {sortedDeals.map((deal) => {
              const stageConfig = STAGE_CONFIG[deal.stage];
              const isOverdue = (() => {
                if (!deal.expectedCloseDate) return false;
                if (deal.stage === 'WON' || deal.stage === 'LOST') return false;
                const closeDate = new Date(deal.expectedCloseDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return closeDate < today;
              })();

              const canEdit =
                userRole === 'ADMIN' ||
                userRole === 'MANAGER' ||
                deal.assignedToId === currentUserId;

              return (
                <tr
                  key={deal.id}
                  className="hover:bg-muted/30 transition-colors group"
                >
                  {/* Title */}
                  <td className="py-3 px-4 font-medium text-foreground">
                    <button
                      type="button"
                      onClick={() => onEditDeal(deal)}
                      className="text-left hover:text-primary hover:underline font-medium line-clamp-1"
                    >
                      {deal.title}
                    </button>
                  </td>

                  {/* Client */}
                  <td className="py-3 px-4 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate max-w-[150px]" title={deal.client.companyName}>
                        {deal.client.companyName}
                      </span>
                    </div>
                  </td>

                  {/* Value */}
                  <td className="py-3 px-4 font-semibold text-foreground text-right tabular-nums">
                    {formatINR(deal.value)}
                  </td>

                  {/* Stage Dropdown */}
                  <td className="py-3 px-4">
                    <select
                      value={deal.stage}
                      onChange={(e) =>
                        onStageChange(deal, e.target.value as PipelineStageType)
                      }
                      className={cn(
                        'text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer bg-transparent focus:outline-none focus:ring-1 focus:ring-primary',
                        stageConfig.badgeBg,
                        stageConfig.badgeText,
                        stageConfig.badgeBorder
                      )}
                    >
                      {STAGES_ORDER.map((stage) => (
                        <option
                          key={stage}
                          value={stage}
                          className="bg-popover text-popover-foreground font-normal"
                        >
                          {STAGE_CONFIG[stage].label}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Probability */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            deal.probability >= 70
                              ? 'bg-emerald-500'
                              : deal.probability >= 40
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                          )}
                          style={{ width: `${deal.probability}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {deal.probability}%
                      </span>
                    </div>
                  </td>

                  {/* Expected Close Date */}
                  <td className="py-3 px-4 text-xs">
                    {deal.expectedCloseDate ? (
                      <div
                        className={cn(
                          'flex items-center gap-1.5',
                          isOverdue
                            ? 'text-rose-600 dark:text-rose-400 font-semibold'
                            : 'text-muted-foreground'
                        )}
                      >
                        {isOverdue ? (
                          <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                        ) : (
                          <Calendar className="h-3.5 w-3.5" />
                        )}
                        <span>
                          {new Date(deal.expectedCloseDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </td>

                  {/* Assigned Rep */}
                  <td className="py-3 px-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold">
                        {deal.assignedTo.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate max-w-[120px]">{deal.assignedTo.name}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="relative inline-block text-left">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          setOpenMenuId(openMenuId === deal.id ? null : deal.id)
                        }
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>

                      {openMenuId === deal.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-0 mt-1 w-36 rounded-md border border-border bg-popover p-1 shadow-lg z-50 text-xs text-left">
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onEditDeal(deal);
                                }}
                                className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-foreground hover:bg-muted"
                              >
                                <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                                Edit Deal
                              </button>
                            )}
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onDeleteDeal(deal.id);
                                }}
                                className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete Deal
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {sortedDeals.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-muted-foreground">
                  No deals found matching the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
