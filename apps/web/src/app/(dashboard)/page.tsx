import { redirect } from 'next/navigation';

// /dashboard → redirect tạm về contacts (Sprint 2)
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900">Chào mừng đến với FuviAI CRM</h2>
        <p className="mt-2 text-gray-600">
          Hệ thống đang trong quá trình phát triển. Sprint 1 (Auth & Multi-tenancy) đã hoàn thành.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Contacts', value: '0', desc: 'Chưa có dữ liệu' },
          { label: 'Deals', value: '0', desc: 'Chưa có dữ liệu' },
          { label: 'Doanh thu', value: '0đ', desc: 'Chưa có dữ liệu' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
