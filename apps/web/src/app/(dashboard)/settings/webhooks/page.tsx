'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  useWebhooks, useCreateWebhook, useUpdateWebhook, useDeleteWebhook, useWebhookDeliveries,
  WEBHOOK_EVENTS, type WebhookEndpoint,
} from '@/hooks/useWebhooks';
import { toast } from '@/store/notifications.store';

const EVENT_LABEL: Record<string, string> = {
  CONTACT_CREATED: '👤 Contact tạo mới',
  CONTACT_UPDATED: '👤 Contact cập nhật',
  CONTACT_DELETED: '👤 Contact xóa',
  DEAL_CREATED: '💼 Deal tạo mới',
  DEAL_UPDATED: '💼 Deal cập nhật',
  DEAL_WON: '🎉 Deal thắng',
  DEAL_LOST: '😞 Deal thua',
  DEAL_STAGE_CHANGED: '🔄 Deal đổi stage',
  ACTIVITY_CREATED: '📋 Activity tạo mới',
  ACTIVITY_COMPLETED: '✅ Activity hoàn thành',
  CONVERSATION_MESSAGE_RECEIVED: '💬 Tin nhắn mới',
  WORKFLOW_RUN_COMPLETED: '⚡ Workflow hoàn thành',
  WORKFLOW_RUN_FAILED: '⚠️ Workflow lỗi',
};

const DELIVERY_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  SUCCESS: { label: 'Thành công', color: 'bg-green-100 text-green-700' },
  FAILED:  { label: 'Thất bại',  color: 'bg-red-100 text-red-700' },
  PENDING: { label: 'Chờ',       color: 'bg-yellow-100 text-yellow-700' },
  RETRYING:{ label: 'Thử lại',   color: 'bg-orange-100 text-orange-700' },
};

function DeliveryHistory({ endpointId }: { endpointId: string }) {
  const { data = [], isLoading } = useWebhookDeliveries(endpointId);
  if (isLoading) return <p className="text-xs text-gray-400 p-4">Đang tải...</p>;
  if (data.length === 0) return <p className="text-xs text-gray-400 p-4">Chưa có lần gửi nào</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-3 py-2 text-left text-gray-500">Thời gian</th>
            <th className="px-3 py-2 text-left text-gray-500">Event</th>
            <th className="px-3 py-2 text-left text-gray-500">Trạng thái</th>
            <th className="px-3 py-2 text-right text-gray-500">HTTP</th>
            <th className="px-3 py-2 text-right text-gray-500">Thời lượng</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((d) => {
            const sc = DELIVERY_STATUS_CONFIG[d.status] ?? { label: d.status, color: 'bg-gray-100 text-gray-600' };
            return (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-500">
                  {format(new Date(d.createdAt), 'dd/MM HH:mm:ss', { locale: vi })}
                </td>
                <td className="px-3 py-2 text-gray-600">{EVENT_LABEL[d.event] ?? d.event}</td>
                <td className="px-3 py-2">
                  <span className={`px-1.5 py-0.5 rounded-full font-medium ${sc.color}`}>{sc.label}</span>
                </td>
                <td className="px-3 py-2 text-right font-mono text-gray-500">{d.responseCode ?? '—'}</td>
                <td className="px-3 py-2 text-right text-gray-500">{d.durationMs ? `${d.durationMs}ms` : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function WebhooksPage() {
  const { data: endpoints = [], isLoading } = useWebhooks();
  const { mutate: createWebhook, isPending: creating } = useCreateWebhook();
  const { mutate: updateWebhook } = useUpdateWebhook();
  const { mutate: deleteWebhook } = useDeleteWebhook();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  const toggleEvent = (e: string) =>
    setSelectedEvents((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]);

  const handleCreate = () => {
    if (!newName.trim() || !newUrl.trim() || selectedEvents.length === 0) {
      toast.error('Vui lòng điền đầy đủ thông tin và chọn ít nhất 1 event');
      return;
    }
    createWebhook(
      { name: newName.trim(), url: newUrl.trim(), events: selectedEvents },
      {
        onSuccess: (data: any) => {
          setCreatedSecret(data.secret);
          setShowCreate(false);
          setNewName(''); setNewUrl(''); setSelectedEvents([]);
          toast.success('Webhook đã được tạo');
        },
        onError: () => toast.error('Tạo webhook thất bại'),
      },
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Webhooks</h1>
          <p className="text-sm text-gray-500 mt-0.5">Nhận thông báo real-time khi có sự kiện xảy ra</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          + Thêm Webhook
        </button>
      </div>

      {/* Secret reveal */}
      {createdSecret && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-blue-800 mb-1">🔐 Signing Secret</p>
          <p className="text-xs text-blue-700 mb-2">Dùng để xác thực header <code>X-FuviAI-Signature</code>. Lưu lại ngay.</p>
          <code className="text-xs font-mono bg-white border border-blue-200 rounded-lg px-3 py-2 block break-all">{createdSecret}</code>
          <button onClick={() => setCreatedSecret(null)} className="mt-2 text-xs text-blue-600 hover:underline">
            Đã lưu — đóng
          </button>
        </div>
      )}

      {/* Endpoints list */}
      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">Đang tải...</div>
      ) : endpoints.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 bg-white border border-gray-200 rounded-xl text-gray-400">
          <p className="text-2xl mb-2">🪝</p>
          <p className="text-sm">Chưa có webhook nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {endpoints.map((ep) => (
            <div key={ep.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${ep.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{ep.name}</p>
                  <p className="text-xs text-gray-500 truncate">{ep.url}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateWebhook({ id: ep.id, isActive: !ep.isActive })}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      ep.isActive
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {ep.isActive ? 'Tắt' : 'Bật'}
                  </button>
                  <button
                    onClick={() => setExpandedId(expandedId === ep.id ? null : ep.id)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {expandedId === ep.id ? 'Ẩn ▲' : 'Lịch sử ▼'}
                  </button>
                  <button
                    onClick={() => { if (confirm(`Xóa webhook "${ep.name}"?`)) deleteWebhook(ep.id); }}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Xóa
                  </button>
                </div>
              </div>
              <div className="px-4 pb-3 flex flex-wrap gap-1">
                {ep.events.map((e) => (
                  <span key={e} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {EVENT_LABEL[e] ?? e}
                  </span>
                ))}
                {ep.failureCount > 0 && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                    {ep.failureCount} lỗi liên tiếp
                  </span>
                )}
              </div>
              {expandedId === ep.id && (
                <div className="border-t border-gray-100">
                  <DeliveryHistory endpointId={ep.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Thêm Webhook Endpoint</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên *</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="My Integration" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
                <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} type="url" placeholder="https://your-server.com/webhook" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Events * (chọn ít nhất 1)</label>
                <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto">
                  {WEBHOOK_EVENTS.map((e) => (
                    <label key={e} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                      <input type="checkbox" checked={selectedEvents.includes(e)} onChange={() => toggleEvent(e)} className="rounded" />
                      {EVENT_LABEL[e] ?? e}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</button>
              <button onClick={handleCreate} disabled={creating} className="flex-1 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {creating ? 'Đang tạo...' : 'Thêm webhook'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
