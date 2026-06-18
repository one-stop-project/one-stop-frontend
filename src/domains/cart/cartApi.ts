import { apiClient, ApiResponse } from '@/api/client';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  타입 — 백엔드 실제 DTO와 1:1 매칭
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 백엔드 CartItemDetailResponse 와 1:1
export interface CartItem {
  cartItemId: number | null;   // 비로그인 시 null
  itemId: number;              // ★ 수정/삭제 기준값 (productItemId 아님)
  productId: number;
  productName: string;
  optionName: string;          // ★ itemName 아님
  price: number;
  quantity: number;
  thumbnailUrl: string | null;
  stock: number;
  available: boolean;          // 재고>0 && 판매중
}

// 백엔드 CartPageResponse 와 1:1
export interface CartResponse {
  cartId: number | null;       // 빈 카트·게스트 카트면 null
  content: CartItem[];         // ★ items 아님!
  totalPrice: number;
  itemCount: number;           // 전체 장바구니 수량 합계
  page: number;
  size: number;
  totalElements: number;       // 전체 장바구니 상품 종류 수
  totalPages: number;
}

// 백엔드 CartItemResponse (담기 응답)
export interface AddCartItemResponse {
  cartItemId: number | null;
  itemId: number;
  quantity: number;
  message: string;
}

// 백엔드 UpdateCartItemResponse (수정 응답)
export interface UpdateCartItemResponse {
  itemId: number;
  quantity: number;
}

export interface AddCartItemRequest {
  itemId: number;        // ★ 백엔드 AddCartItemRequest 는 itemId (@NotNull) — productItemId 아님
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const cartApi = {
  getCart: async (): Promise<CartResponse> => {
    // 백엔드는 기본 20개씩 페이지로 잘라 보낸다(@PageableDefault size=20).
    // 장바구니는 '전체 선택 → 주문' 흐름이라 일부 페이지만 보이면 나머지 상품이
    // 화면에서 사라지고 주문에서도 누락된다. 백엔드 장바구니 상한이 50종(MAX_CART_ITEM_COUNT)이므로
    // size=50으로 전체를 한 번에 받아 누락을 막는다.
    const res = await apiClient.get<ApiResponse<CartResponse>>('/carts', {
      params: { size: 50 },
    });
    return res.data.data;
  },

  addItem: async (data: AddCartItemRequest): Promise<AddCartItemResponse> => {
    const res = await apiClient.post<ApiResponse<AddCartItemResponse>>('/carts/items', data);
    return res.data.data;
  },

  // ★ 수정/삭제 기준은 itemId (옵션 ID)
  updateQuantity: async (
    itemId: number,
    data: UpdateCartItemRequest
  ): Promise<UpdateCartItemResponse> => {
    const res = await apiClient.patch<ApiResponse<UpdateCartItemResponse>>(
      `/carts/items/${itemId}`,
      data
    );
    return res.data.data;
  },

  removeItem: async (itemId: number): Promise<void> => {
    await apiClient.delete(`/carts/items/${itemId}`);
  },
};
