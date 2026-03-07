'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useDeal, useMoveDeal, useDeleteDeal } from '@/hooks/useDeals';
import { DealStatusBadge } from '@/components/deals/DealStatusBadge';
import { EditDealSheet } from '@/components/deals/EditDealSheet';
import { useAuthStore } from '@/store/auth.store';

// Định dạng tiền tệ
function formatCurrency(value: number | null, currency: string): string {
  if (value === null) return '—';
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
}

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useDeal(id);
  const { mutateAsync: moveDeal, isPending: isMoving } = useMoveDeal();
  const { mutateAsync: deleteDeal, isPending: isDeleting } = useDeleteDeal();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deal = data?.data;
  const canDelete = user?.role === 'OWNER' || user?.role === 'ADMIN';

  const handleMove = async (stageId: string) => {
    if (!deal) return;
    await moveDeal({ id: deal.id, stageId });
  };

  const handleDelete = async () => {
    if (!deal) return;
    setDeleteError(null);
    try {
      await deleteDeal(deal.id);
      router.push('/deals');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setDeleteError(e.response?.data?.error?.message ?? 'Xóa thất bại');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">Đang tải...</div>
    );
  }

  if (!deal) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy deal.</p>
        <button
          onClick={() => router.push('/deals')}
          className="mt-4 text-blue-600 hover:text-blue-800 text-sm"
        >
          ← Quay lại danh sách
        </button>
      </div>
    );
  }

  const stages = deal.pipeline?.stages ?? [];

  return (
    <div className="max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500">
        <button onClick={() => router.push('/deals')} className="hover:text-gray-700">
          Deals
        </button>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{deal.title}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 mb-2">{deal.title}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <DealStatusBadge status={deal.status} />
              {deal.value !== null && (
                <span className="text-lg font-semibold text-gray-700">
                  {formatCurrency(deal.value, deal.currency)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setEditOpen(true)}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Chỉnh sửa
            </button>
            {canDelete && (
              <button
                onClick={() => setDeleteOpen(true)}
                className="border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
              >
                Xóa
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline stage progress */}
      {stages.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Tiến độ pipeline</h2>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {stages.map((stage, idx) => {
              const isCurrent = stage.id === deal.stageId;
              const isPast = stages.findIndex((s) => s.id === deal.stageId) > idx;

              return (
                <div key={stage.id} className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => !isCurrent && handleMove(stage.id)}
                    disabled={isCurrent || isMoving}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isCurrent
                        ? 'text-white'
                        : isPast
                        ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    } disabled:cursor-default`}
                    style={isCurrent ? { backgroundColor: stage.color } : undefined}
                  >
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${isCurrent ? 'bg-white' : ''}`}
                      style={!isCurrent ? { backgroundColor: stage.color } : undefined}
                    />
                    {stage.name}
                  </button>
                  {idx < stages.length - 1 && (
                    <span className="text-gray-300">→</span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Click vào stage để di chuyển deal
          </p>
        </div>
      )}

      {/* Info grid */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Thông tin deal</h2>
        <div className="grid grid-cols-2 gap-4">
          <InfoRow
            label="Contact"
            value={
              deal.contact
                ? [deal.contact.firstName, deal.contact.lastName].filter(Boolean).join(' ')
                : null
            }
          />
          <InfoRow
            label="Phụ trách"
            value={
              deal.assignedTo
                ? [deal.assignedTo.firstName, deal.assignedTo.lastName].filter(Boolean).join(' ')
                : null
            }
          />
          <InfoRow
            label="Ngày dự kiến chốt"
            value={
              deal.expectedCloseDate
                ? format(new Date(deal.expectedCloseDate), 'dd/MM/yyyy', { locale: vi })
                : null
            }
          />
          <InfoRow
            label="Pipeline"
            value={deal.pipeline?.name ?? null}
          />
          <InfoRow
            label="Stage hiện tại"
            value={deal.stage?.name ?? null}
          />
          <InfoRow
            label="Ngày tạo"
            value={format(new Date(deal.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
          />
        </div>
      </div>

      {/* Notes */}
      {deal.notes && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Ghi chú</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{deal.notes}</p>
        </div>
      )}

      {/* Activities placeholder */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 opacity-60">
        <h2 className="text-base font-semibold text-gray-900 mb-2">Activities</h2>
        <p className="text-sm text-gray-400">Sẽ hiển thị ở Sprint 4 (Activity & Calendar)</p>
      </div>

      {/* Edit sheet */}
      {editOpen && (
        <EditDealSheet deal={deal} open={editOpen} onClose={() => setEditOpen(false)} />
      )}

      {/* Delete confirm */}
      {deleteOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !isDeleting && setDeleteOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Xác nhận xóa</h3>
            <p className="text-sm text-gray-600 mb-4">
              Bạn có chắc muốn xóa deal <strong>{deal.title}</strong>?
            </p>
            {deleteError && (
              <div className="mb-3 bg-red-50 border border-red-200 rounded px-3 py-2 text-sm text-red-700">
                {deleteError}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteOpen(false)}
                disabled={isDeleting}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">
        {value ?? <span className="text-gray-400">—</span>}
      </dd>
    </div>
  );
}
