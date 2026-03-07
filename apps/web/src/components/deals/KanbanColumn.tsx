'use client';

import { useState } from 'react';
import type { KanbanStage, Deal } from '@/hooks/useDeals';
import { DealCard } from './DealCard';

// Định dạng tiền tệ ngắn gọn
function formatShortCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(0)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }
  return String(value);
}

interface KanbanColumnProps {
  stage: KanbanStage;
  onDrop: (stageId: string) => void;
  onAddDeal?: (stageId: string) => void;
  onEditDeal?: (deal: Deal) => void;
}

export function KanbanColumn({ stage, onDrop, onAddDeal, onEditDeal }: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const totalValue = stage.deals.reduce((sum, d) => sum + (d.value ?? 0), 0);

  return (
    <div className="flex-shrink-0 w-72">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Color dot */}
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: stage.color }}
          />
          <h3 className="text-sm font-semibold text-gray-800 truncate max-w-[140px]">
            {stage.name}
          </h3>
          <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
            {stage.deals.length}
          </span>
        </div>
        {totalValue > 0 && (
          <span className="text-xs text-gray-500">{formatShortCurrency(totalValue)}₫</span>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={() => {
          setIsDragOver(false);
          onDrop(stage.id);
        }}
        className={`min-h-[400px] rounded-xl p-2 space-y-2 transition-colors ${
          isDragOver
            ? 'bg-blue-50 border-2 border-blue-300 border-dashed'
            : 'bg-gray-50 border-2 border-transparent'
        }`}
      >
        {stage.deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} onEdit={onEditDeal} />
        ))}

        {/* Add deal button */}
        {onAddDeal && (
          <button
            onClick={() => onAddDeal(stage.id)}
            className="w-full text-xs text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg py-2 px-3 flex items-center gap-1.5 transition-colors border border-dashed border-gray-200 hover:border-gray-300"
          >
            <span>+</span> Thêm deal
          </button>
        )}
      </div>
    </div>
  );
}
