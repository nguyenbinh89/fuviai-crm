import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface SearchResult {
  id: string;
  type: 'contact' | 'deal' | 'activity';
  title: string;
  subtitle: string;
  url: string;
}

export interface SearchResults {
  contacts: SearchResult[];
  deals: SearchResult[];
  activities: SearchResult[];
}

export function useSearch(q: string) {
  return useQuery({
    queryKey: ['search', q],
    queryFn: async () => {
      const { data } = await apiClient.get('/search', { params: { q } });
      return (data as { data: SearchResults }).data;
    },
    enabled: q.trim().length >= 2,
    staleTime: 10_000,
  });
}
