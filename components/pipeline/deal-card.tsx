'use client';

import { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import {
  Building2,
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatINR, cn } from '@/lib/utils';
import {
  STAGE_CONFIG,
  STAGES_ORDER,
  type DealData,
  type PipelineStageType,
} from '@/types/deal';

interface DealCardProps {
  deal: DealData;
  index: number;
  onEdit: (deal: DealData) => void;
  onDelete: (dealId: string) => void;
  onStageChange: (deal: DealData, targetStage: PipelineStageType) => void;
  userRole?: string;
  currentUserId?: string;
}

export function DealCard({
  deal,
  index,
  onEdit,
  onDelete,
  onStageChange,
  userRole,
  currentUserId,
}: DealCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Check overdue: expectedCloseDate < today and stage not WON or LOST
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

  const formattedCloseDate = deal.expectedCloseDate
    ? new Date(deal.expectedCloseDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <Draggable draggableId={deal.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            'group relative bg-card text-card-foreground rounded-lg border border-border/70 p-3.5 shadow-2xs transition-all',
            'hover:shadow-md hover:border-primary/40',
            snapshot.isDragging
              ? 'shadow-xl ring-2 ring-primary/40 rotate-1 scale-[1.02] z-50 bg-card'
              : ''
          )}
        >
          {/* Card Header: Title & Dropdown menu */}
          <div className="flex items-start justify-between gap-2">
            <h4
              onClick={() => onEdit(deal)}
              className="font-medium text-sm text-foreground line-clamp-2 hover:text-primary cursor-pointer transition-colors"
              title={deal.title}
            >
              {deal.title}
            </h4>

            {/* Accessible Actions Menu */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
                title="Deal options"
                aria-label="Deal options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1 w-44 rounded-md border border-border bg-popover p-1 shadow-lg z-50 text-xs">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(false);
                          onEdit(deal);
                        }}
                        className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-foreground hover:bg-muted"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                        Edit Deal
                      </button>
                    )}

                    {/* Move Stage Submenu */}
                    <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Change Stage
                    </div>
                    {STAGES_ORDER.map((stage) => {
                      if (stage === deal.stage) return null;
                      return (
                        <button
                          key={stage}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(false);
                            onStageChange(deal, stage);
                          }}
                          className="flex w-full items-center gap-2 rounded px-2.5 py-1 text-left hover:bg-muted text-muted-foreground hover:text-foreground"
                        >
                          <span
                            className={cn(
                              'h-2 w-2 rounded-full',
                              STAGE_CONFIG[stage].indicatorColor
                            )}
                          />
                          {STAGE_CONFIG[stage].label}
                        </button>
                      );
                    })}

                    {canEdit && (
                      <div className="pt-1 mt-1 border-t border-border">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(false);
                            onDelete(deal.id);
                          }}
                          className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete Deal
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Client Company Name */}
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate font-normal" title={deal.client.companyName}>
              {deal.client.companyName}
            </span>
          </div>

          {/* Deal Value & Probability Bar */}
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/50 pt-2.5">
            <span className="text-sm font-semibold text-foreground tracking-tight">
              {formatINR(deal.value)}
            </span>
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] px-1.5 py-0 font-medium',
                deal.probability >= 70
                  ? 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30'
                  : deal.probability >= 40
                  ? 'border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/30'
                  : 'border-slate-300 text-slate-600 bg-slate-50 dark:bg-slate-800/40'
              )}
            >
              {deal.probability}% win prob
            </Badge>
          </div>

          {/* Footer: Rep & Expected Close Date */}
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground gap-2">
            {/* Assigned Representative */}
            <div
              className="flex items-center gap-1.5 max-w-[120px] truncate"
              title={`Assigned to ${deal.assignedTo.name}`}
            >
              <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold shrink-0">
                {deal.assignedTo.name.charAt(0).toUpperCase()}
              </div>
              <span className="truncate">{deal.assignedTo.name}</span>
            </div>

            {/* Expected Close Date */}
            {formattedCloseDate && (
              <div
                className={cn(
                  'flex items-center gap-1 shrink-0 font-medium',
                  isOverdue
                    ? 'text-rose-600 dark:text-rose-400 font-semibold'
                    : 'text-muted-foreground'
                )}
                title={isOverdue ? 'Deal is past expected close date!' : 'Expected close date'}
              >
                {isOverdue ? (
                  <AlertCircle className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
                ) : (
                  <Calendar className="h-3 w-3" />
                )}
                <span>{formattedCloseDate}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
