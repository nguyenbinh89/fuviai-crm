'use client';

import { useState } from 'react';
import { useContacts, useContactStats, useDeleteContact } from '@/hooks/useContacts';
import type { Contact } from '@/hooks/useContacts';
import { useContactsStore } from '@/store/contacts.store';
import { ContactsTable } from '@/components/contacts/ContactsTable';
import { ContactFilters } from '@/components/contacts/ContactFilters';
import { CreateContactDialog } from '@/components/contacts/CreateContactDialog';
import { EditContactSheet } from '@/components/contacts/EditContactSheet';
import { ImportCsvDialog } from '@/components/contacts/ImportCsvDialog';
import { ContactStatusBadge } from '@/components/contacts/ContactStatusBadge';
import type { ContactStatus } from '@/hooks/useContacts';

const STATUS_LABELS: Record<ContactStatus, string> = {
  LEAD: 'Lead',
  PROSPECT: 'Prospect',
  CUSTOMER: 'Khách hàng',
  INACTIVE: 'Không hoạt động',
};

export default function ContactsPage() {
  const { filters, selectedIds, clearSelection } = useContactsStore();
  const { data, isLoading } = useContacts(filters);
  const { data: statsData } = useContactStats();
  const { mutateAsync: deleteContact } = useDeleteContact();

  const contacts = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const stats = statsData?.data;

  // Edit sheet state
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Delete confirm state
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deletingContact) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteContact(deletingContact.id);
      setDeletingContact(null);
      setToast('Đã xóa contact thành công');
      setTimeout(() => setToast(null), 3000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setDeleteError(e.response?.data?.error?.message ?? 'Xóa thất bại');
    } finally {
      setIsDeleting(false);
    }
  };

  // Export CSV
  const handleExport = () => {
    const a = document.createElement('a');
    a.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/contacts/export`;
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 text-green-800 border border-green-200 px-4 py-3 rounded-lg shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Contacts{' '}
            <span className="text-lg font-normal text-gray-500">({total})</span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Quản lý danh sách khách hàng và leads</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            📤 Export CSV
          </button>
          <ImportCsvDialog />
          <CreateContactDialog />
        </div>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          {(Object.keys(STATUS_LABELS) as ContactStatus[]).map((status) => (
            <div
              key={status}
              className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between"
            >
              <div>
                <p className="text-xs text-gray-500">{STATUS_LABELS[status]}</p>
                <p className="text-xl font-bold text-gray-900">{stats[status]}</p>
              </div>
              <ContactStatusBadge status={status} />
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
        <ContactFilters />
      </div>

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
          <span className="text-sm text-blue-700 font-medium">
            Đã chọn {selectedIds.length} contacts
          </span>
          <div className="flex gap-2">
            <button
              onClick={clearSelection}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Bỏ chọn
            </button>
            {/* TODO: Bulk delete, bulk tag, v.v. trong sprint sau */}
          </div>
        </div>
      )}

      {/* Table */}
      <ContactsTable
        contacts={contacts}
        total={total}
        isLoading={isLoading}
        onEdit={setEditingContact}
        onDelete={setDeletingContact}
      />

      {/* Edit sheet */}
      {editingContact && (
        <EditContactSheet
          contact={editingContact}
          open={!!editingContact}
          onClose={() => setEditingContact(null)}
        />
      )}

      {/* Delete confirm dialog */}
      {deletingContact && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !isDeleting && setDeletingContact(null)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Xác nhận xóa</h3>
            <p className="text-sm text-gray-600 mb-4">
              Bạn có chắc muốn xóa contact{' '}
              <strong>
                {[deletingContact.firstName, deletingContact.lastName].filter(Boolean).join(' ')}
              </strong>
              ? Hành động này có thể khôi phục sau.
            </p>
            {deleteError && (
              <div className="mb-3 bg-red-50 border border-red-200 rounded px-3 py-2 text-sm text-red-700">
                {deleteError}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingContact(null)}
                disabled={isDeleting}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
