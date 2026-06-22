import { useQuery } from '@tanstack/react-query';
import { pointApi, PointHistoryType } from '@/domains/point/pointApi';
import { useAuthStore } from '@/store/useAuthStore';

export function usePointsQuery(page = 0, size = 20, type?: PointHistoryType) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['points', page, size, type],
    queryFn: () => pointApi.getMyPoints(page, size, type),
    enabled: isAuthenticated,
  });
}
