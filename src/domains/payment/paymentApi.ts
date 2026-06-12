import { apiClient, ApiResponse } from '@/api/client';
import { OrderStatus } from '@/types/common';

// 백엔드 ApprovePaymentRequest 와 1:1 — orderId, amount 만 받음(결제수단/멱등키 미수신)
export interface PaymentRequest {
  orderId: number;
  amount: number;
}

// 백엔드 ApprovePaymentResponse 와 1:1
export interface PaymentResponse {
  orderId: number;
  finalPrice: number;
  status: OrderStatus;
  paidAt: string;
}

export const paymentApi = {
  approve: async (data: PaymentRequest): Promise<PaymentResponse> => {
    const res = await apiClient.post<ApiResponse<PaymentResponse>>('/payments', data);
    return res.data.data;
  },
};
