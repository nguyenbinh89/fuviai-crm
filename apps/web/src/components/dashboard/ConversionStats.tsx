import type { ConversionStats } from '@/hooks/useDashboard';

interface ConversionStatsProps {
  data: ConversionStats;
}

export function ConversionStatsWidget({ data }: ConversionStatsProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Tỷ lệ chuyển đổi</h3>

      {/* Funnel visual */}
      <div className="space-y-2 mb-4">
        <ConvBar label="Contacts" value={data.totalContacts} max={data.totalContacts} color="bg-blue-400" />
        <ConvBar label="Deals" value={data.totalDeals} max={data.totalContacts} color="bg-indigo-400" />
        <ConvBar label="Đang mở" value={data.openDeals} max={data.totalContacts} color="bg-yellow-400" />
        <ConvBar label="Thắng" value={data.wonDeals} max={data.totalContacts} color="bg-green-400" />
        <ConvBar label="Thua" value={data.lostDeals} max={data.totalContacts} color="bg-red-300" />
      </div>

      {/* Key rates */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
        <div className="text-center">
          <p className="text-xl font-bold text-green-600">{data.winRate}%</p>
          <p className="text-xs text-gray-500">Win Rate</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-blue-600">{data.contactToDeal}%</p>
          <p className="text-xs text-gray-500">Contact → Deal</p>
        </div>
      </div>
    </div>
  );
}

function ConvBar({ label, value, max, color }: {
  label: string; value: number; max: number; color: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-0.5">
        <span>{label}</span>
        <span>{value.toLocaleString('vi-VN')}</span>
      </div>
      <div className="h-5 bg-gray-100 rounded overflow-hidden">
        <div
          className={`h-full ${color} rounded transition-all duration-500 flex items-center justify-end pr-1.5`}
          style={{ width: `${pct || 1}%` }}
        >
          {pct > 10 && <span className="text-white text-xs font-medium">{pct}%</span>}
        </div>
      </div>
    </div>
  );
}
