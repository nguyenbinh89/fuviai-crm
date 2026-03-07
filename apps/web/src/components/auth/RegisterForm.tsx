'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

const registerSchema = z.object({
  organizationName: z
    .string()
    .min(2, 'Tên công ty tối thiểu 2 ký tự')
    .max(100, 'Tên công ty tối đa 100 ký tự'),
  firstName: z.string().min(1, 'Vui lòng nhập tên').max(50),
  lastName: z.string().min(1, 'Vui lòng nhập họ').max(50),
  email: z.string().email('Email không hợp lệ'),
  password: z
    .string()
    .min(8, 'Mật khẩu tối thiểu 8 ký tự')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt',
    ),
  phone: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError(null);
    try {
      const response = await api.post<{
        data: { user: { id: string; organizationId: string; email: string; firstName: string; lastName: string; role: string; status: string; organizationName: string }; accessToken: string };
      }>('/auth/register', data);

      const { user, accessToken } = response.data.data;
      setAuth(user, accessToken);
      router.push('/dashboard');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      setServerError(
        err.response?.data?.error?.message || 'Đăng ký thất bại, vui lòng thử lại',
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Server error */}
      {serverError && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-700">{serverError}</p>
        </div>
      )}

      {/* Organization name */}
      <div>
        <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-1">
          Tên công ty / tổ chức
        </label>
        <input
          id="organizationName"
          type="text"
          placeholder="Công ty TNHH ABC"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          {...register('organizationName')}
        />
        {errors.organizationName && (
          <p className="mt-1 text-xs text-red-600">{errors.organizationName.message}</p>
        )}
      </div>

      {/* First + Last name */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Họ
          </label>
          <input
            id="lastName"
            type="text"
            placeholder="Nguyễn"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            {...register('lastName')}
          />
          {errors.lastName && (
            <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            Tên
          </label>
          <input
            id="firstName"
            type="text"
            placeholder="Văn A"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            {...register('firstName')}
          />
          {errors.firstName && (
            <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email công việc
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          {...register('email')}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Mật khẩu
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="Tối thiểu 8 ký tự"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          {...register('password')}
        />
        {errors.password && (
          <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
        )}
      </div>

      {/* Phone (optional) */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Số điện thoại{' '}
          <span className="text-gray-400 font-normal">(không bắt buộc)</span>
        </label>
        <input
          id="phone"
          type="tel"
          placeholder="+84901234567"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          {...register('phone')}
        />
      </div>

      {/* Terms */}
      <p className="text-xs text-gray-500">
        Bằng cách đăng ký, bạn đồng ý với{' '}
        <a href="#" className="text-primary-600 hover:underline">
          Điều khoản dịch vụ
        </a>{' '}
        và{' '}
        <a href="#" className="text-primary-600 hover:underline">
          Chính sách bảo mật
        </a>{' '}
        của FuviAI.
      </p>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-primary-600 text-white rounded-md py-2 px-4 text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản miễn phí'}
      </button>
    </form>
  );
}
