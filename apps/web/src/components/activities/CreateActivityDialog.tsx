'use client';

import { useState } from 'react';
import { useCreateActivity } from '@/hooks/useActivities';
import { ActivityForm } from './ActivityForm';

interface CreateActivityDialogProps {
  contextContactId?: string;
  contextDealId?: string;
}

export function CreateActivityDialog({ contextContactId, contextDealId }: CreateActivityDialogProps) {
  const [open, setOpen] = useState(false);
  const create = useCreateActivity();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
      >
        + Thêm hoạt động
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

          {/* Dialog */}
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Tạo hoạt động mới</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <ActivityForm
              contextContactId={contextContactId}
              contextDealId={contextDealId}
              isLoading={create.isPending}
              onSubmit={(data) => {
                create.mutate(data, {
                  onSuccess: () => setOpen(false),
                });
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
