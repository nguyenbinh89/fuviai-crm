'use client';

import { useState } from 'react';
import { ContactForm } from './ContactForm';
import { useUpdateContact } from '@/hooks/useContacts';
import type { Contact, CreateContactInput } from '@/hooks/useContacts';

interface Props {
  contact: Contact;
  open: boolean;
  onClose: () => void;
}

export function EditContactSheet({ contact, open, onClose }: Props) {
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { mutateAsync, isPending } = useUpdateContact();

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (data: CreateContactInput) => {
    try {
      await mutateAsync({ id: contact.id, data });
      showToast('success', 'Cập nhật thành công!');
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      showToast(
        'error',
        error.response?.data?.error?.message ?? 'Có lỗi xảy ra, vui lòng thử lại',
      );
    }
  };

  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Slide-over sheet */}
      {open && (
        <div className="fixed inset-0 z-40 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30" onClick={onClose} />
          {/* Sheet */}
          <div className="relative bg-white w-full max-w-md shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Chỉnh sửa contact</h2>
                <p className="text-sm text-gray-500">
                  {[contact.firstName, contact.lastName].filter(Boolean).join(' ')}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>
            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6">
              <ContactForm
                defaultValues={contact}
                onSubmit={handleSubmit}
                isSubmitting={isPending}
                submitLabel="Lưu thay đổi"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
