import { apiClient, ApiResponse } from '@/api/client';

// ════════════════════════════════════════════════════════════
//  포인트 도메인 — PointController 기반 (조회 전용)
//   GET /api/users/me/points  내 포인트 잔액 + 만료예정 + 이력(페이지)
//  ※ 충전(POST /charge)은 백엔드가 ADMIN·local/test/dev 전용(테스트용)이라 구매자 화면 미연결
// ════════════════════════════════════════════════════════════

export type PointHistoryType = 'CHARGE' | 'EARN' | 'USE' | 'REFUND' | 'EXPIRE';

// 백엔드 PointHistoryResponse 와 1:1
export interface PointHistory {
  historyId: number;
  amount: number;
  type: PointHistoryType;
  description: string;
  expireAt: string | null;
  createdAt: string;
}

// 백엔드 PointHistoryPageResponse 와 1:1
export interface PointHistoryPage {
  content: PointHistory[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// 백엔드 ExpiringSoonPointResponse 와 1:1
export interface ExpiringSoonPoint {
  amount: number;
  expireAt: string | null;
}

// 백엔드 PointResponse 와 1:1
export interface PointResponse {
  balance: number;
  expiringSoon: ExpiringSoonPoint | null;
  history: PointHistoryPage;
}

export const pointApi = {
  getMyPoints: async (
    page = 0,
    size = 20,
    type?: PointHistoryType
  ): Promise<PointResponse> => {
    const res = await apiClient.get<ApiResponse<PointResponse>>('/users/me/points', {
      params: { page, size, type },
    });
    return res.data.data;
  },
};
