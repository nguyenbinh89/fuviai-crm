'use client';

import type { KanbanStage, Deal } from '@/hooks/useDeals';
import { KanbanColumn } from './KanbanColumn';
import { useDealsStore } from '@/store/deals.store';
import { useMoveDeal } from '@/hooks/useDeals';

interface KanbanBoardProps {
  stages: KanbanStage[];
  onAddDeal?: (stageId: string) => void;
  onEditDeal?: (deal: Deal) => void;
}

export function KanbanBoard({ stages, onAddDeal, onEditDeal }: KanbanBoardProps) {
  const draggingDealId = useDealsStore((s) => s.draggingDealId);
  const { mutate: moveDeal } = useMoveDeal();

  const handleDrop = (targetStageId: string) => {
    if (!draggingDealId) return;

    // Tìm stage hiện tại của deal đang được kéo
    const currentStage = stages.find((s) => s.deals.some((d) => d.id === draggingDealId));
    if (!currentStage || currentStage.id === targetStageId) return;

    moveDeal({ id: draggingDealId, stageId: targetStageId });
  };

  if (stages.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>Pipeline chưa có stage nào.</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
      {stages.map((stage) => (
        <KanbanColumn
          key={stage.id}
          stage={stage}
          onDrop={handleDrop}
          onAddDeal={onAddDeal}
          onEditDeal={onEditDeal}
        />
      ))}
    </div>
  );
}
