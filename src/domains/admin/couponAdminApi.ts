import { apiClient, ApiResponse, PageResponse } from '@/api/client';

/**
 * 관리자 쿠폰 관리 API
 * 백엔드: AdminCouponController (/api/admin/coupons)
 */

// 할인 방식 (BE CouponDiscountType)
export type CouponDiscountType = 'RATE' | 'FIXED';

// 쿠폰 상태 (BE CouponStatus)
export type CouponStatus = 'ACTIVE' | 'INACTIVE';

// 백엔드 AdminCouponResponse 와 1:1
export interface AdminCoupon {
  couponId: number;
  name: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderPrice: number;
  maxDiscountPrice: number | null;
  totalQuantity: number;
  issuedQuantity: number;
  remainingQuantity: number;
  status: CouponStatus;
  startAt: string;
  expiredAt: string;
  createdAt: string;
}

// 백엔드 AdminCouponCreateRequest 와 1:1
export interface CreateCouponRequest {
  name: string;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderPrice: number;
  maxDiscountPrice?: number | null; // 정률(RATE)일 때 필요
  totalQuantity: number;
  startAt: string; // LocalDateTime (ISO)
  expiredAt: string;
}

export const couponAdminApi = {
  create: async (data: CreateCouponRequest): Promise<AdminCoupon> => {
    const res = await apiClient.post<ApiResponse<AdminCoupon>>('/admin/coupons', data);
    return res.data.data;
  },

  getCoupons: async (
    page = 0,
    size = 20,
    status?: CouponStatus
  ): Promise<PageResponse<AdminCoupon>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<AdminCoupon>>>('/admin/coupons', {
      params: { page, size, ...(status ? { status } : {}) },
    });
    return res.data.data;
  },

  deactivate: async (couponId: number): Promise<AdminCoupon> => {
    const res = await apiClient.patch<ApiResponse<AdminCoupon>>(
      `/admin/coupons/${couponId}/deactivate`
    );
    return res.data.data;
  },
};
