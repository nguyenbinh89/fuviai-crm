'use client';

import { useState } from 'react';
import type { TriggerType, WorkflowAction, Workflow } from '@/hooks/useAutomations';
import { TRIGGER_CONFIG } from './TriggerBadge';
import { ActionBuilder } from './ActionBuilder';

const TRIGGER_TYPES = Object.entries(TRIGGER_CONFIG) as [TriggerType, (typeof TRIGGER_CONFIG)[TriggerType]][];

interface WorkflowFormProps {
  initial?: Workflow;
  onSubmit: (data: {
    name: string;
    description?: string;
    triggerType: TriggerType;
    actions: WorkflowAction[];
  }) => void;
  onClose: () => void;
  isPending: boolean;
}

export function WorkflowForm({ initial, onSubmit, onClose, isPending }: WorkflowFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [triggerType, setTriggerType] = useState<TriggerType>(initial?.triggerType ?? 'CONTACT_CREATED');
  const [actions, setActions] = useState<WorkflowAction[]>(initial?.actions ?? []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), description: description.trim() || undefined, triggerType, actions });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-xl mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">
            {initial ? 'Chỉnh sửa Workflow' : 'Tạo Workflow mới'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Tên */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên workflow <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Chào mừng contact mới"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về mục đích workflow..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Trigger */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trigger — Sự kiện kích hoạt
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TRIGGER_TYPES.map(([value, cfg]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTriggerType(value)}
                  className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                    triggerType === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <span className="block font-medium">{cfg.icon} {cfg.label}</span>
                  <span className="block text-gray-400 mt-0.5">{cfg.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hành động thực thi
            </label>
            <ActionBuilder actions={actions} onChange={setActions} />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={!name.trim() || isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? 'Đang lưu...' : initial ? 'Cập nhật' : 'Tạo Workflow'}
          </button>
        </div>
      </div>
    </div>
  );
}
