'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  useEmailCampaigns,
  useEmailCampaignStats,
  useEmailTemplates,
  useCreateCampaign,
  useCreateTemplate,
  useDeleteCampaign,
  useDeleteTemplate,
  useSendCampaign,
} from '@/hooks/useEmailMarketing';
import type { EmailCampaign, EmailTemplate } from '@/hooks/useEmailMarketing';
import { CampaignStatusBadge } from '@/components/email-marketing/CampaignStatusBadge';
import { CampaignForm } from '@/components/email-marketing/CampaignForm';
import { TemplateForm } from '@/components/email-marketing/TemplateForm';

type Tab = 'campaigns' | 'templates';

export default function EmailMarketingPage() {
  const [tab, setTab] = useState<Tab>('campaigns');
  const [page, setPage] = useState(1);
  const [createCampaignOpen, setCreateCampaignOpen] = useState(false);
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false);
  const [previewCampaign, setPreviewCampaign] = useState<EmailCampaign | null>(null);

  const { data: campaignsData, isLoading: campaignsLoading } = useEmailCampaigns(page);
  const { data: stats } = useEmailCampaignStats();
  const { data: templates = [], isLoading: templatesLoading } = useEmailTemplates();

  const createCampaign = useCreateCampaign();
  const createTemplate = useCreateTemplate();
  const deleteCampaign = useDeleteCampaign();
  const deleteTemplate = useDeleteTemplate();
  const sendCampaign = useSendCampaign();

  const campaigns = campaignsData?.data ?? [];
  const meta = campaignsData?.meta;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Marketing</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tạo và quản lý chiến dịch email hàng loạt</p>
        </div>
        <div className="flex gap-2">
          {tab === 'campaigns' && (
            <button
              onClick={() => setCreateCampaignOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              + Tạo chiến dịch
            </button>
          )}
          {tab === 'templates' && (
            <button
              onClick={() => setCreateTemplateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              + Tạo template
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <StatsBar stats={stats} />

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {(['campaigns', 'templates'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'campaigns' ? `📧 Chiến dịch (${meta?.total ?? 0})` : `📄 Templates (${templates.length})`}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {tab === 'campaigns' ? (
        <CampaignsTab
          campaigns={campaigns}
          isLoading={campaignsLoading}
          meta={meta}
          page={page}
          onPageChange={setPage}
          onSend={(id) => {
            if (confirm('Gửi chiến dịch này ngay?')) sendCampaign.mutate(id);
          }}
          onDelete={(id) => {
            if (confirm('Xóa chiến dịch này?')) deleteCampaign.mutate(id);
          }}
          onPreview={setPreviewCampaign}
        />
      ) : (
        <TemplatesTab
          templates={templates}
          isLoading={templatesLoading}
          onDelete={(id) => {
            if (confirm('Xóa template này?')) deleteTemplate.mutate(id);
          }}
        />
      )}

      {/* Create Campaign Dialog */}
      {createCampaignOpen && (
        <Modal title="Tạo chiến dịch email mới" onClose={() => setCreateCampaignOpen(false)}>
          <CampaignForm
            isLoading={createCampaign.isPending}
            onSubmit={(data) => {
              createCampaign.mutate(data, { onSuccess: () => setCreateCampaignOpen(false) });
            }}
          />
        </Modal>
      )}

      {/* Create Template Dialog */}
      {createTemplateOpen && (
        <Modal title="Tạo email template" onClose={() => setCreateTemplateOpen(false)} wide>
          <TemplateForm
            isLoading={createTemplate.isPending}
            onSubmit={(data) => {
              createTemplate.mutate(data, { onSuccess: () => setCreateTemplateOpen(false) });
            }}
          />
        </Modal>
      )}

      {/* Preview Campaign */}
      {previewCampaign && (
        <Modal title={`Xem trước: ${previewCampaign.name}`} onClose={() => setPreviewCampaign(null)} wide>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-0.5">Tiêu đề</p>
              <p className="text-sm font-medium">{previewCampaign.subject}</p>
            </div>
            {previewCampaign.previewText && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-0.5">Preview text</p>
                <p className="text-sm text-gray-600">{previewCampaign.previewText}</p>
              </div>
            )}
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-2">Nội dung</p>
              <div
                className="prose prose-sm max-w-none text-sm"
                dangerouslySetInnerHTML={{ __html: previewCampaign.body }}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// =====================
// SUB-COMPONENTS
// =====================

function StatsBar({ stats }: { stats?: { total: number; byStatus: { status: string; _count: number }[] } | undefined }) {
  const statusCount = (status: string) =>
    stats?.byStatus.find((s) => s.status === status)?._count ?? 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[
        { label: 'Tổng chiến dịch', value: stats?.total ?? 0, icon: '📧', color: 'text-gray-800 bg-white' },
        { label: 'Đã gửi', value: statusCount('SENT'), icon: '✅', color: 'text-green-700 bg-green-50' },
        { label: 'Đang chờ', value: statusCount('DRAFT') + statusCount('SCHEDULED'), icon: '🕐', color: 'text-yellow-700 bg-yellow-50' },
        { label: 'Thất bại', value: statusCount('FAILED'), icon: '❌', color: 'text-red-700 bg-red-50' },
      ].map((s) => (
        <div key={s.label} className={`rounded-xl border p-4 ${s.color} border-gray-200`}>
          <div className="flex items-center gap-2 mb-1">
            <span>{s.icon}</span>
            <span className="text-xs font-medium">{s.label}</span>
          </div>
          <p className="text-2xl font-bold">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

interface CampaignsTabProps {
  campaigns: EmailCampaign[];
  isLoading: boolean;
  meta?: { total: number; page: number; limit: number };
  page: number;
  onPageChange: (p: number) => void;
  onSend: (id: string) => void;
  onDelete: (id: string) => void;
  onPreview: (c: EmailCampaign) => void;
}

function CampaignsTab({ campaigns, isLoading, meta, page, onPageChange, onSend, onDelete, onPreview }: CampaignsTabProps) {
  if (isLoading) return <LoadingSkeleton />;

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
        <p className="text-4xl mb-3">📧</p>
        <h3 className="text-base font-semibold text-gray-700 mb-1">Chưa có chiến dịch nào</h3>
        <p className="text-sm text-gray-400">Tạo chiến dịch đầu tiên để bắt đầu email marketing</p>
      </div>
    );
  }

  const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 1;

  return (
    <div>
      <div className="space-y-3">
        {campaigns.map((c) => (
          <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{c.name}</h3>
                  <CampaignStatusBadge status={c.status} />
                </div>
                <p className="text-xs text-gray-500 mb-2 truncate">📩 {c.subject}</p>

                {/* Stats row */}
                {c.status === 'SENT' && (
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span>👥 {c.totalRecipients} người nhận</span>
                    <span>📤 {c.totalSent} đã gửi</span>
                    {c.totalOpened > 0 && <span>👁️ {c.totalOpened} đã mở ({Math.round(c.totalOpened / c.totalSent * 100)}%)</span>}
                    {c.sentAt && <span>🕐 {format(new Date(c.sentAt), 'dd/MM/yyyy HH:mm', { locale: vi })}</span>}
                  </div>
                )}
                {c.scheduledAt && c.status === 'SCHEDULED' && (
                  <p className="text-xs text-blue-600">
                    🗓️ Lịch gửi: {format(new Date(c.scheduledAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onPreview(c)}
                  className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-2 py-1 rounded hover:bg-gray-50"
                >
                  👁️ Xem
                </button>
                {(c.status === 'DRAFT' || c.status === 'SCHEDULED') && (
                  <button
                    onClick={() => onSend(c.id)}
                    className="text-xs text-white bg-green-600 hover:bg-green-700 px-2 py-1 rounded"
                  >
                    📤 Gửi
                  </button>
                )}
                {c.status === 'DRAFT' && (
                  <button
                    onClick={() => onDelete(c.id)}
                    className="text-xs text-gray-400 hover:text-red-500 p-1 rounded"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50">‹ Trước</button>
          <span className="text-sm text-gray-600 px-3 py-1.5">Trang {page}/{totalPages}</span>
          <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="px-3 py-1.5 text-sm border rounded-md disabled:opacity-40 hover:bg-gray-50">Sau ›</button>
        </div>
      )}
    </div>
  );
}

interface TemplatesTabProps {
  templates: EmailTemplate[];
  isLoading: boolean;
  onDelete: (id: string) => void;
}

function TemplatesTab({ templates, isLoading, onDelete }: TemplatesTabProps) {
  if (isLoading) return <LoadingSkeleton />;

  if (templates.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
        <p className="text-4xl mb-3">📄</p>
        <h3 className="text-base font-semibold text-gray-700 mb-1">Chưa có template nào</h3>
        <p className="text-sm text-gray-400">Tạo template để dùng lại cho nhiều chiến dịch</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((t) => (
        <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {t.isDefault && <span className="text-yellow-500 mr-1">⭐</span>}
                {t.name}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{t.subject}</p>
            </div>
            <button
              onClick={() => onDelete(t.id)}
              className="text-gray-300 hover:text-red-500 text-xs p-1"
            >
              🗑️
            </button>
          </div>
          {t.previewText && (
            <p className="text-xs text-gray-400 italic line-clamp-2 mb-2">{t.previewText}</p>
          )}
          <p className="text-xs text-gray-400">
            Tạo {format(new Date(t.createdAt), 'dd/MM/yyyy', { locale: vi })}
          </p>
        </div>
      ))}
    </div>
  );
}

function Modal({ title, children, onClose, wide }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-xl mx-4 max-h-[90vh] flex flex-col ${wide ? 'w-full max-w-3xl' : 'w-full max-w-lg'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}
