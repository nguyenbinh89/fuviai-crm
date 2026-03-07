interface UsageBarProps {
  label: string;
  used: number;
  limit: number; // -1 = unlimited
  icon: string;
}

export function UsageBar({ label, used, limit, icon }: UsageBarProps) {
  const isUnlimited = limit === -1;
  const pct = isUnlimited ? 0 : Math.min(Math.round((used / limit) * 100), 100);
  const isWarning = !isUnlimited && pct >= 80;
  const isCritical = !isUnlimited && pct >= 95;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600 flex items-center gap-1.5">
          <span>{icon}</span>
          {label}
        </span>
        <span className={`text-xs font-medium ${isCritical ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-gray-500'}`}>
          {used.toLocaleString('vi-VN')} / {isUnlimited ? '∞' : limit.toLocaleString('vi-VN')}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCritical ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {isUnlimited && (
        <div className="h-1.5 bg-gradient-to-r from-blue-300 to-purple-300 rounded-full" />
      )}
    </div>
  );
}
