import { create } from 'zustand';
import type { ContactStatus, ContactFiltersParams } from '@/hooks/useContacts';

interface ContactsState {
  // Bulk selection
  selectedIds: string[];

  // Filters
  filters: ContactFiltersParams;

  // Actions — selection
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;

  // Actions — filters
  setFilter: <K extends keyof ContactFiltersParams>(
    key: K,
    value: ContactFiltersParams[K],
  ) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS: ContactFiltersParams = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export const useContactsStore = create<ContactsState>((set, get) => ({
  selectedIds: [],
  filters: DEFAULT_FILTERS,

  toggleSelect: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((sid) => sid !== id)
        : [...state.selectedIds, id],
    })),

  selectAll: (ids) => set({ selectedIds: ids }),

  clearSelection: () => set({ selectedIds: [] }),

  setFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
        // Reset về trang 1 khi thay đổi filter (trừ khi đang set page)
        ...(key !== 'page' ? { page: 1 } : {}),
      },
    })),

  resetFilters: () => set({ filters: DEFAULT_FILTERS, selectedIds: [] }),
}));
