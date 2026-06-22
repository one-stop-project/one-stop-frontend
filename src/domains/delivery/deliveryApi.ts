import { apiClient, ApiResponse } from '@/api/client';
import { DeliveryStatus } from '@/types/common';

// 백엔드 DeliveryResponse 와 1:1
export interface Delivery {
  deliveryId: number;
  orderItemId: number;
  itemName: string;
  sellerName: string;
  status: DeliveryStatus;
  invoiceNumber: string | null;    // trackingNumber 아님
  deliveryCompany: string | null;  // carrierName 아님
  updatedAt: string | null;        // shippedAt/deliveredAt 분리 필드 없음
}

// 백엔드 DeliveryHistoryResponse 와 1:1 (배열 아님 — 객체 안에 history 배열)
export interface DeliveryHistoryItem {
  status: DeliveryStatus;
  statusDesc: string;
  changedAt: string;
}

export interface DeliveryHistory {
  deliveryId: number;
  currentStatus: DeliveryStatus;
  invoiceNumber: string | null;
  deliveryCompany: string | null;
  history: DeliveryHistoryItem[];
}

export const deliveryApi = {
  getByOrder: async (orderId: number): Promise<Delivery[]> => {
    // 배송 추적은 주문 상세의 보조 정보 — 못 불러와도 주문 본문은 정상 표시되므로
    // 전역 '서버 오류' 토스트를 띄우지 않고(_silent) 화면에서 조용히 처리한다.
    const res = await apiClient.get<ApiResponse<Delivery[]>>(
      `/orders/${orderId}/deliveries`,
      { _silent: true } as never
    );
    return res.data.data;
  },

  getHistory: async (deliveryId: number): Promise<DeliveryHistory> => {
    // 배송 이력도 보조 정보 — 실패 시 전역 토스트 억제, 화면에서 조용히 처리한다.
    const res = await apiClient.get<ApiResponse<DeliveryHistory>>(
      `/deliveries/${deliveryId}/history`,
      { _silent: true } as never
    );
    return res.data.data;
  },
};
