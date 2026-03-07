'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Activity, CreateActivityData } from '@/hooks/useActivities';

const schema = z.object({
  title: z.string().min(1, 'Vui lòng nhập tiêu đề').max(200),
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'TASK']),
  status: z.enum(['PENDING', 'DONE', 'CANCELLED']).optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
  assignedToId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface ActivityFormProps {
  defaultValues?: Partial<Activity>;
  onSubmit: (data: CreateActivityData) => void;
  isLoading?: boolean;
  // Gán sẵn context khi tạo từ contact/deal page
  contextContactId?: string;
  contextDealId?: string;
}

export function ActivityForm({
  defaultValues,
  onSubmit,
  isLoading,
  contextContactId,
  contextDealId,
}: ActivityFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      type: defaultValues?.type ?? 'TASK',
      status: defaultValues?.status ?? 'PENDING',
      description: defaultValues?.description ?? '',
      dueDate: defaultValues?.dueDate
        ? new Date(defaultValues.dueDate).toISOString().slice(0, 16)
        : '',
      contactId: defaultValues?.contactId ?? contextContactId ?? '',
      dealId: defaultValues?.dealId ?? contextDealId ?? '',
      assignedToId: defaultValues?.assignedToId ?? '',
    },
  });

  const handleFormSubmit = (values: FormValues) => {
    onSubmit({
      ...values,
      dueDate: values.dueDate || undefined,
      contactId: values.contactId || undefined,
      dealId: values.dealId || undefined,
      assignedToId: values.assignedToId || undefined,
      description: values.description || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Tiêu đề */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tiêu đề <span className="text-red-500">*</span>
        </label>
        <input
          {...register('title')}
          type="text"
          placeholder="VD: Gọi điện chào hàng cho khách"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
      </div>

      {/* Loại + Trạng thái */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Loại <span className="text-red-500">*</span>
          </label>
          <select
            {...register('type')}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="TASK">✅ Nhiệm vụ</option>
            <option value="CALL">📞 Cuộc gọi</option>
            <option value="EMAIL">✉️ Email</option>
            <option value="MEETING">🤝 Họp</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
          <select
            {...register('status')}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="PENDING">Chờ xử lý</option>
            <option value="DONE">Hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Ngày hẹn */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ngày &amp; giờ hẹn
        </label>
        <input
          {...register('dueDate')}
          type="datetime-local"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Mô tả */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
        <textarea
          {...register('description')}
          rows={3}
          placeholder="Chi tiết về hoạt động này..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Contact ID (ẩn nếu có context) */}
      {!contextContactId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID Khách hàng</label>
          <input
            {...register('contactId')}
            type="text"
            placeholder="ID của contact liên quan"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>
      )}

      {/* Deal ID (ẩn nếu có context) */}
      {!contextDealId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID Deal</label>
          <input
            {...register('dealId')}
            type="text"
            placeholder="ID của deal liên quan"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Đang lưu...' : defaultValues?.id ? 'Cập nhật' : 'Tạo mới'}
        </button>
      </div>
    </form>
  );
}
