'use client';

import { useState } from 'react';
import { useUpdateDeal, type Deal, type CreateDealInput } from '@/hooks/useDeals';
import { DealForm } from './DealForm';

interface EditDealSheetProps {
  deal: Deal;
  open: boolean;
  onClose: () => void;
}

export function EditDealSheet({ deal, open, onClose }: EditDealSheetProps) {
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync: updateDeal, isPending } = useUpdateDeal();

  if (!open) return null;

  const handleSubmit = async (data: CreateDealInput) => {
    setError(null);
    try {
      await updateDeal({ id: deal.id, data });
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setError(e.response?.data?.error?.message ?? 'Cập nhật thất bại');
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={() => !isPending && onClose()}
      />

      {/* Slide-over panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Chỉnh sửa deal</h2>
          <button
            onClick={onClose}
            disabled={isPending}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <DealForm
            pipelineId={deal.pipelineId}
            defaultStageId={deal.stageId}
            initialData={deal}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isSubmitting={isPending}
          />
        </div>
      </div>
    </>
  );
}
