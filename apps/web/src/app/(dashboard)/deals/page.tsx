'use client';

import { useState } from 'react';
import { usePipelines, useCreatePipeline } from '@/hooks/usePipelines';
import { useDealsKanban, useDealStats } from '@/hooks/useDeals';
import { useDealsStore } from '@/store/deals.store';
import { KanbanBoard } from '@/components/deals/KanbanBoard';
import { DealFilters } from '@/components/deals/DealFilters';
import { CreateDealDialog } from '@/components/deals/CreateDealDialog';
import { EditDealSheet } from '@/components/deals/EditDealSheet';
import type { Deal } from '@/hooks/useDeals';

// Định dạng tiền VND
function formatVND(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} tỷ`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)} triệu`;
  return new Intl.NumberFormat('vi-VN').format(value);
}

export default function DealsPage() {
  const { selectedPipelineId, setSelectedPipeline } = useDealsStore();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createDefaultStageId, setCreateDefaultStageId] = useState<string | undefined>();
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  const { data: pipelinesData, isLoading: pipelinesLoading } = usePipelines();
  const pipelines = pipelinesData?.data ?? [];

  // Chọn pipeline mặc định nếu chưa chọn
  const activePipelineId =
    selectedPipelineId ??
    pipelines.find((p) => p.isDefault)?.id ??
    pipelines[0]?.id ??
    null;

  const { data: kanbanData, isLoading: kanbanLoading } = useDealsKanban(activePipelineId);
  const { data: statsData } = useDealStats(activePipelineId ?? undefined);

  const { mutateAsync: createPipeline, isPending: creatingPipeline } = useCreatePipeline();

  const stages = kanbanData?.data?.stages ?? [];
  const stats = statsData?.data;

  const handleCreateDefaultPipeline = async () => {
    await createPipeline({ name: 'Quy trình bán hàng', isDefault: true });
  };

  const handleAddDeal = (stageId: string) => {
    setCreateDefaultStageId(stageId);
    setCreateDialogOpen(true);
  };

  if (pipelinesLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">Đang tải...</div>
    );
  }

  // Empty state — chưa có pipeline
  if (pipelines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-2xl mb-3">📋</p>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Chưa có pipeline bán hàng</h2>
        <p className="text-sm text-gray-500 mb-6">
          Tạo pipeline đầu tiên để bắt đầu quản lý deals
        </p>
        <button
          onClick={handleCreateDefaultPipeline}
          disabled={creatingPipeline}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {creatingPipeline ? 'Đang tạo...' : 'Tạo pipeline mặc định'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Deals</h1>
        <button
          onClick={() => {
            setCreateDefaultStageId(undefined);
            setCreateDialogOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Tạo deal mới
        </button>
      </div>

      {/* Pipeline selector */}
      {pipelines.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Pipeline:</span>
          <div className="flex gap-1 flex-wrap">
            {pipelines.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPipeline(p.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  activePipelineId === p.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Deals đang mở</p>
            <p className="text-2xl font-bold text-gray-900">{stats.byStatus.OPEN?.count ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tổng giá trị</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatVND(stats.totalValue)}₫
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Win rate</p>
            <p className="text-2xl font-bold text-green-600">{stats.winRate}%</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <DealFilters stages={stages} />

      {/* Kanban board */}
      {kanbanLoading ? (
        <div className="flex items-center justify-center h-48 text-gray-500">
          Đang tải board...
        </div>
      ) : (
        <KanbanBoard
          stages={stages}
          onAddDeal={handleAddDeal}
          onEditDeal={(deal) => setEditingDeal(deal)}
        />
      )}

      {/* Create dialog */}
      {activePipelineId && (
        <CreateDealDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          pipelineId={activePipelineId}
          defaultStageId={createDefaultStageId}
        />
      )}

      {/* Edit sheet */}
      {editingDeal && (
        <EditDealSheet
          deal={editingDeal}
          open={!!editingDeal}
          onClose={() => setEditingDeal(null)}
        />
      )}
    </div>
  );
}
