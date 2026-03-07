'use client';

import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { Workflow } from '@/hooks/useAutomations';
import { WorkflowStatusBadge } from './WorkflowStatusBadge';
import { TriggerBadge } from './TriggerBadge';
import { ActionLabel } from './ActionLabel';

interface WorkflowCardProps {
  workflow: Workflow;
  onActivate: (id: string) => void;
  onDeactivate: (id: string) => void;
  onTrigger: (id: string) => void;
  onEdit: (workflow: Workflow) => void;
  onDelete: (id: string) => void;
  onViewRuns: (workflow: Workflow) => void;
  isToggling: boolean;
}

export function WorkflowCard({
  workflow,
  onActivate,
  onDeactivate,
  onTrigger,
  onEdit,
  onDelete,
  onViewRuns,
  isToggling,
}: WorkflowCardProps) {
  const actions = workflow.actions ?? [];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{workflow.name}</h3>
            <WorkflowStatusBadge status={workflow.status} />
          </div>
          {workflow.description && (
            <p className="text-xs text-gray-500 line-clamp-1">{workflow.description}</p>
          )}
        </div>

        {/* Toggle switch */}
        <button
          onClick={() =>
            workflow.status === 'ACTIVE' ? onDeactivate(workflow.id) : onActivate(workflow.id)
          }
          disabled={isToggling}
          className={`shrink-0 w-11 h-6 rounded-full transition-colors relative ${
            workflow.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-300'
          } disabled:opacity-50`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              workflow.status === 'ACTIVE' ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Trigger */}
      <div className="mb-3">
        <p className="text-xs text-gray-400 mb-1">Trigger</p>
        <TriggerBadge trigger={workflow.triggerType} />
      </div>

      {/* Actions list */}
      {actions.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-400 mb-1">Hành động ({actions.length})</p>
          <div className="flex flex-wrap gap-1">
            {actions.slice(0, 4).map((action, i) => (
              <span
                key={i}
                className="bg-gray-50 border border-gray-100 rounded-md px-2 py-0.5"
              >
                <ActionLabel type={action.type} />
              </span>
            ))}
            {actions.length > 4 && (
              <span className="text-xs text-gray-400 px-2 py-0.5">+{actions.length - 4}</span>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>▶ {workflow.runCount} lần chạy</span>
          {workflow.lastRunAt && (
            <span>
              Lần cuối: {formatDistanceToNow(new Date(workflow.lastRunAt), { addSuffix: true, locale: vi })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {workflow.triggerType === 'MANUAL' && workflow.status === 'ACTIVE' && (
            <button
              onClick={() => onTrigger(workflow.id)}
              className="text-xs text-green-600 hover:text-green-700 px-2 py-1 rounded hover:bg-green-50"
            >
              ▶ Chạy
            </button>
          )}
          <button
            onClick={() => onViewRuns(workflow)}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
          >
            Lịch sử
          </button>
          <button
            onClick={() => onEdit(workflow)}
            className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50"
          >
            Sửa
          </button>
          <button
            onClick={() => onDelete(workflow.id)}
            className="text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}
