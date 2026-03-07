'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useContactsStore } from '@/store/contacts.store';
import { ContactStatusBadge } from './ContactStatusBadge';
import type { Contact } from '@/hooks/useContacts';

interface Props {
  contacts: Contact[];
  total: number;
  isLoading?: boolean;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
}

type SortableField = 'createdAt' | 'updatedAt' | 'firstName' | 'aiScore';

export function ContactsTable({ contacts, total, isLoading, onEdit, onDelete }: Props) {
  const { filters, setFilter, selectedIds, toggleSelect, selectAll, clearSelection } =
    useContactsStore();

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const totalPages = Math.ceil(total / limit);

  const handleSort = (field: SortableField) => {
    if (filters.sortBy === field) {
      setFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setFilter('sortBy', field);
      setFilter('sortOrder', 'desc');
    }
  };

  const SortIcon = ({ field }: { field: SortableField }) => {
    if (filters.sortBy !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return (
      <span className="text-blue-500 ml-1">{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
    );
  };

  const allSelected =
    contacts.length > 0 && contacts.every((c) => selectedIds.includes(c.id));

  const handleSelectAll = () => {
    if (allSelected) {
      clearSelection();
    } else {
      selectAll(contacts.map((c) => c.id));
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
        Đang tải dữ liệu...
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-gray-500 text-sm">Không có contact nào.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  className="rounded"
                />
              </th>
              <th
                className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer select-none"
                onClick={() => handleSort('firstName')}
              >
                Tên <SortIcon field="firstName" />
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Điện thoại</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Công ty</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Trạng thái</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Tags</th>
              <th
                className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer select-none"
                onClick={() => handleSort('createdAt')}
              >
                Ngày tạo <SortIcon field="createdAt" />
              </th>
              <th className="px-4 py-3 w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {contacts.map((contact) => (
              <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(contact.id)}
                    onChange={() => toggleSelect(contact.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/contacts/${contact.id}`}
                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {[contact.firstName, contact.lastName].filter(Boolean).join(' ')}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{contact.email ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{contact.phone ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{contact.company ?? '—'}</td>
                <td className="px-4 py-3">
                  <ContactStatusBadge status={contact.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.slice(0, 3).map(({ tag }) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs"
                        style={{ backgroundColor: tag.color + '20', color: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ))}
                    {contact.tags.length > 3 && (
                      <span className="text-xs text-gray-400">+{contact.tags.length - 3}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {format(new Date(contact.createdAt), 'dd/MM/yyyy', { locale: vi })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => onEdit(contact)}
                      className="text-xs text-gray-500 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => onDelete(contact)}
                      className="text-xs text-gray-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
        <p className="text-sm text-gray-600">
          Tổng{' '}
          <span className="font-medium">{total}</span> contacts
          {selectedIds.length > 0 && (
            <span className="ml-2 text-blue-600">({selectedIds.length} đã chọn)</span>
          )}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('page', Math.max(1, page - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Trước
          </button>
          <span className="text-sm text-gray-600">
            {page} / {totalPages || 1}
          </span>
          <button
            onClick={() => setFilter('page', Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}
