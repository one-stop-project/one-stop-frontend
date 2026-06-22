import { apiClient, ApiResponse } from '@/api/client';

// ════════════════════════════════════════════════════════════
//  AI 도메인 — AiShoppingAssistantController 기반
//   POST /api/ai/assistant   AI 쇼핑 어시스턴트 질의
//
//  (AI 리뷰 요약은 reviewApi.getAiSummary 에 포함)
// ════════════════════════════════════════════════════════════

export interface ShoppingAssistantRequest {
  message: string;           // @NotBlank, 최대 500자
  categoryId?: number;       // @Positive, 선택 — 현재 페이지 카테고리 힌트
}

export interface ShoppingAssistantResponse {
  answer: string;
}

export const aiApi = {
  // AI 쇼핑 어시스턴트에게 질문 (categoryId: 현재 페이지 카테고리 힌트, 선택)
  // _silent: 전역 인터셉터 토스트를 끄고, 질의 mutation의 onError 한 곳에서만 안내해 중복 메세지를 막는다.
  ask: async (
    message: string,
    categoryId?: number
  ): Promise<ShoppingAssistantResponse> => {
    const res = await apiClient.post<ApiResponse<ShoppingAssistantResponse>>(
      '/ai/assistant',
      { message, categoryId },
      { _silent: true } as never
    );
    return res.data.data;
  },
};
