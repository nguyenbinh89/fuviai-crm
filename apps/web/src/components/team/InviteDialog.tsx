'use client';

import { useState } from 'react';
import type { UserRole } from '@/hooks/useTeam';

const INVITABLE_ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'ADMIN',  label: 'Admin',  description: 'Quản lý toàn bộ dữ liệu, chỉ không đổi được Owner' },
  { value: 'MEMBER', label: 'Member', description: 'Xem và chỉnh sửa dữ liệu được giao' },
  { value: 'VIEWER', label: 'Viewer', description: 'Chỉ xem, không chỉnh sửa' },
];

interface InviteDialogProps {
  onClose: () => void;
  onSubmit: (data: { email: string; role: UserRole }) => void;
  isPending: boolean;
  acceptUrl?: string; // Link accept trả về sau khi invite thành công
}

export function InviteDialog({ onClose, onSubmit, isPending, acceptUrl }: InviteDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('MEMBER');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    onSubmit({ email: email.trim(), role });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Mời thành viên</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        {/* Kết quả sau khi invite thành công */}
        {acceptUrl ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-medium text-green-800 mb-2">✓ Lời mời đã được tạo!</p>
              <p className="text-xs text-green-600 mb-3">
                Link dưới đây sẽ được gửi qua email. Trong môi trường dev, copy link để test:
              </p>
              <div className="bg-white border border-green-200 rounded-md p-2 break-all">
                <code className="text-xs text-gray-700">{acceptUrl}</code>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Đóng
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ten@email.com"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <div className="space-y-2">
                {INVITABLE_ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                      role === r.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium text-gray-800">{r.label}</span>
                    <span className="block text-xs text-gray-500 mt-0.5">{r.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!email.trim() || isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isPending ? 'Đang gửi...' : 'Gửi lời mời'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
