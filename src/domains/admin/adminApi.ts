import { apiClient, ApiResponse, PageResponse } from '@/api/client';
import { ProductStatus, SellerStatus, OrderStatus, DeliveryStatus } from '@/types/common';

// 백엔드 DashboardResponse 와 1:1 (중첩 구조)
export interface DashboardResponse {
  orders: {
    statusCount: Partial<Record<OrderStatus, number>>;
    todayOrderCount: number;
    todayRevenue: number;
  };
  deliveries: {
    statusCount: Partial<Record<DeliveryStatus, number>>;
  };
}

export interface AdminProduct {
  productId: number;
  sellerId: number;
  name: string;
  description: string;
  thumbnailUrl: string | null;
  status: ProductStatus;
}

export interface AdminSeller {
  sellerId: number;
  userId: number;
  shopName: string;
  businessNumber: string; // 백엔드에서 마스킹되어 내려옴
  status: SellerStatus;
}

export interface AdminOrder {
  orderId: number;
  userName: string;
  userEmail: string;
  finalPrice: number;
  status: OrderStatus;
  itemCount: number;
  createdAt: string;
}

export const adminApi = {
  getDashboard: async (): Promise<DashboardResponse> => {
    const res = await apiClient.get<ApiResponse<DashboardResponse>>('/admin/dashboard');
    return res.data.data;
  },

  // 상품 관리 (승인 요청된 상품 목록 — 상태 필터 미지원)
  getProducts: async (page = 0, size = 20): Promise<PageResponse<AdminProduct>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<AdminProduct>>>('/admin/products', {
      params: { page, size },
    });
    return res.data.data;
  },

  approveProduct: async (productId: number): Promise<void> => {
    await apiClient.patch(`/admin/products/${productId}/approve`);
  },

  rejectProduct: async (productId: number, reason: string): Promise<void> => {
    await apiClient.patch(`/admin/products/${productId}/reject`, { reason });
  },

  forceInactiveProduct: async (productId: number, reason: string): Promise<void> => {
    await apiClient.patch(`/admin/products/${productId}/force-inactive`, { reason });
  },

  // 판매자 관리 — 대기 중인 판매자 목록(배열 응답, 페이징 없음)
  getSellers: async (): Promise<AdminSeller[]> => {
    const res = await apiClient.get<ApiResponse<AdminSeller[]>>('/admin/sellers');
    return res.data.data;
  },

  approveSeller: async (sellerId: number): Promise<void> => {
    await apiClient.patch(`/admin/sellers/${sellerId}/approve`);
  },

  rejectSeller: async (sellerId: number, reason: string): Promise<void> => {
    await apiClient.patch(`/admin/sellers/${sellerId}/reject`, { reason });
  },

  forceInactiveSeller: async (sellerId: number, reason: string): Promise<void> => {
    await apiClient.patch(`/admin/sellers/${sellerId}/force-inactive`, { reason });
  },

  // 주문 관리
  getOrders: async (
    page = 0,
    size = 20,
    filters: { status?: OrderStatus; keyword?: string; from?: string; to?: string } = {}
  ): Promise<PageResponse<AdminOrder>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<AdminOrder>>>('/admin/orders', {
      params: { page, size, ...filters },
    });
    return res.data.data;
  },
};
