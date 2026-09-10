'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd';
import { DealCard } from '@/components/pipeline/deal-card';
import { formatINR, cn } from '@/lib/utils';
import {
  STAGE_CONFIG,
  STAGES_ORDER,
  type DealData,
  type PipelineStageType,
} from '@/types/deal';

interface PipelineBoardViewProps {
  deals: DealData[];
  onStageChange: (deal: DealData, targetStage: PipelineStageType) => void;
  onEditDeal: (deal: DealData) => void;
  onDeleteDeal: (dealId: string) => void;
  userRole?: string;
  currentUserId?: string;
}

export function PipelineBoardView({
  deals,
  onStageChange,
  onEditDeal,
  onDeleteDeal,
  userRole,
  currentUserId,
}: PipelineBoardViewProps) {
  // Prevent SSR hydration mismatch with dnd
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Group deals by stage
  const dealsByStage = STAGES_ORDER.reduce<Record<PipelineStageType, DealData[]>>(
    (acc, stage) => {
      acc[stage] = deals.filter((d) => d.stage === stage);
      return acc;
    },
    {
      NEW: [],
      QUALIFICATION: [],
      PROPOSAL: [],
      NEGOTIATION: [],
      WON: [],
      LOST: [],
    }
  );

  function handleDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceStage = source.droppableId as PipelineStageType;
    const targetStage = destination.droppableId as PipelineStageType;

    if (sourceStage === targetStage) {
      // Reordering within the same column (optional visual only, or no-op)
      return;
    }

    const deal = deals.find((d) => d.id === draggableId);
    if (!deal) return;

    onStageChange(deal, targetStage);
  }

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 min-h-[500px]">
        {STAGES_ORDER.map((stage) => (
          <div
            key={stage}
            className="rounded-xl border border-border/60 bg-muted/20 p-3 flex flex-col animate-pulse"
          >
              <div className="h-6 bg-muted rounded w-2/3 mb-2" />
              <div className="h-4 bg-muted/60 rounded w-1/2 mb-4" />
              <div className="space-y-3">
                <div className="h-24 bg-card rounded-lg border border-border/40" />
                <div className="h-24 bg-card rounded-lg border border-border/40" />
              </div>
            </div>
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 items-start overflow-x-auto pb-4">
        {STAGES_ORDER.map((stage) => {
          const config = STAGE_CONFIG[stage];
          const stageDeals = dealsByStage[stage];
          const totalValue = stageDeals.reduce((sum, d) => sum + d.value, 0);

          return (
            <div
              key={stage}
              className={cn(
                'flex flex-col rounded-xl border p-3 min-w-[260px] xl:min-w-0 transition-colors',
                config.columnBorder,
                config.columnBg
              )}
            >
              {/* Column Header */}
              <div className="mb-3">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'h-2.5 w-2.5 rounded-full',
                        config.indicatorColor
                      )}
                    />
                    <h3 className="text-sm font-semibold text-foreground">
                      {config.label}
                    </h3>
                  </div>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-semibold border',
                      config.badgeBg,
                      config.badgeText,
                      config.badgeBorder
                    )}
                  >
                    {stageDeals.length}
                  </span>
                </div>

                {/* Column Value Sum */}
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Total Value</span>
                  <span className="font-semibold text-foreground">
                    {formatINR(totalValue)}
                  </span>
                </div>
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={stage}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'flex flex-col gap-2.5 min-h-[400px] rounded-lg p-1 transition-colors',
                      snapshot.isDraggingOver
                        ? 'bg-primary/5 ring-1 ring-dashed ring-primary/40'
                        : ''
                    )}
                  >
                    {stageDeals.map((deal, index) => (
                      <DealCard
                        key={deal.id}
                        deal={deal}
                        index={index}
                        onEdit={onEditDeal}
                        onDelete={onDeleteDeal}
                        onStageChange={onStageChange}
                        userRole={userRole}
                        currentUserId={currentUserId}
                      />
                    ))}
                    {provided.placeholder}

                    {/* Empty State */}
                    {stageDeals.length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-border/50 rounded-lg p-6 text-center text-xs text-muted-foreground/70">
                        <span>No deals in this stage</span>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
