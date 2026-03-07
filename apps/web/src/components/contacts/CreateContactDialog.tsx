'use client';

import { useState } from 'react';
import { ContactForm } from './ContactForm';
import { useCreateContact } from '@/hooks/useContacts';

interface Props {
  onSuccess?: () => void;
}

export function CreateContactDialog({ onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { mutateAsync, isPending } = useCreateContact();

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (data: Parameters<typeof mutateAsync>[0]) => {
    try {
      await mutateAsync(data);
      showToast('success', 'Tạo contact thành công!');
      setOpen(false);
      onSuccess?.();
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

      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        <span>+</span> Thêm contact
      </button>

      {/* Dialog */}
      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Thêm contact mới</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <ContactForm
                onSubmit={handleSubmit}
                isSubmitting={isPending}
                submitLabel="Tạo contact"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
