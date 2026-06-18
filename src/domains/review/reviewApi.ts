import { apiClient, ApiResponse, PageResponse } from '@/api/client';

// ════════════════════════════════════════════════════════════
//  리뷰 도메인 — ReviewController + MyReviewController + AiReviewSummaryController 기반
//   POST   /api/reviews                            리뷰 작성 (multipart/form-data)
//   PATCH  /api/reviews/{reviewId}                 리뷰 수정 (multipart/form-data)
//   DELETE /api/reviews/{reviewId}                 리뷰 삭제
//   GET    /api/users/me/reviews                   내 리뷰 목록 (페이징)
//   GET    /api/users/me/reviewable                작성 가능한 리뷰 목록
//   GET    /api/products/{productId}/reviews/ai-summary  AI 리뷰 요약
// ════════════════════════════════════════════════════════════

export interface Review {
  reviewId: number;
  productId: number;
  orderItemId: number;
  rating: number;
  content: string;
  images: string[];          // 백엔드 ReviewResponse.images
  createdAt: string;
  updatedAt: string;
}

export interface MyReview {
  reviewId: number;
  productId: number;
  productName: string;
  rating: number;
  content: string;
  createdAt: string;
}

// 상품 상세에 노출되는 리뷰 (작성자명 포함)
export interface ProductReview {
  reviewId: number;
  reviewerName: string;
  rating: number;
  content: string;
  images: string[];          // 백엔드 ProductReviewResponse.images
  createdAt: string;
}

// 아직 리뷰를 쓰지 않은, 작성 가능한 주문 상품
export interface ReviewableOrderItem {
  orderItemId: number;
  productId: number;
  productName: string;
  optionName: string;
  deliveredAt: string;
}

// 작성 요청 본문 (multipart의 'request' 파트 JSON) — 이미지 파일은 별도 'images' 파트
export interface CreateReviewRequest {
  orderItemId: number;       // @NotNull
  rating: number;            // 1~5
  content: string;           // 10~1000자
}

// 수정 요청 본문 (multipart의 'request' 파트 JSON) — 새 이미지 파일은 별도 'newImages' 파트
export interface UpdateReviewRequest {
  rating: number;            // 1~5, 필수
  content: string;           // 10~1000자, 필수
  retainedImageUrls: string[]; // @NotNull, 최대 5장 — 수정 후에도 유지할 기존 이미지 URL 목록
}

// AI 리뷰 요약 (BE AiReviewSummaryResponse / ReviewSummary 와 1:1)
export type ReviewSentiment = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'UNAVAILABLE';
export type AiSummaryStatus = 'READY' | 'PENDING' | 'INSUFFICIENT';

export interface ReviewSummary {
  pros: string[];
  cons: string[];
  keywords: string[];
  sentiment: ReviewSentiment;
}

export interface AiReviewSummary {
  reviewCount: number;
  averageRating: number;
  summary: ReviewSummary | null; // status가 PENDING/INSUFFICIENT면 null
  status: AiSummaryStatus;
}

export interface MyReviewParams {
  page?: number;
  size?: number;
}

// 백엔드 @RequestPart("request")는 JSON 파트로 받음 — application/json 타입의 Blob으로 첨부
function jsonPart(data: unknown): Blob {
  return new Blob([JSON.stringify(data)], { type: 'application/json' });
}

// FormData 전송 시 axios 인스턴스 기본 Content-Type(application/json)을 제거해
// 브라우저가 multipart 경계(boundary)를 자동으로 붙이게 함
const MULTIPART_CONFIG = { headers: { 'Content-Type': undefined } as any };

export const reviewApi = {
  create: async (data: CreateReviewRequest, images?: File[]): Promise<Review> => {
    const fd = new FormData();
    fd.append('request', jsonPart(data));
    (images ?? []).forEach((file) => fd.append('images', file));
    const res = await apiClient.post<ApiResponse<Review>>('/reviews', fd, MULTIPART_CONFIG);
    return res.data.data;
  },

  update: async (
    reviewId: number,
    data: UpdateReviewRequest,
    newImages?: File[]
  ): Promise<Review> => {
    const fd = new FormData();
    fd.append('request', jsonPart(data));
    (newImages ?? []).forEach((file) => fd.append('newImages', file));
    const res = await apiClient.patch<ApiResponse<Review>>(
      `/reviews/${reviewId}`,
      fd,
      MULTIPART_CONFIG
    );
    return res.data.data;
  },

  remove: async (reviewId: number): Promise<void> => {
    await apiClient.delete(`/reviews/${reviewId}`);
  },

  getMyReviews: async (params: MyReviewParams = {}): Promise<PageResponse<Review>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<Review>>>('/users/me/reviews', {
      params,
    });
    return res.data.data;
  },

  // 작성 가능한 리뷰 목록 (배송완료 + 미작성)
  getReviewable: async (): Promise<ReviewableOrderItem[]> => {
    const res = await apiClient.get<ApiResponse<ReviewableOrderItem[]>>(
      '/users/me/reviewable'
    );
    return res.data.data;
  },

  // 상품별 AI 리뷰 요약 (리뷰 10개 이상 시 제공)
  getAiSummary: async (productId: number): Promise<AiReviewSummary> => {
    const res = await apiClient.get<ApiResponse<AiReviewSummary>>(
      `/products/${productId}/reviews/ai-summary`
    );
    return res.data.data;
  },
};
