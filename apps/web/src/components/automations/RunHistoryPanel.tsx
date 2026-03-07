'use client';

import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { Workflow, WorkflowRun } from '@/hooks/useAutomations';
import { useWorkflowRuns } from '@/hooks/useAutomations';
import { WorkflowRunStatusBadge } from './WorkflowStatusBadge';
import { ActionLabel } from './ActionLabel';

interface RunHistoryPanelProps {
  workflow: Workflow;
  onClose: () => void;
}

export function RunHistoryPanel({ workflow, onClose }: RunHistoryPanelProps) {
  const { data: runs = [], isLoading } = useWorkflowRuns(workflow.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Lịch sử chạy</h2>
            <p className="text-xs text-gray-500">{workflow.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : runs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <p className="text-3xl mb-2">▶</p>
              <p className="text-sm">Chưa có lịch sử chạy nào</p>
            </div>
          ) : (
            <div className="space-y-2">
              {runs.map((run) => (
                <RunRow key={run.id} run={run} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RunRow({ run }: { run: WorkflowRun }) {
  const results: any[] = Array.isArray(run.actionResults) ? run.actionResults : [];

  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <WorkflowRunStatusBadge status={run.status} />
          <span className="text-xs text-gray-500">
            {format(new Date(run.startedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
          </span>
        </div>
        {run.completedAt && (
          <span className="text-xs text-gray-400">
            {Math.round(
              (new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 1000,
            )}
            s
          </span>
        )}
      </div>

      {run.error && (
        <p className="text-xs text-red-500 mb-2 bg-red-50 px-2 py-1 rounded">{run.error}</p>
      )}

      {results.length > 0 && (
        <div className="space-y-1">
          {results.map((r: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className={r.status === 'SUCCESS' ? 'text-green-500' : 'text-red-500'}>
                {r.status === 'SUCCESS' ? '✓' : '✗'}
              </span>
              <ActionLabel type={r.type} />
              {r.error && <span className="text-red-400">— {r.error}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
