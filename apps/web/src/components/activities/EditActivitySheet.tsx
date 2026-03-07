'use client';

import { useUpdateActivity } from '@/hooks/useActivities';
import type { Activity } from '@/hooks/useActivities';
import { ActivityForm } from './ActivityForm';

interface EditActivitySheetProps {
  activity: Activity | null;
  onClose: () => void;
}

export function EditActivitySheet({ activity, onClose }: EditActivitySheetProps) {
  const update = useUpdateActivity(activity?.id ?? '');

  if (!activity) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Sheet từ phải */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Chỉnh sửa hoạt động</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <ActivityForm
            defaultValues={activity}
            isLoading={update.isPending}
            onSubmit={(data) => {
              update.mutate(data, { onSuccess: onClose });
            }}
          />
        </div>
      </div>
    </>
  );
}
