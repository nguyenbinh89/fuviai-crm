import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Đăng nhập — FuviAI CRM',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-600">FuviAI CRM</h1>
          <p className="mt-2 text-sm text-gray-600">
            Nền tảng CRM thế hệ mới cho doanh nghiệp Việt Nam
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Đăng nhập</h2>
          <LoginForm />
        </div>

        <p className="text-center text-sm text-gray-500">
          Chưa có tài khoản?{' '}
          <a href="/register" className="text-primary-600 hover:underline font-medium">
            Đăng ký miễn phí
          </a>
        </p>
      </div>
    </div>
  );
}
