import Link from 'next/link';

/** Trang 404 — hiển thị khi route không tồn tại */
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <p className="text-7xl font-bold text-gray-200 mb-4">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Trang không tồn tại</h1>
        <p className="text-sm text-gray-500 mb-8">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          ← Về Dashboard
        </Link>
      </div>
    </div>
  );
}
