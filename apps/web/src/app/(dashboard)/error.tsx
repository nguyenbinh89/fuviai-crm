'use client';

import { useEffect } from 'react';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Next.js App Router error boundary cho toàn bộ (dashboard) segment.
 * Bắt lỗi runtime trong Server Components và Client Components.
 */
export default function DashboardError({ error, reset }: Props) {
  useEffect(() => {
    // TODO: log lên Sentry hoặc monitoring service
    console.error('[Dashboard Error]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <p className="text-5xl mb-4">⚠️</p>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Đã xảy ra lỗi</h2>
      <p className="text-sm text-gray-500 mb-6 max-w-md">
        {error.message || 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.'}
      </p>
      {error.digest && (
        <p className="text-xs text-gray-400 mb-4 font-mono">ID: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
      >
        Thử lại
      </button>
    </div>
  );
}
