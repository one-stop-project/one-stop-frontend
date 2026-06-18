import { apiClient, ApiResponse, PageResponse } from '@/api/client';

/**
 * 관리자 구독 관리 API
 * 백엔드: AdminSubscriptionController (/api/admin/subscriptions)
 */

// 구독 상태 (BE SubscriptionStatus)
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED';

// 백엔드 AdminSubscriptionStatsResponse 와 1:1
export interface SubscriptionStats {
  activeCount: number;
  cancelledCount: number;
  expiredCount: number;
  totalCount: number;
}

// 백엔드 AdminSubscriptionResponse 와 1:1
export interface AdminSubscription {
  subscriptionId: number;
  userId: number;
  userEmail: string;
  userName: string;
  status: SubscriptionStatus;
  startAt: string;
  endAt: string | null;
  nextPaymentDate: string | null;
  cancelReason: string | null;
  createdAt: string;
}

export const subscriptionAdminApi = {
  getStats: async (): Promise<SubscriptionStats> => {
    const res = await apiClient.get<ApiResponse<SubscriptionStats>>('/admin/subscriptions/stats');
    return res.data.data;
  },

  getSubscriptions: async (page = 0, size = 20): Promise<PageResponse<AdminSubscription>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<AdminSubscription>>>(
      '/admin/subscriptions',
      { params: { page, size } }
    );
    return res.data.data;
  },
};
