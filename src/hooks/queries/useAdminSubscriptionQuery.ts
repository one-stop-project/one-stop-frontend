import { useQuery } from '@tanstack/react-query';
import { subscriptionAdminApi } from '@/domains/admin/subscriptionAdminApi';

export function useAdminSubscriptionStatsQuery() {
  return useQuery({
    queryKey: ['admin', 'subscriptions', 'stats'],
    queryFn: () => subscriptionAdminApi.getStats(),
  });
}

export function useAdminSubscriptionsQuery(page = 0, size = 20) {
  return useQuery({
    queryKey: ['admin', 'subscriptions', page, size],
    queryFn: () => subscriptionAdminApi.getSubscriptions(page, size),
  });
}
