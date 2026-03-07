'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import type { EmailTemplate, CreateTemplateData } from '@/hooks/useEmailMarketing';

const schema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên').max(200),
  subject: z.string().min(1, 'Vui lòng nhập tiêu đề').max(500),
  body: z.string().min(1, 'Vui lòng nhập nội dung'),
  previewText: z.string().max(200).optional(),
  isDefault: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

interface TemplateFormProps {
  defaultValues?: Partial<EmailTemplate>;
  onSubmit: (data: CreateTemplateData) => void;
  isLoading?: boolean;
}

export function TemplateForm({ defaultValues, onSubmit, isLoading }: TemplateFormProps) {
  const [previewMode, setPreviewMode] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      subject: defaultValues?.subject ?? '',
      body: defaultValues?.body ?? '',
      previewText: defaultValues?.previewText ?? '',
      isDefault: defaultValues?.isDefault ?? false,
    },
  });

  const bodyValue = watch('body');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên template <span className="text-red-500">*</span>
          </label>
          <input
            {...register('name')}
            placeholder="VD: Email chào hàng B2B"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input {...register('isDefault')} type="checkbox" className="rounded" />
            <span className="text-sm text-gray-700">⭐ Đặt làm template mặc định</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tiêu đề email <span className="text-red-500">*</span>
        </label>
        <input
          {...register('subject')}
          placeholder="Tiêu đề sẽ hiển thị trong hộp thư..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Preview text</label>
        <input
          {...register('previewText')}
          placeholder="Text ngắn hiển thị dưới tiêu đề trong inbox..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Nội dung <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {previewMode ? '✏️ Chỉnh sửa' : '👁️ Preview'}
          </button>
        </div>

        {previewMode ? (
          <div
            className="w-full min-h-[200px] border border-gray-300 rounded-md p-3 prose prose-sm max-w-none bg-gray-50"
            dangerouslySetInnerHTML={{ __html: bodyValue }}
          />
        ) : (
          <textarea
            {...register('body')}
            rows={10}
            placeholder="Nội dung email. Hỗ trợ HTML. VD: <h2>Xin chào {{name}}</h2>..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono"
          />
        )}
        {errors.body && <p className="text-red-500 text-xs mt-1">{errors.body.message}</p>}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Đang lưu...' : defaultValues?.id ? 'Cập nhật' : 'Tạo template'}
        </button>
      </div>
    </form>
  );
}
