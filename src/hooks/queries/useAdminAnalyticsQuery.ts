import { useQuery } from '@tanstack/react-query';
import { analyticsAdminApi } from '@/domains/admin/analyticsAdminApi';

export function usePopularKeywordsQuery(date?: string, limit = 20) {
  return useQuery({
    queryKey: ['admin', 'analytics', 'keywords', date ?? 'today', limit],
    queryFn: () => analyticsAdminApi.getPopularKeywords(date, limit),
  });
}

export function useActionHistoriesQuery(page = 0, size = 20) {
  return useQuery({
    queryKey: ['admin', 'analytics', 'histories', page, size],
    queryFn: () => analyticsAdminApi.getActionHistories(page, size),
  });
}
