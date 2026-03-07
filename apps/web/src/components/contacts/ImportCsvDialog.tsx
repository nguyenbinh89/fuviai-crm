'use client';

import { useState, useRef } from 'react';
import { useImportContacts } from '@/hooks/useContacts';

interface ImportResult {
  created: number;
  skipped: number;
}

export function ImportCsvDialog() {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { mutateAsync, isPending } = useImportContacts();

  const handleSubmit = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError('Vui lòng chọn file CSV');
      return;
    }

    setError(null);
    setResult(null);

    try {
      const importResult = await mutateAsync(file);
      setResult(importResult);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setError(e.response?.data?.error?.message ?? 'Import thất bại, vui lòng thử lại');
    }
  };

  const handleClose = () => {
    setOpen(false);
    setResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        📥 Import CSV
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Import Contacts từ CSV</h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl">
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Hướng dẫn */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                <p className="font-medium mb-1">Định dạng CSV:</p>
                <p className="font-mono text-xs">firstName,lastName,email,phone,company</p>
                <p className="mt-1 text-xs text-blue-600">
                  Cột <strong>firstName</strong> là bắt buộc. Contacts có email trùng sẽ bị bỏ qua.
                </p>
              </div>

              {/* File input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn file CSV
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Result */}
              {result && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
                  <p className="font-semibold text-green-800 mb-1">Import hoàn thành!</p>
                  <div className="text-green-700 space-y-0.5">
                    <p>✅ Đã tạo: <strong>{result.created}</strong> contacts</p>
                    <p>⏭️ Bỏ qua (trùng email): <strong>{result.skipped}</strong> contacts</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  {result ? 'Đóng' : 'Hủy'}
                </button>
                {!result && (
                  <button
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isPending ? 'Đang import...' : 'Import'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
