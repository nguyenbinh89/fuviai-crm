'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useContact, useDeleteContact } from '@/hooks/useContacts';
import { ContactStatusBadge } from '@/components/contacts/ContactStatusBadge';
import { EditContactSheet } from '@/components/contacts/EditContactSheet';
import { useAuthStore } from '@/store/auth.store';
import { useDeals } from '@/hooks/useDeals';
import { DealStatusBadge } from '@/components/deals/DealStatusBadge';
import { LeadScoreBadge } from '@/components/ai/LeadScoreBadge';
import { EmailWriterDialog } from '@/components/ai/EmailWriterDialog';
import { NotesList } from '@/components/activities/NotesList';
import { ActivityCard } from '@/components/activities/ActivityCard';
import { CreateActivityDialog } from '@/components/activities/CreateActivityDialog';
import { useActivities } from '@/hooks/useActivities';

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useContact(id);
  const { mutateAsync: deleteContact, isPending: isDeleting } = useDeleteContact();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const contact = data?.data;

  // Deals gắn với contact này
  const { data: dealsData } = useDeals({ contactId: id });
  const deals = dealsData?.data ?? [];

  // Activities gắn với contact
  const { data: activitiesData } = useActivities({ contactId: id, limit: 10 });
  const activities = activitiesData?.data ?? [];

  const handleDelete = async () => {
    if (!contact) return;
    setDeleteError(null);
    try {
      await deleteContact(contact.id);
      router.push('/contacts');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setDeleteError(e.response?.data?.error?.message ?? 'Xóa thất bại');
    }
  };

  const canDelete = user?.role === 'OWNER' || user?.role === 'ADMIN';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        Đang tải...
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy contact.</p>
        <button
          onClick={() => router.push('/contacts')}
          className="mt-4 text-blue-600 hover:text-blue-800 text-sm"
        >
          ← Quay lại danh sách
        </button>
      </div>
    );
  }

  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(' ');

  return (
    <div className="max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500">
        <button onClick={() => router.push('/contacts')} className="hover:text-gray-700">
          Contacts
        </button>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{fullName}</span>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar placeholder */}
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
              {contact.firstName[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{fullName}</h1>
              {contact.position && contact.company && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {contact.position} tại {contact.company}
                </p>
              )}
              <div className="mt-2">
                <ContactStatusBadge status={contact.status} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <EmailWriterDialog
              defaultContactName={fullName}
              defaultContactCompany={contact.company ?? ''}
              defaultContactPosition={contact.position ?? ''}
            />
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

      {/* Info card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Thông tin liên hệ</h2>
        <div className="grid grid-cols-2 gap-4">
          <InfoRow label="Email" value={contact.email} isLink={`mailto:${contact.email}`} />
          <InfoRow label="Điện thoại" value={contact.phone} isLink={`tel:${contact.phone}`} />
          <InfoRow label="Công ty" value={contact.company} />
          <InfoRow label="Chức vụ" value={contact.position} />
          <InfoRow label="Website" value={contact.website} isLink={contact.website ?? undefined} />
          <InfoRow label="Địa chỉ" value={contact.address} />
          <div>
            <p className="text-xs text-gray-500 mb-1">AI Score</p>
            <LeadScoreBadge contactId={contact.id} currentScore={contact.aiScore} />
          </div>
          <InfoRow
            label="Ngày tạo"
            value={format(new Date(contact.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
          />
        </div>
      </div>

      {/* Tags */}
      {contact.tags.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {contact.tags.map(({ tag }) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm"
                style={{ backgroundColor: tag.color + '20', color: tag.color }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Ghi chú tự do (Note raw field) */}
      {contact.notes && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Ghi chú</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{contact.notes}</p>
        </div>
      )}

      {/* Notes (Sprint 4) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <NotesList contactId={contact.id} />
      </div>

      {/* Deals section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Deals</h2>
          <a
            href="/deals"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Xem tất cả →
          </a>
        </div>
        {deals.length === 0 ? (
          <p className="text-sm text-gray-400">Chưa có deal nào.</p>
        ) : (
          <div className="space-y-2">
            {deals.map((deal) => (
              <a
                key={deal.id}
                href={`/deals/${deal.id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{deal.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{deal.stage?.name}</p>
                </div>
                <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                  {deal.value !== null && (
                    <span className="text-sm font-medium text-gray-700">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(deal.value)}
                    </span>
                  )}
                  <DealStatusBadge status={deal.status} />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Activities (Sprint 4) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">
            Hoạt động ({activities.length})
          </h2>
          <CreateActivityDialog contextContactId={contact.id} />
        </div>
        {activities.length === 0 ? (
          <p className="text-sm text-gray-400">Chưa có hoạt động nào.</p>
        ) : (
          <div className="space-y-3">
            {activities.map((act) => (
              <ActivityCard key={act.id} activity={act} />
            ))}
          </div>
        )}
      </div>

      {/* Edit sheet */}
      <EditContactSheet
        contact={contact}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />

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
              Bạn có chắc muốn xóa contact <strong>{fullName}</strong>?
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

// Helper component cho info rows
function InfoRow({
  label,
  value,
  isLink,
}: {
  label: string;
  value: string | null | undefined;
  isLink?: string;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">
        {value ? (
          isLink ? (
            <a
              href={isLink}
              className="text-blue-600 hover:text-blue-800 hover:underline"
              target={isLink.startsWith('http') ? '_blank' : undefined}
              rel="noreferrer"
            >
              {value}
            </a>
          ) : (
            value
          )
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </dd>
    </div>
  );
}
