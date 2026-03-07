interface KpiCardProps {
  label: string;
  value: string | number;
  icon: string;
  growth?: number;      // % tăng trưởng so với tháng trước
  sub?: string;         // Thông tin phụ
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'gray';
}

const COLOR_MAP = {
  blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',   value: 'text-blue-700' },
  green:  { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-600',  value: 'text-green-700' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', value: 'text-purple-700' },
  orange: { bg: 'bg-orange-50', icon: 'bg-orange-100 text-orange-600', value: 'text-orange-700' },
  gray:   { bg: 'bg-gray-50',   icon: 'bg-gray-100 text-gray-600',   value: 'text-gray-700' },
};

export function KpiCard({ label, value, icon, growth, sub, color = 'blue' }: KpiCardProps) {
  const c = COLOR_MAP[color];

  return (
    <div className={`${c.bg} rounded-xl p-5 border border-white shadow-sm`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${c.icon} rounded-lg flex items-center justify-center text-lg`}>
          {icon}
        </div>
        {growth !== undefined && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            growth > 0
              ? 'bg-green-100 text-green-700'
              : growth < 0
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-500'
          }`}>
            {growth > 0 ? '↑' : growth < 0 ? '↓' : '—'} {Math.abs(growth)}%
          </span>
        )}
      </div>

      <p className={`text-2xl font-bold ${c.value} mb-0.5`}>{value}</p>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
