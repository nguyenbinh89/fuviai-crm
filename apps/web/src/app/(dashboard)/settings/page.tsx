'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useOrgSettings, useUpdateOrgSettings } from '@/hooks/useProfile';
import { toast } from '@/store/notifications.store';

const PLAN_LABEL: Record<string, string> = {
  STARTER:    '🆓 Starter',
  PRO:        '⭐ Pro',
  BUSINESS:   '🏢 Business',
  ENTERPRISE: '🏆 Enterprise',
};

const TIMEZONES = [
  'Asia/Ho_Chi_Minh',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Seoul',
  'UTC',
];

const settingsSchema = z.object({
  name:     z.string().min(2, 'Tối thiểu 2 ký tự'),
  logoUrl:  z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  website:  z.string().url('URL không hợp lệ').optional().or(z.literal('')),
  phone:    z.string().optional(),
  address:  z.string().optional(),
  timezone: z.string().min(1),
  locale:   z.string().min(1),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { data: settings, isLoading } = useOrgSettings();
  const { mutate: updateSettings, isPending: saving } = useUpdateOrgSettings();

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    values: {
      name:     settings?.name ?? '',
      logoUrl:  settings?.logoUrl ?? '',
      website:  settings?.website ?? '',
      phone:    settings?.phone ?? '',
      address:  settings?.address ?? '',
      timezone: settings?.timezone ?? 'Asia/Ho_Chi_Minh',
      locale:   settings?.locale ?? 'vi',
    },
  });

  const onSubmit = (data: SettingsForm) => {
    updateSettings(
      { ...data, logoUrl: data.logoUrl || undefined, website: data.website || undefined },
      {
        onSuccess: () => toast.success('Đã lưu cài đặt tổ chức'),
        onError: () => toast.error('Lưu thất bại'),
      },
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Cài đặt tổ chức</h1>
        <p className="text-sm text-gray-500 mt-0.5">Quản lý thông tin và cấu hình tổ chức của bạn</p>
      </div>

      {/* Plan badge */}
      {settings && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-900">Gói hiện tại</p>
            <p className="text-lg font-bold text-blue-700">{PLAN_LABEL[settings.plan] ?? settings.plan}</p>
          </div>
          <a href="/billing" className="text-sm text-blue-600 hover:underline">
            Quản lý billing →
          </a>
        </div>
      )}

      {/* Form */}
      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên tổ chức *</label>
            <input
              {...form.register('name')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {form.formState.errors.name && (
              <p className="text-xs text-red-500 mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL Logo</label>
            <input
              {...form.register('logoUrl')}
              type="url"
              placeholder="https://..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {form.formState.errors.logoUrl && (
              <p className="text-xs text-red-500 mt-1">{form.formState.errors.logoUrl.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                {...form.register('website')}
                type="url"
                placeholder="https://..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Điện thoại</label>
              <input
                {...form.register('phone')}
                type="tel"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
            <input
              {...form.register('address')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Múi giờ</label>
              <select
                {...form.register('timezone')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngôn ngữ</label>
              <select
                {...form.register('locale')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="vi">🇻🇳 Tiếng Việt</option>
                <option value="en">🇺🇸 English</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
