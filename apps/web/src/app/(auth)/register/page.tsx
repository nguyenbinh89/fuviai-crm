import type { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Đăng ký — FuviAI CRM',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-600">FuviAI CRM</h1>
          <p className="mt-2 text-sm text-gray-600">
            Bắt đầu dùng thử miễn phí 14 ngày
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Tạo tài khoản</h2>
          <RegisterForm />
        </div>

        <p className="text-center text-sm text-gray-500">
          Đã có tài khoản?{' '}
          <a href="/login" className="text-primary-600 hover:underline font-medium">
            Đăng nhập
          </a>
        </p>
      </div>
    </div>
  );
}
