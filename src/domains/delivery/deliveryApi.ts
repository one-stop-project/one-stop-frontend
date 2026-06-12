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
    const res = await apiClient.get<ApiResponse<Delivery[]>>(`/orders/${orderId}/deliveries`);
    return res.data.data;
  },

  getHistory: async (deliveryId: number): Promise<DeliveryHistory> => {
    const res = await apiClient.get<ApiResponse<DeliveryHistory>>(
      `/deliveries/${deliveryId}/history`
    );
    return res.data.data;
  },
};
