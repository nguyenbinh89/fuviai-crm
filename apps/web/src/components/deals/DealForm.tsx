'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePipeline } from '@/hooks/usePipelines';
import { useContacts } from '@/hooks/useContacts';
import type { Deal, CreateDealInput } from '@/hooks/useDeals';

const dealSchema = z.object({
  title: z.string().min(1, 'Tiêu đề là bắt buộc').max(200),
  value: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : Number(v)),
    z.number().min(0).optional(),
  ),
  currency: z.string().default('VND'),
  pipelineId: z.string().min(1),
  stageId: z.string().min(1, 'Stage là bắt buộc'),
  contactId: z.string().optional(),
  assignedToId: z.string().optional(),
  expectedCloseDate: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['OPEN', 'WON', 'LOST']).default('OPEN'),
});

type DealFormValues = z.infer<typeof dealSchema>;

interface DealFormProps {
  pipelineId: string;
  defaultStageId?: string;
  initialData?: Partial<Deal>;
  onSubmit: (data: CreateDealInput) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function DealForm({
  pipelineId,
  defaultStageId,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: DealFormProps) {
  const [contactSearch, setContactSearch] = useState('');

  const { data: pipelineData } = usePipeline(pipelineId);
  const { data: contactsData } = useContacts(
    contactSearch ? { search: contactSearch, limit: 10 } : { limit: 10 },
  );

  const stages = pipelineData?.data?.stages ?? [];
  const contacts = contactsData?.data ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: initialData?.title ?? '',
      value: initialData?.value ?? undefined,
      currency: initialData?.currency ?? 'VND',
      pipelineId,
      stageId: initialData?.stageId ?? defaultStageId ?? '',
      contactId: initialData?.contactId ?? undefined,
      assignedToId: initialData?.assignedToId ?? undefined,
      expectedCloseDate: initialData?.expectedCloseDate
        ? initialData.expectedCloseDate.split('T')[0]
        : undefined,
      notes: initialData?.notes ?? undefined,
      status: (initialData?.status as 'OPEN' | 'WON' | 'LOST') ?? 'OPEN',
    },
  });

  // Sync pipelineId nếu thay đổi
  useEffect(() => {
    setValue('pipelineId', pipelineId);
  }, [pipelineId, setValue]);

  const handleFormSubmit = async (values: DealFormValues) => {
    await onSubmit({
      ...values,
      // Chuyển date string thành ISO string nếu có
      expectedCloseDate: values.expectedCloseDate
        ? new Date(values.expectedCloseDate).toISOString()
        : undefined,
      // Bỏ qua string rỗng
      contactId: values.contactId || undefined,
      assignedToId: values.assignedToId || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tiêu đề <span className="text-red-500">*</span>
        </label>
        <input
          {...register('title')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ví dụ: Deal với Công ty ABC"
        />
        {errors.title && (
          <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
        )}
      </div>

      {/* Value + Currency */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Giá trị</label>
          <input
            {...register('value')}
            type="number"
            min="0"
            step="1000"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
        </div>
        <div className="w-28">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tiền tệ</label>
          <select
            {...register('currency')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="VND">VND</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      {/* Stage */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Stage <span className="text-red-500">*</span>
        </label>
        <select
          {...register('stageId')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Chọn stage...</option>
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
        </select>
        {errors.stageId && (
          <p className="text-red-500 text-xs mt-1">{errors.stageId.message}</p>
        )}
      </div>

      {/* Contact */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
        <input
          type="text"
          value={contactSearch}
          onChange={(e) => setContactSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1"
          placeholder="Tìm kiếm contact..."
        />
        <select
          {...register('contactId')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Không gắn contact</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {[c.firstName, c.lastName].filter(Boolean).join(' ')}
              {c.company ? ` — ${c.company}` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Expected Close Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ngày dự kiến chốt
        </label>
        <input
          {...register('expectedCloseDate')}
          type="date"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
        <select
          {...register('status')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="OPEN">Đang mở</option>
          <option value="WON">Thành công</option>
          <option value="LOST">Thất bại</option>
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
        <textarea
          {...register('notes')}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Ghi chú về deal..."
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Hủy
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Đang lưu...' : initialData ? 'Cập nhật' : 'Tạo deal'}
        </button>
      </div>
    </form>
  );
}
