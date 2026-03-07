'use client';

import { useState } from 'react';
import { useScoreContact } from '@/hooks/useAI';
import type { LeadScoreResult } from '@/hooks/useAI';

interface LeadScoreBadgeProps {
  contactId: string;
  currentScore?: number | null;
}

const getScoreColor = (score: number) => {
  if (score >= 70) return { bg: 'bg-red-100', text: 'text-red-700', label: 'Hot 🔥' };
  if (score >= 40) return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Warm 🌤️' };
  return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Cold ❄️' };
};

export function LeadScoreBadge({ contactId, currentScore }: LeadScoreBadgeProps) {
  const [result, setResult] = useState<LeadScoreResult | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const { mutate: score, isPending } = useScoreContact();

  const displayScore = result?.score ?? currentScore;

  const handleScore = () => {
    score(contactId, { onSuccess: setResult });
  };

  if (displayScore == null) {
    return (
      <button
        onClick={handleScore}
        disabled={isPending}
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 border border-dashed border-gray-300 hover:border-blue-400 px-2 py-0.5 rounded transition-colors disabled:opacity-50"
      >
        {isPending ? '⟳ Đang chấm...' : '🎯 Chấm điểm AI'}
      </button>
    );
  }

  const colors = getScoreColor(displayScore);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => {
          if (result) setShowDetail(!showDetail);
          else handleScore();
        }}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text} hover:opacity-80 transition-opacity`}
      >
        {isPending ? '⟳' : `${displayScore}`}
        <span className="font-normal">{colors.label}</span>
        {!result && <span className="text-xs opacity-60 ml-1">↻</span>}
      </button>

      {/* Tooltip chi tiết */}
      {showDetail && result && (
        <div className="absolute top-full left-0 mt-2 z-10 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-72">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-800">Phân tích AI</span>
            <button onClick={() => setShowDetail(false)} className="text-gray-400 hover:text-gray-600">×</button>
          </div>

          {/* Score bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Lead Score</span>
              <span className={`font-bold ${colors.text}`}>{result.score}/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${result.score >= 70 ? 'bg-red-500' : result.score >= 40 ? 'bg-yellow-500' : 'bg-blue-400'}`}
                style={{ width: `${result.score}%` }}
              />
            </div>
          </div>

          {/* Reasoning */}
          <p className="text-xs text-gray-600 mb-3">{result.reasoning}</p>

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-700 mb-1.5">Gợi ý:</p>
              <ul className="space-y-1">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <span className="text-blue-500 mt-0.5">→</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Re-score */}
          <button
            onClick={() => { score(contactId, { onSuccess: setResult }); setShowDetail(false); }}
            disabled={isPending}
            className="mt-3 w-full text-xs text-center text-blue-600 hover:text-blue-700 border border-blue-200 rounded px-2 py-1 hover:bg-blue-50"
          >
            ↻ Chấm lại
          </button>
        </div>
      )}
    </div>
  );
}
