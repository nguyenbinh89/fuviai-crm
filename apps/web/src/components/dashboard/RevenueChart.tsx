'use client';

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { RevenueChartPoint } from '@/hooks/useDashboard';

interface RevenueChartProps {
  data: RevenueChartPoint[];
}

// Format số tiền VND
function formatVND(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toString();
}

export function RevenueChart({ data }: RevenueChartProps) {
  // Chỉ hiện 6 tháng gần nhất nhãn (tránh chữ chồng lên nhau)
  const tickCount = data.length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Doanh thu & Deals thắng (12 tháng)</h3>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            interval={tickCount > 8 ? 1 : 0}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="revenue"
            orientation="left"
            tickFormatter={formatVND}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="deals"
            orientation="right"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: number, name: string) =>
              name === 'revenue'
                ? [`${value.toLocaleString('vi-VN')} ₫`, 'Doanh thu']
                : [value, 'Deals thắng']
            }
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
          <Area
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#gradRevenue)"
            name="revenue"
          />
          <Bar
            yAxisId="deals"
            dataKey="deals"
            fill="#e0e7ff"
            name="deals"
            radius={[3, 3, 0, 0]}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
