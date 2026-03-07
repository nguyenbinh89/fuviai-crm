'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { ActivitySummaryRow } from '@/hooks/useDashboard';

const TYPE_LABELS: Record<string, string> = {
  CALL: '📞 Gọi',
  EMAIL: '✉️ Email',
  MEETING: '🤝 Họp',
  TASK: '✅ Task',
};

interface ActivitySummaryChartProps {
  data: ActivitySummaryRow[];
}

export function ActivitySummaryChart({ data }: ActivitySummaryChartProps) {
  const chartData = data.map((row) => ({
    name: TYPE_LABELS[row.type] ?? row.type,
    'Hoàn thành': row.DONE,
    'Đang chờ': row.PENDING,
    'Hủy': row.CANCELLED,
  }));

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Hoạt động tháng này</h3>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
          Chưa có hoạt động nào tháng này
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Hoàn thành" fill="#22c55e" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Đang chờ" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Hủy" fill="#e5e7eb" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
