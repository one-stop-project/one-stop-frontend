import { apiClient, ApiResponse } from '@/api/client';

// ════════════════════════════════════════════════════════════
//  쿠폰 도메인 — CouponController 기반
//   GET  /api/coupons/available        발급 가능 쿠폰 목록
//   POST /api/coupons/{couponId}/issue 쿠폰 발급 (선착순)
//   GET  /api/users/me/coupons         내 쿠폰 목록 (페이징)
// ════════════════════════════════════════════════════════════

export type CouponDiscountType = 'RATE' | 'FIXED';
export type UserCouponStatus = 'AVAILABLE' | 'USED' | 'EXPIRED';

export interface AvailableCoupon {
  couponId: number;
  name: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderPrice: number;
  // 정액(FIXED) 쿠폰은 상한이 없어 백엔드가 null을 보냄. 정률(RATE)만 숫자 상한.
  maxDiscountPrice: number | null;
  remainingQuantity: number;
  startAt: string;
  expiredAt: string;
}

export interface IssueCouponResult {
  userCouponId: number;
  couponId: number;
  couponName: string;
  status: UserCouponStatus;
  issuedAt: string;
  expiredAt: string;
}

export interface MyCoupon {
  userCouponId: number;
  couponId: number;
  couponName: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderPrice: number;
  // 정액(FIXED) 쿠폰은 상한이 없어 백엔드가 null을 보냄. 정률(RATE)만 숫자 상한.
  maxDiscountPrice: number | null;
  status: UserCouponStatus;
  issuedAt: string;
  usedAt: string | null;
  expiredAt: string;
}

export interface MyCouponParams {
  page?: number;
  size?: number;
  status?: UserCouponStatus;
}

// 백엔드 MyCouponPageResponse 와 1:1 — 공용 PageResponse(number/first/last)와 달리
// 이 응답은 페이지 번호를 number 가 아니라 page 로 내려준다.
export interface MyCouponPage {
  content: MyCoupon[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export const couponApi = {
  // 발급 가능 쿠폰 목록
  getAvailable: async (): Promise<AvailableCoupon[]> => {
    const res = await apiClient.get<ApiResponse<AvailableCoupon[]>>('/coupons/available');
    return res.data.data;
  },

  // 쿠폰 발급 (선착순)
  // _silent: 전역 인터셉터 토스트를 끄고, 발급 mutation의 onError 한 곳에서만 안내해 중복 메세지를 막는다.
  issue: async (couponId: number): Promise<IssueCouponResult> => {
    const res = await apiClient.post<ApiResponse<IssueCouponResult>>(
      `/coupons/${couponId}/issue`,
      null,
      { _silent: true } as never
    );
    return res.data.data;
  },

  // 내 쿠폰 목록 (페이징)
  getMyCoupons: async (params: MyCouponParams = {}): Promise<MyCouponPage> => {
    const res = await apiClient.get<ApiResponse<MyCouponPage>>(
      '/users/me/coupons',
      { params }
    );
    return res.data.data;
  },
};
