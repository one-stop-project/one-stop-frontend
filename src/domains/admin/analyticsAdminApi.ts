import { apiClient, ApiResponse, PageResponse } from '@/api/client';

/**
 * 관리자 운영 분석 API
 * 백엔드: AdminSearchController (/api/admin/search), AdminActionHistoryController (/api/admin/action-histories)
 */

// 인기 검색어 (BE PopularKeywordResponse)
export interface PopularKeyword {
  rank: number;
  keyword: string;
  count: number;
}

// BE PopularKeywordAdminResponse
export interface PopularKeywordResult {
  date: string;
  keywords: PopularKeyword[];
}

// 관리자 처리 이력 분류 (BE AdminActionTarget / AdminActionType)
export type AdminActionTarget = 'SELLER' | 'PRODUCT' | 'ADMIN_USER';
export type AdminActionType =
  | 'APPROVE'
  | 'REJECT'
  | 'FORCE_INACTIVE'
  | 'REACTIVATE'
  | 'GRANT_ADMIN'
  | 'REVOKE_ADMIN';

// BE AdminActionHistoryResponse
export interface AdminActionHistory {
  id: number;
  actorId: number;
  targetType: AdminActionTarget;
  targetId: number;
  action: AdminActionType;
  reason: string | null;
  createdAt: string;
}

export const analyticsAdminApi = {
  // 특정일 인기 검색어 (date 미지정 시 백엔드가 오늘 기준)
  getPopularKeywords: async (date?: string, limit = 20): Promise<PopularKeywordResult> => {
    const res = await apiClient.get<ApiResponse<PopularKeywordResult>>('/admin/search/popular', {
      params: { ...(date ? { date } : {}), limit },
    });
    return res.data.data;
  },

  // 관리자 처리 이력 (SUPER_ADMIN: 전체 / ADMIN: 본인)
  getActionHistories: async (page = 0, size = 20): Promise<PageResponse<AdminActionHistory>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<AdminActionHistory>>>(
      '/admin/action-histories',
      { params: { page, size } }
    );
    return res.data.data;
  },
};
