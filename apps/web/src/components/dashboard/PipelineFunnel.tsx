'use client';

import type { PipelineFunnelStage } from '@/hooks/useDashboard';

interface PipelineFunnelProps {
  data: PipelineFunnelStage[];
}

export function PipelineFunnel({ data }: PipelineFunnelProps) {
  const maxDeals = Math.max(...data.map((s) => s.dealCount), 1);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Pipeline Funnel</h3>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
          Chưa có dữ liệu pipeline
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((stage, i) => {
            const widthPct = Math.round((stage.dealCount / maxDeals) * 100);
            return (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">{stage.stageName}</span>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{stage.dealCount} deals</span>
                    <span className="text-gray-300">|</span>
                    <span>{(stage.totalValue / 1_000_000).toFixed(0)}M ₫</span>
                  </div>
                </div>
                <div className="h-7 bg-gray-100 rounded-md overflow-hidden">
                  <div
                    className="h-full rounded-md transition-all duration-500 flex items-center px-2"
                    style={{
                      width: `${widthPct || 2}%`,
                      backgroundColor: stage.stageColor || '#3b82f6',
                      opacity: 0.8,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
