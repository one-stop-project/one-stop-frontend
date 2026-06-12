import { apiClient, ApiResponse } from '@/api/client';
import { OrderStatus, OrderItemStatus, DeliveryStatus } from '@/types/common';

export type OrderType = 'DIRECT' | 'CART';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  요청 — 백엔드 CreateOrderRequest / CreateOrderItemRequest 와 1:1
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface CreateOrderItemRequest {
  itemId: number;                // 백엔드 @NotNull (productItemId 아님)
  quantity: number;              // 1 이상 (@Min(1))
}

export interface CreateOrderRequest {
  orderType?: OrderType;         // DIRECT(즉시구매) | CART(장바구니)
  items?: CreateOrderItemRequest[];   // 직접 구매 시
  cartItemIds?: number[];        // 장바구니 주문 시 선택된 cartItem ID 목록
  receiverName: string;          // @NotBlank
  receiverPhone: string;         // @NotBlank
  receiverAddress: string;       // @NotBlank
  deliveryMessage?: string;      // 최대 50자
  userCouponId?: number;         // 적용할 쿠폰 (선택)
  usedPoint?: number;            // 사용 포인트 (0 이상, 선택)
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  응답 — 목록/상세/생성이 서로 다른 DTO (백엔드와 1:1)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 주문 생성 응답 (백엔드 CreateOrderResponse)
export interface CreatedOrderItem {
  orderItemId: number;
  itemId: number;
  itemName: string;
  price: number;
  quantity: number;
  subtotal: number;
  sellerName: string;
  status: OrderItemStatus;
}

export interface CreatedOrder {
  orderId: number;
  orderItems: CreatedOrderItem[];
  totalPrice: number;
  discountPrice: number;
  usedPoint: number;
  subscriptionDiscount: number;
  deliveryFee: number;
  finalPrice: number;
  status: OrderStatus;
  createdAt: string;
}

// 주문 목록 항목 (백엔드 OrderSummaryResponse) — 항목 배열 없이 대표 1건 + 총 수량만 제공
export interface OrderSummary {
  orderId: number;
  finalPrice: number;
  status: OrderStatus;
  itemCount: number;             // 주문 항목 수량 합계
  firstItemName: string | null;
  firstItemThumbnail: string | null;
  createdAt: string;
}

// 주문 목록 페이지 (백엔드 OrderPageResponse) — Spring Page 아님(first/last/number 없음)
export interface OrderPage {
  content: OrderSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// 주문 상세 항목에 묶인 배송 요약 (백엔드 DeliverySummaryResponse) — 결제 전엔 null
export interface OrderItemDelivery {
  deliveryId: number;
  status: DeliveryStatus;
  deliveryCompany: string | null;
  invoiceNumber: string | null;
}

// 주문 상세 항목 (백엔드 OrderDetailItemResponse) — productName/thumbnail/subtotal 없음
export interface OrderDetailItem {
  orderItemId: number;
  itemId: number;
  itemName: string;
  sellerId: number;
  quantity: number;
  price: number;
  status: OrderItemStatus;
  delivery: OrderItemDelivery | null;
}

// 주문 상세 수령인 (백엔드 ReceiverResponse) — 평면 아님, receiver 로 중첩
export interface OrderReceiver {
  name: string;
  phone: string;
  address: string;
}

// 주문 상세 (백엔드 OrderDetailResponse)
export interface OrderDetail {
  orderId: number;
  status: OrderStatus;
  deliveryFee: number;           // shippingFee 아님
  orderItems: OrderDetailItem[]; // items 아님
  receiver: OrderReceiver;
  totalPrice: number;
  discountPrice: number;
  usedPoint: number;
  finalPrice: number;
  createdAt: string;
}

export interface OrderListParams {
  page?: number;
  size?: number;
  status?: OrderStatus;
}

export const orderApi = {
  create: async (data: CreateOrderRequest): Promise<CreatedOrder> => {
    const res = await apiClient.post<ApiResponse<CreatedOrder>>('/orders', data);
    return res.data.data;
  },

  getMyOrders: async (params: OrderListParams = {}): Promise<OrderPage> => {
    const res = await apiClient.get<ApiResponse<OrderPage>>('/orders', { params });
    return res.data.data;
  },

  getDetail: async (orderId: number): Promise<OrderDetail> => {
    const res = await apiClient.get<ApiResponse<OrderDetail>>(`/orders/${orderId}`);
    return res.data.data;
  },

  // 백엔드는 빈 바디 POST면 "Required request body is missing"으로 400 → 최소 바디(reason 선택)는 보냄
  cancel: async (orderId: number, reason?: string): Promise<void> => {
    await apiClient.post(`/orders/${orderId}/cancel`, { reason });
  },
};
