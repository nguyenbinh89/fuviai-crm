'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
  type CreatedApiKey,
} from '@/hooks/useApiKeys';
import { toast } from '@/store/notifications.store';

const AVAILABLE_SCOPES = [
  { value: 'contacts:read',   label: '👤 Contacts — Đọc' },
  { value: 'contacts:write',  label: '👤 Contacts — Ghi' },
  { value: 'deals:read',      label: '💼 Deals — Đọc' },
  { value: 'deals:write',     label: '💼 Deals — Ghi' },
  { value: 'activities:read', label: '📋 Activities — Đọc' },
  { value: 'activities:write',label: '📋 Activities — Ghi' },
  { value: 'conversations:read', label: '💬 Conversations — Đọc' },
];

export default function ApiKeysPage() {
  const { data: keys = [], isLoading } = useApiKeys();
  const { mutate: createKey, isPending: creating } = useCreateApiKey();
  const { mutate: revokeKey, isPending: revoking } = useRevokeApiKey();

  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [expiresInDays, setExpiresInDays] = useState('');
  const [createdKey, setCreatedKey] = useState<CreatedApiKey | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = () => {
    if (!newKeyName.trim()) return;
    createKey(
      {
        name: newKeyName.trim(),
        scopes: selectedScopes,
        expiresInDays: expiresInDays ? parseInt(expiresInDays) : undefined,
      },
      {
        onSuccess: (data) => {
          setCreatedKey(data);
          setShowCreate(false);
          setNewKeyName('');
          setSelectedScopes([]);
          setExpiresInDays('');
        },
        onError: () => toast.error('Tạo API key thất bại'),
      },
    );
  };

  const handleCopy = () => {
    if (!createdKey) return;
    navigator.clipboard.writeText(createdKey.rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">API Keys</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tích hợp FuviAI CRM với hệ thống bên ngoài</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          + Tạo API Key
        </button>
      </div>

      {/* One-time key reveal */}
      {createdKey && (
        <div className="bg-green-50 border border-green-300 rounded-xl p-5">
          <p className="text-sm font-semibold text-green-800 mb-2">
            ✅ API Key "{createdKey.name}" đã được tạo
          </p>
          <p className="text-xs text-green-700 mb-3">
            Sao chép ngay — bạn sẽ không thể xem lại key này.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white border border-green-200 rounded-lg px-3 py-2 font-mono break-all">
              {createdKey.rawKey}
            </code>
            <button
              onClick={handleCopy}
              className="px-3 py-2 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex-shrink-0"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <button
            onClick={() => setCreatedKey(null)}
            className="mt-3 text-xs text-green-600 hover:underline"
          >
            Tôi đã lưu key — đóng thông báo này
          </button>
        </div>
      )}

      {/* Keys list */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Đang tải...</div>
        ) : keys.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <p className="text-2xl mb-2">🔑</p>
            <p className="text-sm">Chưa có API key nào</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key prefix</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scopes</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dùng lần cuối</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hết hạn</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {keys.map((key) => (
                <tr key={key.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{key.name}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">{key.keyPrefix}...</code>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {key.scopes.length === 0 ? (
                        <span className="text-xs text-gray-400">All scopes</span>
                      ) : (
                        key.scopes.slice(0, 3).map((s) => (
                          <span key={s} className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{s}</span>
                        ))
                      )}
                      {key.scopes.length > 3 && (
                        <span className="text-xs text-gray-400">+{key.scopes.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {key.lastUsedAt
                      ? format(new Date(key.lastUsedAt), 'dd/MM/yyyy', { locale: vi })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {key.expiresAt
                      ? format(new Date(key.expiresAt), 'dd/MM/yyyy', { locale: vi })
                      : 'Không hết hạn'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`Thu hồi API key "${key.name}"?`)) revokeKey(key.id);
                      }}
                      disabled={revoking}
                      className="text-xs text-red-500 hover:text-red-700 hover:underline"
                    >
                      Thu hồi
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Tạo API Key mới</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên *</label>
                <input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Zapier Integration"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quyền truy cập</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {AVAILABLE_SCOPES.map((s) => (
                    <label key={s.value} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedScopes.includes(s.value)}
                        onChange={() => toggleScope(s.value)}
                        className="rounded"
                      />
                      {s.label}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">Bỏ trống = toàn quyền</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hết hạn sau (ngày)</label>
                <input
                  type="number"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  placeholder="30 (để trống = không hết hạn)"
                  min={1}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newKeyName.trim()}
                className="flex-1 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? 'Đang tạo...' : 'Tạo key'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
