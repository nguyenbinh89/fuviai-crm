'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useTags } from '@/hooks/useContacts';
import type { Contact, CreateContactInput } from '@/hooks/useContacts';

const contactSchema = z.object({
  firstName: z.string().min(1, 'Vui lòng nhập tên').max(100),
  lastName: z.string().max(100).optional().or(z.literal('')),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  company: z.string().max(200).optional().or(z.literal('')),
  position: z.string().max(100).optional().or(z.literal('')),
  status: z.enum(['LEAD', 'PROSPECT', 'CUSTOMER', 'INACTIVE']).optional(),
  notes: z.string().optional().or(z.literal('')),
  tagIds: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof contactSchema>;

interface Props {
  defaultValues?: Partial<Contact>;
  onSubmit: (data: CreateContactInput) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

const STATUS_OPTIONS = [
  { value: 'LEAD', label: 'Lead' },
  { value: 'PROSPECT', label: 'Prospect' },
  { value: 'CUSTOMER', label: 'Khách hàng' },
  { value: 'INACTIVE', label: 'Không hoạt động' },
];

export function ContactForm({ defaultValues, onSubmit, isSubmitting, submitLabel = 'Lưu' }: Props) {
  const { data: tagsData } = useTags();
  const tags = tagsData?.data ?? [];
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: defaultValues?.firstName ?? '',
      lastName: defaultValues?.lastName ?? '',
      email: defaultValues?.email ?? '',
      phone: defaultValues?.phone ?? '',
      company: defaultValues?.company ?? '',
      position: defaultValues?.position ?? '',
      status: defaultValues?.status ?? 'LEAD',
      notes: defaultValues?.notes ?? '',
      tagIds: defaultValues?.tags?.map((ct) => ct.tag.id) ?? [],
    },
  });

  const selectedTagIds = watch('tagIds') ?? [];

  const toggleTag = (tagId: string) => {
    const current = selectedTagIds;
    if (current.includes(tagId)) {
      setValue('tagIds', current.filter((id) => id !== tagId));
    } else {
      setValue('tagIds', [...current, tagId]);
    }
  };

  const handleFormSubmit = async (values: FormValues) => {
    // Chuyển empty string thành undefined
    const clean = (v?: string) => (v?.trim() === '' ? undefined : v?.trim());
    await onSubmit({
      firstName: values.firstName,
      lastName: clean(values.lastName),
      email: clean(values.email),
      phone: clean(values.phone),
      company: clean(values.company),
      position: clean(values.position),
      status: values.status,
      notes: clean(values.notes),
      tagIds: values.tagIds,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Tên */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên <span className="text-red-500">*</span>
          </label>
          <input
            {...register('firstName')}
            placeholder="Nguyễn"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.firstName && (
            <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Họ</label>
          <input
            {...register('lastName')}
            placeholder="Văn A"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Email & Phone */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            {...register('email')}
            type="email"
            placeholder="email@company.com"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Điện thoại</label>
          <input
            {...register('phone')}
            placeholder="+84901234567"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Company & Position */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Công ty</label>
          <input
            {...register('company')}
            placeholder="Công ty ABC"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Chức vụ</label>
          <input
            {...register('position')}
            placeholder="Giám đốc kinh doanh"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
        <select
          {...register('status')}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setTagDropdownOpen((prev) => !prev)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex justify-between items-center"
            >
              <span className="text-gray-500">
                {selectedTagIds.length > 0
                  ? `${selectedTagIds.length} tag đã chọn`
                  : 'Chọn tags...'}
              </span>
              <span className="text-gray-400">▼</span>
            </button>
            {tagDropdownOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {tags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTagIds.includes(tag.id)}
                      onChange={() => toggleTag(tag.id)}
                      className="rounded"
                    />
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-sm">{tag.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {/* Hiển thị tags đã chọn */}
          {selectedTagIds.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags
                .filter((t) => selectedTagIds.includes(t.id))
                .map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                    style={{ backgroundColor: tag.color + '20', color: tag.color }}
                  >
                    {tag.name}
                    <button
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className="hover:opacity-70"
                    >
                      ×
                    </button>
                  </span>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
        <textarea
          {...register('notes')}
          rows={3}
          placeholder="Thông tin bổ sung về contact..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white rounded-md py-2 px-4 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Đang lưu...' : submitLabel}
      </button>
    </form>
  );
}
