'use client';

import { useState } from 'react';
import { useCreateDeal, type CreateDealInput } from '@/hooks/useDeals';
import { DealForm } from './DealForm';

interface CreateDealDialogProps {
  open: boolean;
  onClose: () => void;
  pipelineId: string;
  defaultStageId?: string;
}

export function CreateDealDialog({
  open,
  onClose,
  pipelineId,
  defaultStageId,
}: CreateDealDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync: createDeal, isPending } = useCreateDeal();

  if (!open) return null;

  const handleSubmit = async (data: CreateDealInput) => {
    setError(null);
    try {
      await createDeal(data);
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setError(e.response?.data?.error?.message ?? 'Tạo deal thất bại');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => !isPending && onClose()} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Tạo deal mới</h2>
          <button
            onClick={onClose}
            disabled={isPending}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <DealForm
          pipelineId={pipelineId}
          defaultStageId={defaultStageId}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isSubmitting={isPending}
        />
      </div>
    </div>
  );
}
