import { apiClient, ApiResponse, PageResponse } from '@/api/client';
import {
  ProductStatus,
  ProductItemStatus,
  OrderItemStatus,
  DeliveryStatus,
} from '@/types/common';

// 백엔드 이미지 관련 응답 (실제 DTO에 맞춤)
export interface ProductImageAddResponse {
  addedImageCount: number;
  totalImageCount: number;
  thumbnailUrl: string;
}

export interface ProductImageDeleteResponse {
  deletedImageId: number;
  remainingImageCount: number;
  thumbnailUrl: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  판매자 상품
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface SellerProduct {
  productId: number;
  name: string;
  status: ProductStatus;
  thumbnailUrl: string | null;
  minPrice: number;
  salesCount: number;
  categoryNames: string[];
}

// 백엔드 ProductItemCreateRequest 와 1:1 (옵션값 1~5 슬롯 + 가격/재고)
export interface ProductItemCreateRequest {
  optionValue1?: string;
  optionValue2?: string;
  optionValue3?: string;
  optionValue4?: string;
  optionValue5?: string;
  price: number;
  stock: number;
}

// 백엔드 ProductCreateRequest(data 파트) 와 1:1 — 최상위 price 없음, categoryIds 배열
export interface ProductCreateRequest {
  name: string;
  description: string;
  categoryIds: number[]; // 1~3개
  tags?: string[]; // 최대 10개
  optionNames?: string[]; // 최대 5개
  items: ProductItemCreateRequest[]; // 1~5개
}

export interface ProductUpdateRequest {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: number;
}

// 백엔드 ProductItemResponse 와 1:1 (판매자용 — stock 노출)
export interface ProductItemResponse {
  itemId: number;
  optionName: string;
  price: number;
  stock: number;
}

// 백엔드 ItemUpdateRequest 와 1:1 (전달된 필드만 수정, 모두 선택)
export interface ItemUpdateRequest {
  price?: number;
  stock?: number;
  status?: ProductItemStatus;
}

// 백엔드 ItemUpdateResponse 와 1:1
export interface ItemUpdateResponse {
  itemId: number;
  price: number;
  stock: number;
  status: ProductItemStatus;
}

// 백엔드 InboundResponse 와 1:1
export interface InboundResponse {
  itemId: number;
  previousStock: number;
  addedQuantity: number;
  currentStock: number;
}

// 백엔드 ProductCreateResponse 와 1:1
export interface ProductCreateResponse {
  productId: number;
  name: string;
  status: ProductStatus;
  items: ProductItemResponse[];
}

// 백엔드 ProductDetailResponse 와 1:1 (상품 수정 응답)
export interface ProductDetailResponse {
  productId: number;
  name: string;
  description: string;
  thumbnailUrl: string | null;
  viewCount: number;
  salesCount: number;
  shopName: string;
  optionNames: string[];
  items: ProductItemResponse[];
  imageUrls: string[];
  categoryNames: string[];
  tags: string[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  판매자 주문
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface SellerOrderItem {
  orderItemId: number;
  orderId: number;
  deliveryId: number;
  itemName: string;
  quantity: number;
  price: number;
  subtotal: number;
  buyerName: string; // 주문자(계정) 이름, 마스킹됨
  receiverAddress: string;
  orderItemStatus: OrderItemStatus;
  deliveryStatus: DeliveryStatus;
  orderedAt: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const sellerApi = {
  // 상품
  getMyProducts: async (page = 0, size = 20): Promise<PageResponse<SellerProduct>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<SellerProduct>>>('/seller/products', {
      params: { page, size },
    });
    return res.data.data;
  },

  // 상품 등록 — multipart/form-data (data 파트 = 상품 JSON, images 파트 = 이미지 파일 1~10장)
  createProduct: async (
    data: ProductCreateRequest,
    images: File[]
  ): Promise<ProductCreateResponse> => {
    const formData = new FormData();
    // data 파트는 application/json 으로 보내야 @RequestPart 가 역직렬화함
    formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    images.forEach((image) => formData.append('images', image));

    const res = await apiClient.post<ApiResponse<ProductCreateResponse>>(
      '/seller/products',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data.data;
  },

  updateProduct: async (
    productId: number,
    data: ProductUpdateRequest
  ): Promise<ProductDetailResponse> => {
    const res = await apiClient.patch<ApiResponse<ProductDetailResponse>>(
      `/seller/products/${productId}`,
      data
    );
    return res.data.data;
  },

  deleteProduct: async (productId: number): Promise<void> => {
    await apiClient.delete(`/seller/products/${productId}`);
  },

  // 재고 입고 (옵션 itemId 기준, reason 선택)
  inbound: async (
    itemId: number,
    data: { quantity: number; reason?: string }
  ): Promise<InboundResponse> => {
    const res = await apiClient.post<ApiResponse<InboundResponse>>(
      `/seller/items/${itemId}/inbound`,
      data
    );
    return res.data.data;
  },

  updateItem: async (
    itemId: number,
    data: ItemUpdateRequest
  ): Promise<ItemUpdateResponse> => {
    const res = await apiClient.patch<ApiResponse<ItemUpdateResponse>>(
      `/seller/items/${itemId}`,
      data
    );
    return res.data.data;
  },

  // 주문
  getMyOrders: async (page = 0, size = 20): Promise<PageResponse<SellerOrderItem>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<SellerOrderItem>>>('/seller/orders', {
      params: { page, size },
    });
    return res.data.data;
  },

  confirmOrder: async (orderItemId: number): Promise<void> => {
    await apiClient.post(`/seller/orders/${orderItemId}/confirm`);
  },

  rejectOrder: async (orderItemId: number, reason: string): Promise<void> => {
    await apiClient.post(`/seller/orders/${orderItemId}/reject`, { reason });
  },

  shipDelivery: async (
    deliveryId: number,
    data: { deliveryCompany: string; invoiceNumber: string }
  ): Promise<void> => {
    await apiClient.post(`/seller/deliveries/${deliveryId}/ship`, data);
  },

  // 배송 상태 변경 (누락 보강)
  updateDeliveryStatus: async (deliveryId: number, status: string): Promise<void> => {
    await apiClient.patch(`/seller/deliveries/${deliveryId}/status`, { status });
  },

  // 주문 거절 (누락 보강)
  rejectOrderItem: async (orderItemId: number, reason: string): Promise<void> => {
    await apiClient.post(`/seller/orders/${orderItemId}/reject`, { reason });
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  상품 이미지 관리 (누락 보강)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  addProductImage: async (
    productId: number,
    imageUrls: string[]
  ): Promise<ProductImageAddResponse> => {
    const res = await apiClient.post<ApiResponse<ProductImageAddResponse>>(
      `/seller/products/${productId}/images`,
      { imageUrls }
    );
    return res.data.data;
  },

  deleteProductImage: async (
    productId: number,
    imageId: number
  ): Promise<ProductImageDeleteResponse> => {
    const res = await apiClient.delete<ApiResponse<ProductImageDeleteResponse>>(
      `/seller/products/${productId}/images/${imageId}`
    );
    return res.data.data;
  },

  setThumbnail: async (productId: number, imageId: number): Promise<void> => {
    await apiClient.patch(`/seller/products/${productId}/images/${imageId}/thumbnail`);
  },
};
