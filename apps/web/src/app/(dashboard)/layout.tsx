import { FuviBotWidget } from '@/components/ai/FuviBotWidget';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ToastContainer } from '@/components/notifications/ToastContainer';
import { CommandPalette } from '@/components/search/CommandPalette';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

// Layout cho tất cả dashboard routes
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <span className="text-lg font-bold text-primary-600">FuviAI CRM</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <a
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span>🏠</span>
            Dashboard
          </a>
          <a
            href="/contacts"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span>👥</span>
            Contacts
          </a>
          <a
            href="/deals"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span>💼</span>
            Deals
          </a>
          <a
            href="/activities"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span>📋</span>
            Hoạt động
          </a>
          <a
            href="/email-marketing"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span>📧</span>
            Email Marketing
          </a>
          <a
            href="/inbox"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span>💬</span>
            Hộp thư
          </a>
          <a
            href="/automations"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span>⚡</span>
            Automation
          </a>
          <a
            href="/team"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span>👤</span>
            Team
          </a>
          <a
            href="/billing"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span>💳</span>
            Billing
          </a>

          <a
            href="/audit-logs"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span>📋</span>
            Audit Logs
          </a>
          <a
            href="/settings/api-keys"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span>🔑</span>
            API Keys
          </a>
          <a
            href="/settings/webhooks"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span>🪝</span>
            Webhooks
          </a>

          {/* Divider */}
          <div className="my-2 border-t border-gray-100" />

          <a
            href="/profile"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span>🙋</span>
            Profile
          </a>
          <a
            href="/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <span>⚙️</span>
            Cài đặt
          </a>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
          <div className="flex items-center gap-3">
            {/* Global search — Cmd+K */}
            <CommandPalette />
            {/* Notification bell — real-time */}
            <NotificationBell />
          </div>
        </header>

        {/* Content — bọc ErrorBoundary để bắt lỗi runtime */}
        <main className="flex-1 overflow-auto p-6">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>

      {/* FuviBot AI Widget — floating button góc phải dưới */}
      <FuviBotWidget />

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}
