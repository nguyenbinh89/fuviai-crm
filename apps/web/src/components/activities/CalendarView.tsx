'use client';

import { useMemo, useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { useActivityCalendar } from '@/hooks/useActivities';
import type { Activity } from '@/hooks/useActivities';
import { getActivityTypeIcon } from './ActivityTypeBadge';
import { useActivitiesStore } from '@/store/activities.store';

interface CalendarViewProps {
  onActivityClick?: (activity: Activity) => void;
}

export function CalendarView({ onActivityClick }: CalendarViewProps) {
  const { calendarMonth, setCalendarMonth } = useActivitiesStore();
  const currentDate = new Date(calendarMonth);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Tuần bắt đầu thứ 2
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const dateFrom = format(calendarStart, "yyyy-MM-dd'T'00:00:00");
  const dateTo = format(calendarEnd, "yyyy-MM-dd'T'23:59:59");

  const { data: activities = [], isLoading } = useActivityCalendar(dateFrom, dateTo);

  // Group activities by date
  const activityByDate = useMemo(() => {
    const map: Record<string, Activity[]> = {};
    for (const act of activities) {
      if (!act.dueDate) continue;
      const key = format(new Date(act.dueDate), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(act);
    }
    return map;
  }, [activities]);

  const prevMonth = () => setCalendarMonth(subMonths(currentDate, 1).toISOString());
  const nextMonth = () => setCalendarMonth(addMonths(currentDate, 1).toISOString());

  const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header tháng */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600"
        >
          ‹
        </button>
        <h2 className="text-base font-semibold text-gray-800">
          {format(currentDate, 'MMMM yyyy', { locale: vi })}
        </h2>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600"
        >
          ›
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">
          Đang tải...
        </div>
      ) : (
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayActivities = activityByDate[key] ?? [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const _isToday = isToday(day);

            return (
              <div
                key={i}
                className={`min-h-[100px] border-b border-r p-1.5 ${
                  !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                } ${i % 7 === 6 ? 'border-r-0' : ''}`}
              >
                {/* Số ngày */}
                <div
                  className={`inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full mb-1 ${
                    _isToday
                      ? 'bg-blue-600 text-white'
                      : isCurrentMonth
                      ? 'text-gray-700'
                      : 'text-gray-400'
                  }`}
                >
                  {format(day, 'd')}
                </div>

                {/* Activities */}
                <div className="space-y-0.5">
                  {dayActivities.slice(0, 3).map((act) => (
                    <button
                      key={act.id}
                      onClick={() => onActivityClick?.(act)}
                      className={`w-full text-left px-1 py-0.5 rounded text-xs truncate transition-colors ${
                        act.status === 'DONE'
                          ? 'bg-green-100 text-green-700'
                          : act.status === 'CANCELLED'
                          ? 'bg-gray-100 text-gray-500 line-through'
                          : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      }`}
                      title={act.title}
                    >
                      {getActivityTypeIcon(act.type)} {act.title}
                    </button>
                  ))}
                  {dayActivities.length > 3 && (
                    <p className="text-xs text-gray-400 px-1">+{dayActivities.length - 3} khác</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
