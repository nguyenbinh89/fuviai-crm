import Link from 'next/link';
import type { TopDeal } from '@/hooks/useDashboard';

interface TopDealsWidgetProps {
  deals: TopDeal[];
}

export function TopDealsWidget({ deals }: TopDealsWidgetProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Top Deals đang mở</h3>
        <Link href="/deals" className="text-xs text-blue-600 hover:underline">Xem tất cả</Link>
      </div>

      {deals.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Chưa có deals nào</p>
      ) : (
        <div className="space-y-3">
          {deals.map((deal, i) => (
            <Link
              key={deal.id}
              href={`/deals/${deal.id}`}
              className="flex items-center gap-3 hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
            >
              {/* Rank */}
              <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                i === 0 ? 'bg-yellow-100 text-yellow-700' :
                i === 1 ? 'bg-gray-100 text-gray-600' :
                i === 2 ? 'bg-orange-100 text-orange-700' :
                'bg-gray-50 text-gray-400'
              }`}>
                {i + 1}
              </span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{deal.title}</p>
                <p className="text-xs text-gray-400 truncate">{deal.contact} · {deal.stage}</p>
              </div>

              {/* Value */}
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-gray-900">
                  {deal.value >= 1_000_000
                    ? `${(deal.value / 1_000_000).toFixed(0)}M`
                    : deal.value.toLocaleString('vi-VN')}₫
                </p>
                <p className="text-xs text-gray-400">{deal.probability}%</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
