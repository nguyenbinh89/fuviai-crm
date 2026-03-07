'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuditLogs, buildExportUrl, type AuditLogsQuery } from '@/hooks/useAuditLogs';

const ACTION_CONFIG: Record<string, { label: string; color: string }> = {
  CREATE:  { label: 'Tạo mới',    color: 'bg-green-100 text-green-700' },
  UPDATE:  { label: 'Cập nhật',   color: 'bg-blue-100 text-blue-700' },
  DELETE:  { label: 'Xóa',        color: 'bg-red-100 text-red-700' },
  LOGIN:   { label: 'Đăng nhập',  color: 'bg-purple-100 text-purple-700' },
  LOGOUT:  { label: 'Đăng xuất',  color: 'bg-gray-100 text-gray-600' },
  EXPORT:  { label: 'Xuất dữ liệu', color: 'bg-yellow-100 text-yellow-700' },
  IMPORT:  { label: 'Nhập dữ liệu', color: 'bg-orange-100 text-orange-700' },
  SEND:    { label: 'Gửi',        color: 'bg-indigo-100 text-indigo-700' },
  TRIGGER: { label: 'Kích hoạt',  color: 'bg-pink-100 text-pink-700' },
};

const RESOURCE_LABEL: Record<string, string> = {
  contact:      '👤 Contact',
  deal:         '💼 Deal',
  activity:     '📋 Hoạt động',
  workflow:     '⚡ Workflow',
  conversation: '💬 Hội thoại',
  campaign:     '📧 Campaign',
  team:         '👥 Team',
  billing:      '💳 Billing',
  profile:      '🙋 Profile',
};

const RESOURCES = Object.keys(RESOURCE_LABEL);
const ACTIONS   = Object.keys(ACTION_CONFIG);

export default function AuditLogsPage() {
  const [filters, setFilters] = useState<AuditLogsQuery>({ page: 1, limit: 50 });
  const [localFilters, setLocalFilters] = useState({
    resource: '',
    action:   '',
    dateFrom: '',
    dateTo:   '',
  });

  const { data, isLoading } = useAuditLogs(filters);

  const applyFilters = () => {
    setFilters((f) => ({
      ...f,
      page: 1,
      resource: localFilters.resource || undefined,
      action:   localFilters.action   || undefined,
      dateFrom: localFilters.dateFrom || undefined,
      dateTo:   localFilters.dateTo   || undefined,
    }));
  };

  const resetFilters = () => {
    setLocalFilters({ resource: '', action: '', dateFrom: '', dateTo: '' });
    setFilters({ page: 1, limit: 50 });
  };

  const total = data?.meta.total ?? 0;
  const page  = data?.meta.page  ?? 1;
  const limit = data?.meta.limit ?? 50;
  const totalPages = Math.ceil(total / limit);

  const exportUrl = buildExportUrl({
    resource: filters.resource,
    action:   filters.action,
    dateFrom: filters.dateFrom,
    dateTo:   filters.dateTo,
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-sm text-gray-500 mt-0.5">Lịch sử tất cả hành động trong hệ thống</p>
        </div>
        <a
          href={exportUrl}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <span>📥</span>
          Xuất CSV
        </a>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Loại entity</label>
          <select
            value={localFilters.resource}
            onChange={(e) => setLocalFilters((f) => ({ ...f, resource: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả</option>
            {RESOURCES.map((r) => <option key={r} value={r}>{RESOURCE_LABEL[r]}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Hành động</label>
          <select
            value={localFilters.action}
            onChange={(e) => setLocalFilters((f) => ({ ...f, action: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả</option>
            {ACTIONS.map((a) => <option key={a} value={a}>{ACTION_CONFIG[a].label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Từ ngày</label>
          <input
            type="date"
            value={localFilters.dateFrom}
            onChange={(e) => setLocalFilters((f) => ({ ...f, dateFrom: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Đến ngày</label>
          <input
            type="date"
            value={localFilters.dateTo}
            onChange={(e) => setLocalFilters((f) => ({ ...f, dateTo: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={applyFilters}
            className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Lọc
          </button>
          <button
            onClick={resetFilters}
            className="px-4 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Reset
          </button>
        </div>
        {total > 0 && (
          <p className="text-xs text-gray-400 ml-auto self-center">
            {total.toLocaleString('vi-VN')} bản ghi
          </p>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Đang tải...</div>
        ) : !data?.data.length ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm">Không có dữ liệu audit log</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người dùng</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.data.map((log) => {
                  const actionCfg = ACTION_CONFIG[log.action] ?? { label: log.action, color: 'bg-gray-100 text-gray-600' };
                  const userName = log.user
                    ? `${log.user.firstName} ${log.user.lastName ?? ''}`.trim()
                    : 'System';
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: vi })}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{userName}</p>
                        {log.user && (
                          <p className="text-xs text-gray-400">{log.user.email}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${actionCfg.color}`}>
                          {actionCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {RESOURCE_LABEL[log.resource] ?? log.resource}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 max-w-[200px] truncate">
                        {log.resourceLabel ?? log.resourceId ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                        {log.ipAddress ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <button
                  disabled={page <= 1}
                  onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
                  className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                >
                  ← Trước
                </button>
                <span className="text-sm text-gray-500">
                  Trang {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
                  className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
