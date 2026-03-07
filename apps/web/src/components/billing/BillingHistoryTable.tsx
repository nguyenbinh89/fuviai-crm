import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { BillingRecord, PaymentStatus } from '@/hooks/useBilling';

const STATUS_CONFIG: Record<PaymentStatus, { label: string; className: string }> = {
  PENDING:  { label: 'Chờ',         className: 'bg-yellow-100 text-yellow-700' },
  PAID:     { label: 'Đã thanh toán', className: 'bg-green-100 text-green-700' },
  FAILED:   { label: 'Thất bại',    className: 'bg-red-100 text-red-700' },
  REFUNDED: { label: 'Đã hoàn',     className: 'bg-gray-100 text-gray-600' },
};

const CYCLE_LABEL: Record<string, string> = { MONTHLY: 'Tháng', YEARLY: 'Năm' };

interface BillingHistoryTableProps {
  records: BillingRecord[];
}

export function BillingHistoryTable({ records }: BillingHistoryTableProps) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-gray-400">
        <p className="text-3xl mb-2">🧾</p>
        <p className="text-sm">Chưa có lịch sử thanh toán</p>
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mô tả</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chu kỳ</th>
          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Số tiền</th>
          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
          <th className="px-4 py-3" />
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {records.map((record) => {
          const statusCfg = STATUS_CONFIG[record.status];
          return (
            <tr key={record.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-600">
                {format(new Date(record.createdAt), 'dd/MM/yyyy', { locale: vi })}
              </td>
              <td className="px-4 py-3 text-sm text-gray-800">{record.description ?? `Gói ${record.plan}`}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{CYCLE_LABEL[record.billingCycle]}</td>
              <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                {record.amount > 0
                  ? `${(record.amount / 1_000).toFixed(0)}K ₫`
                  : 'Miễn phí'}
              </td>
              <td className="px-4 py-3 text-center">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.className}`}>
                  {statusCfg.label}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                {record.invoiceUrl && (
                  <a
                    href={record.invoiceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Hóa đơn
                  </a>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
