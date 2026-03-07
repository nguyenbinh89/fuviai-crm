'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { EmailCampaign, CreateCampaignData } from '@/hooks/useEmailMarketing';
import { useEmailTemplates } from '@/hooks/useEmailMarketing';

const schema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên').max(200),
  subject: z.string().min(1, 'Vui lòng nhập tiêu đề email').max(500),
  body: z.string().min(1, 'Vui lòng nhập nội dung'),
  previewText: z.string().max(200).optional(),
  templateId: z.string().optional(),
  scheduledAt: z.string().optional(),
  filterStatus: z.string().optional(),
  filterTagId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface CampaignFormProps {
  defaultValues?: Partial<EmailCampaign>;
  onSubmit: (data: CreateCampaignData) => void;
  isLoading?: boolean;
}

export function CampaignForm({ defaultValues, onSubmit, isLoading }: CampaignFormProps) {
  const { data: templates = [] } = useEmailTemplates();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      subject: defaultValues?.subject ?? '',
      body: defaultValues?.body ?? '',
      previewText: defaultValues?.previewText ?? '',
      templateId: defaultValues?.templateId ?? '',
      scheduledAt: defaultValues?.scheduledAt
        ? new Date(defaultValues.scheduledAt).toISOString().slice(0, 16)
        : '',
      filterStatus: defaultValues?.filterStatus ?? '',
      filterTagId: defaultValues?.filterTagId ?? '',
    },
  });

  const selectedTemplateId = watch('templateId');

  // Khi chọn template, tự động fill subject và body
  const handleTemplateChange = (templateId: string) => {
    setValue('templateId', templateId);
    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) {
      setValue('subject', tpl.subject);
      setValue('body', tpl.body);
      if (tpl.previewText) setValue('previewText', tpl.previewText);
    }
  };

  const handleFormSubmit = (values: FormValues) => {
    onSubmit({
      ...values,
      templateId: values.templateId || undefined,
      scheduledAt: values.scheduledAt || undefined,
      filterStatus: values.filterStatus || undefined,
      filterTagId: values.filterTagId || undefined,
      previewText: values.previewText || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Template selector */}
      {templates.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dùng từ template (tùy chọn)
          </label>
          <select
            value={selectedTemplateId}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Không dùng template --</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.isDefault ? '⭐ ' : ''}{t.name}
              </option>
            ))}
          </select>
          <input {...register('templateId')} type="hidden" />
        </div>
      )}

      {/* Tên chiến dịch */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tên chiến dịch <span className="text-red-500">*</span>
        </label>
        <input
          {...register('name')}
          placeholder="VD: Email chào hàng tháng 3"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>

      {/* Tiêu đề email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tiêu đề email <span className="text-red-500">*</span>
        </label>
        <input
          {...register('subject')}
          placeholder="VD: Ưu đãi đặc biệt tháng 3 dành cho bạn"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
      </div>

      {/* Preview text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Preview text</label>
        <input
          {...register('previewText')}
          placeholder="Text hiển thị dưới tiêu đề trong inbox..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Nội dung */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nội dung email <span className="text-red-500">*</span>
        </label>
        <textarea
          {...register('body')}
          rows={8}
          placeholder="Nội dung email (hỗ trợ HTML)..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono"
        />
        {errors.body && <p className="text-red-500 text-xs mt-1">{errors.body.message}</p>}
      </div>

      {/* Bộ lọc người nhận */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <p className="text-sm font-medium text-gray-700">🎯 Bộ lọc người nhận</p>
        <p className="text-xs text-gray-500">Để trống = gửi cho tất cả contacts có email</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Lọc theo trạng thái</label>
            <select
              {...register('filterStatus')}
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              <option value="LEAD">Lead</option>
              <option value="PROSPECT">Prospect</option>
              <option value="CUSTOMER">Customer</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Lên lịch gửi</label>
            <input
              {...register('scheduledAt')}
              type="datetime-local"
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Đang lưu...' : defaultValues?.id ? 'Cập nhật' : 'Tạo chiến dịch'}
        </button>
      </div>
    </form>
  );
}
