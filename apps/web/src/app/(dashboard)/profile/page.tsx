'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProfile, useUpdateProfile, useChangePassword } from '@/hooks/useProfile';
import { toast } from '@/store/notifications.store';

const profileSchema = z.object({
  firstName: z.string().min(1, 'Bắt buộc'),
  lastName:  z.string().optional(),
  phone:     z.string().optional(),
  avatarUrl: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Bắt buộc'),
  newPassword:     z.string().min(8, 'Tối thiểu 8 ký tự'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const { mutate: updateProfile, isPending: saving } = useUpdateProfile();
  const { mutate: changePassword, isPending: changingPwd } = useChangePassword();

  const [tab, setTab] = useState<'profile' | 'password'>('profile');

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      firstName: profile?.firstName ?? '',
      lastName:  profile?.lastName ?? '',
      phone:     profile?.phone ?? '',
      avatarUrl: profile?.avatarUrl ?? '',
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const onSaveProfile = (data: ProfileForm) => {
    updateProfile(
      { ...data, avatarUrl: data.avatarUrl || undefined },
      {
        onSuccess: () => toast.success('Đã lưu profile'),
        onError: () => toast.error('Lưu thất bại'),
      },
    );
  };

  const onChangePassword = (data: PasswordForm) => {
    changePassword(
      { currentPassword: data.currentPassword, newPassword: data.newPassword },
      {
        onSuccess: () => {
          toast.success('Đổi mật khẩu thành công', 'Vui lòng đăng nhập lại.');
          passwordForm.reset();
        },
        onError: (err: any) => {
          toast.error('Thất bại', err?.response?.data?.error?.message ?? 'Lỗi không xác định');
        },
      },
    );
  };

  const ROLE_LABEL: Record<string, string> = {
    OWNER: '👑 Owner',
    ADMIN: '🛡️ Admin',
    MEMBER: '👤 Member',
    VIEWER: '👁️ Viewer',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Profile của tôi</h1>
        <p className="text-sm text-gray-500 mt-0.5">Quản lý thông tin cá nhân và bảo mật</p>
      </div>

      {/* Avatar + meta */}
      {!isLoading && profile && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-600 flex-shrink-0 overflow-hidden">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              `${profile.firstName[0]}${profile.lastName?.[0] ?? ''}`.toUpperCase()
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{profile.firstName} {profile.lastName}</p>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <span className="inline-block mt-1 text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
              {ROLE_LABEL[profile.role] ?? profile.role} · {profile.organization.name}
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(['profile', 'password'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'profile' ? 'Thông tin cá nhân' : 'Đổi mật khẩu'}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ *</label>
              <input {...profileForm.register('firstName')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {profileForm.formState.errors.firstName && (
                <p className="text-xs text-red-500 mt-1">{profileForm.formState.errors.firstName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên</label>
              <input {...profileForm.register('lastName')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
            <input {...profileForm.register('phone')} type="tel" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL ảnh đại diện</label>
            <input {...profileForm.register('avatarUrl')} type="url" placeholder="https://..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {profileForm.formState.errors.avatarUrl && (
              <p className="text-xs text-red-500 mt-1">{profileForm.formState.errors.avatarUrl.message}</p>
            )}
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      )}

      {/* Password tab */}
      {tab === 'password' && (
        <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại *</label>
            <input {...passwordForm.register('currentPassword')} type="password" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {passwordForm.formState.errors.currentPassword && (
              <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới * (tối thiểu 8 ký tự)</label>
            <input {...passwordForm.register('newPassword')} type="password" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {passwordForm.formState.errors.newPassword && (
              <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.newPassword.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới *</label>
            <input {...passwordForm.register('confirmPassword')} type="password" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {passwordForm.formState.errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
            )}
          </div>
          <p className="text-xs text-gray-400">Sau khi đổi mật khẩu, bạn sẽ cần đăng nhập lại trên tất cả thiết bị.</p>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={changingPwd} className="px-5 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
              {changingPwd ? 'Đang đổi...' : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
