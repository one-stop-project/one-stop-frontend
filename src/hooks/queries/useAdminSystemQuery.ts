import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { systemAdminApi } from '@/domains/admin/systemAdminApi';

export function usePointStatsQuery() {
  return useQuery({
    queryKey: ['admin', 'system', 'point-stats'],
    queryFn: () => systemAdminApi.getPointStats(),
  });
}

export function usePointInconsistenciesQuery(limit = 100) {
  return useQuery({
    queryKey: ['admin', 'system', 'point-inconsistencies', limit],
    queryFn: () => systemAdminApi.getPointInconsistencies(limit),
  });
}

export function useRunPointExpirationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetDate?: string) => systemAdminApi.runPointExpiration(targetDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'system'] });
      toast.success('포인트 만료 처리를 실행했습니다.');
    },
  });
}

export function useCriticalEventsQuery(hours = 24, page = 0, size = 50) {
  return useQuery({
    queryKey: ['admin', 'system', 'audit-critical', hours, page, size],
    queryFn: () => systemAdminApi.getCriticalEvents(hours, page, size),
  });
}

export function useHighRiskEventsQuery(days = 7, page = 0, size = 50) {
  return useQuery({
    queryKey: ['admin', 'system', 'audit-high-risk', days, page, size],
    queryFn: () => systemAdminApi.getHighRiskEvents(days, page, size),
  });
}

export function useAuditStatsByCategoryQuery(days = 7) {
  return useQuery({
    queryKey: ['admin', 'system', 'audit-category', days],
    queryFn: () => systemAdminApi.getAuditStatsByCategory(days),
  });
}
