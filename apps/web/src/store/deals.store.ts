import { create } from 'zustand';
import type { DealStatus } from '@/hooks/useDeals';

interface DealFilters {
  stageId?: string;
  status?: DealStatus;
  contactId?: string;
  search?: string;
  page: number;
  limit: number;
}

interface DealsStore {
  selectedPipelineId: string | null;
  draggingDealId: string | null;
  filters: DealFilters;

  setSelectedPipeline: (id: string | null) => void;
  setDraggingDeal: (id: string | null) => void;
  setFilter: <K extends keyof DealFilters>(key: K, value: DealFilters[K]) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS: DealFilters = {
  stageId: undefined,
  status: undefined,
  contactId: undefined,
  search: undefined,
  page: 1,
  limit: 50,
};

export const useDealsStore = create<DealsStore>((set) => ({
  selectedPipelineId: null,
  draggingDealId: null,
  filters: { ...DEFAULT_FILTERS },

  setSelectedPipeline: (id) => set({ selectedPipelineId: id }),
  setDraggingDeal: (id) => set({ draggingDealId: id }),
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value, page: key === 'page' ? (value as number) : 1 },
    })),
  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),
}));
