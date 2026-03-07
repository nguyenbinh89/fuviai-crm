'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary — bắt lỗi runtime trong cây component con.
 * Sử dụng ở layout.tsx hoặc bao quanh từng section của dashboard.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // TODO: gửi lên Sentry / logging service
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-3xl mb-3">⚠️</p>
          <p className="text-sm font-semibold text-red-800 mb-1">Có lỗi xảy ra</p>
          <p className="text-xs text-red-600 mb-4 max-w-sm">
            {this.state.error?.message ?? 'Lỗi không xác định'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
