'use client';

import { useState } from 'react';
import {
  useAutomations,
  useAutomationStats,
  useCreateWorkflow,
  useUpdateWorkflow,
  useActivateWorkflow,
  useDeactivateWorkflow,
  useTriggerWorkflow,
  useDeleteWorkflow,
} from '@/hooks/useAutomations';
import type { Workflow, TriggerType, WorkflowStatus, WorkflowAction } from '@/hooks/useAutomations';
import { WorkflowCard } from '@/components/automations/WorkflowCard';
import { WorkflowForm } from '@/components/automations/WorkflowForm';
import { RunHistoryPanel } from '@/components/automations/RunHistoryPanel';

const STATUS_FILTERS: { label: string; value: WorkflowStatus | undefined }[] = [
  { label: 'Tất cả', value: undefined },
  { label: 'Đang hoạt động', value: 'ACTIVE' },
  { label: 'Tạm dừng', value: 'INACTIVE' },
  { label: 'Nháp', value: 'DRAFT' },
];

export default function AutomationsPage() {
  const [statusFilter, setStatusFilter] = useState<WorkflowStatus | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [viewRunsWorkflow, setViewRunsWorkflow] = useState<Workflow | null>(null);

  const { data: stats } = useAutomationStats();
  const { data: workflowsData, isLoading } = useAutomations({ status: statusFilter });
  const workflows = workflowsData?.data ?? [];

  const { mutate: create, isPending: creating } = useCreateWorkflow();
  const { mutate: activate, isPending: activating } = useActivateWorkflow();
  const { mutate: deactivate, isPending: deactivating } = useDeactivateWorkflow();
  const { mutate: trigger } = useTriggerWorkflow();
  const { mutate: deleteWorkflow } = useDeleteWorkflow();

  // Update hook — cần workflowId động, dùng wrapper
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const updateHook = useUpdateWorkflow(updatingId ?? '');

  const handleCreate = (data: {
    name: string;
    description?: string;
    triggerType: TriggerType;
    actions: WorkflowAction[];
  }) => {
    create(data, {
      onSuccess: () => setShowForm(false),
    });
  };

  const handleUpdate = (data: {
    name: string;
    description?: string;
    triggerType: TriggerType;
    actions: WorkflowAction[];
  }) => {
    if (!editingWorkflow) return;
    setUpdatingId(editingWorkflow.id);
    updateHook.mutate(data, {
      onSuccess: () => setEditingWorkflow(null),
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa workflow này?')) return;
    deleteWorkflow(id);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Automation Engine</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tự động hóa quy trình bán hàng và chăm sóc khách hàng</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Tạo Workflow
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Tổng workflows', value: stats?.total ?? 0, color: 'text-gray-700' },
          { label: 'Đang hoạt động', value: stats?.active ?? 0, color: 'text-green-600' },
          { label: 'Tạm dừng', value: stats?.inactive ?? 0, color: 'text-gray-500' },
          { label: 'Nháp', value: stats?.draft ?? 0, color: 'text-yellow-600' },
          { label: 'Lần chạy hôm nay', value: stats?.runsToday ?? 0, color: 'text-blue-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setStatusFilter(f.value)}
            className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
              statusFilter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-400 self-center">
          {workflows.length} workflows
        </span>
      </div>

      {/* Workflow grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-4xl mb-3">⚡</p>
          <h3 className="text-base font-semibold text-gray-700 mb-1">Chưa có workflow nào</h3>
          <p className="text-sm text-gray-400 max-w-xs mb-4">
            Tạo workflow đầu tiên để tự động hóa quy trình bán hàng
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            + Tạo Workflow đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {workflows.map((wf) => (
            <WorkflowCard
              key={wf.id}
              workflow={wf}
              onActivate={(id) => activate(id)}
              onDeactivate={(id) => deactivate(id)}
              onTrigger={(id) => trigger({ id })}
              onEdit={(w) => setEditingWorkflow(w)}
              onDelete={handleDelete}
              onViewRuns={(w) => setViewRunsWorkflow(w)}
              isToggling={activating || deactivating}
            />
          ))}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <WorkflowForm
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
          isPending={creating}
        />
      )}

      {/* Edit form */}
      {editingWorkflow && (
        <WorkflowForm
          initial={editingWorkflow}
          onSubmit={handleUpdate}
          onClose={() => setEditingWorkflow(null)}
          isPending={updateHook.isPending}
        />
      )}

      {/* Run history panel */}
      {viewRunsWorkflow && (
        <RunHistoryPanel
          workflow={viewRunsWorkflow}
          onClose={() => setViewRunsWorkflow(null)}
        />
      )}
    </div>
  );
}
