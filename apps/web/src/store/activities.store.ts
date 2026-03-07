import { create } from 'zustand';
import type { ActivityType, ActivityStatus } from '@/hooks/useActivities';

// View mode: danh sách hoặc lịch
export type ActivitiesView = 'list' | 'calendar';

interface ActivityFilters {
  type?: ActivityType;
  status?: ActivityStatus;
  contactId?: string;
  dealId?: string;
  assignedToId?: string;
  page: number;
  limit: number;
}

interface ActivitiesStore {
  view: ActivitiesView;
  // Tháng đang xem trong calendar (ISO date string của ngày đầu tháng)
  calendarMonth: string;
  filters: ActivityFilters;
  // ID của activity đang mở form edit
  editingActivityId: string | null;

  setView: (view: ActivitiesView) => void;
  setCalendarMonth: (month: string) => void;
  setFilter: <K extends keyof ActivityFilters>(key: K, value: ActivityFilters[K]) => void;
  resetFilters: () => void;
  setEditingActivity: (id: string | null) => void;
}

const getFirstDayOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
};

const DEFAULT_FILTERS: ActivityFilters = {
  type: undefined,
  status: undefined,
  contactId: undefined,
  dealId: undefined,
  assignedToId: undefined,
  page: 1,
  limit: 50,
};

export const useActivitiesStore = create<ActivitiesStore>((set) => ({
  view: 'list',
  calendarMonth: getFirstDayOfMonth(),
  filters: { ...DEFAULT_FILTERS },
  editingActivityId: null,

  setView: (view) => set({ view }),
  setCalendarMonth: (month) => set({ calendarMonth: month }),
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value, page: key === 'page' ? (value as number) : 1 },
    })),
  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),
  setEditingActivity: (id) => set({ editingActivityId: id }),
}));
