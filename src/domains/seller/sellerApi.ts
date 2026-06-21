import { apiClient, ApiResponse, PageResponse } from '@/api/client';
import {
  ProductStatus,
  ProductItemStatus,
  OrderItemStatus,
  DeliveryStatus,
  SellerStatus,
} from '@/types/common';

// 백엔드 이미지 관련 응답 (실제 DTO에 맞춤)
// 이미지 한 장의 식별자·주소·대표여부 (개별 삭제/대표변경에 imageId 사용)
export interface ProductImageResponse {
  imageId: number;
  imageUrl: string;
  displayOrder: number;
  thumbnail: boolean;
}

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

// 백엔드 PopularTagResponse 와 1:1 (태그 자동완성)
export interface PopularTag {
  tag: string;
  usageCount: number;
}

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

// 백엔드 ProductUpdateRequest 와 1:1 (부분 수정 — 전달된 필드만)
export interface ProductUpdateRequest {
  name?: string;
  description?: string;
  thumbnailUrl?: string;
  categoryIds?: number[]; // 1~3개
  tags?: string[]; // null이면 변경 없음, 빈 배열이면 전체 삭제
}

// 백엔드 ProductItemResponse 와 1:1 (판매자용 — stock·옵션상태 노출)
export interface ProductItemResponse {
  itemId: number;
  optionName: string;
  price: number;
  stock: number;
  status: ProductItemStatus;
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

// 백엔드 ProductDetailResponse 와 1:1 (판매자/관리자용 상세 — GET /seller/products/{id} + 수정 응답)
// 구매자 상세와 달리 상품 상태·전체 옵션(STOP 포함)·옵션별 재고/상태를 노출, 조회수 미증가
export interface ProductDetailResponse {
  productId: number;
  name: string;
  description: string;
  thumbnailUrl: string | null;
  status: ProductStatus;
  viewCount: number;
  salesCount: number;
  shopName: string;
  optionNames: string[];
  items: ProductItemResponse[];
  imageUrls: string[];
  // 이미지별 id·대표여부 포함(개별 삭제/대표변경용). imageUrls와 병행 제공.
  // 구버전 배포 응답엔 없을 수 있어 optional로 둔다.
  images?: ProductImageResponse[];
  categoryNames: string[];
  tags: string[];
  // 관리자 반려 사유 — 상태가 REJECTED일 때만 채워지고 그 외에는 null
  rejectReason?: string | null;
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
//  판매자 내 상태
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 백엔드 SellerMyStatusResponse 와 1:1 — 판매자 본인 계정 상태 + 반려/정지 사유
// rejectReason·rejectedAt 은 반려/정지 이력이 있을 때만 채워지고 없으면 null
export interface SellerMyStatusResponse {
  sellerId: number;
  shopName: string;
  businessNumber: string;
  sellerStatus: SellerStatus;
  rejectReason: string | null;
  rejectedAt: string | null;
}

// 백엔드 SellerOrderStatusCountResponse 와 1:1 — 주문상품 상태별 건수
export interface SellerOrderStatusCountResponse {
  ordered: number;
  confirmed: number;
  shipping: number;
  delivered: number;
  cancelled: number;
  rejected: number;
  total: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const sellerApi = {
  // 상품
  // 인기 태그 자동완성 (keyword 앞부분(prefix) 일치, limit 1~10)
  getPopularTags: async (keyword?: string, limit = 10): Promise<PopularTag[]> => {
    const res = await apiClient.get<ApiResponse<PopularTag[]>>('/seller/products/tags/popular', {
      params: { keyword: keyword || undefined, limit },
    });
    return res.data.data;
  },

  // 판매자 전용 상품 단건 상세 (전체 옵션·재고·상태 포함, 조회수 미증가, 소유 검증)
  getMyProductDetail: async (productId: number): Promise<ProductDetailResponse> => {
    const res = await apiClient.get<ApiResponse<ProductDetailResponse>>(
      `/seller/products/${productId}`
    );
    return res.data.data;
  },

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

  // 판매자 본인 계정 상태 + 반려/정지 사유 (반려·정지 시에만 사유·시각 채워짐)
  getMySellerStatus: async (): Promise<SellerMyStatusResponse> => {
    const res = await apiClient.get<ApiResponse<SellerMyStatusResponse>>('/seller/me/status');
    return res.data.data;
  },

  // 대시보드 — 주문상품 상태별 건수
  getOrderStatusCounts: async (): Promise<SellerOrderStatusCountResponse> => {
    const res = await apiClient.get<ApiResponse<SellerOrderStatusCountResponse>>(
      '/seller/dashboard/order-counts'
    );
    return res.data.data;
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
  getMyOrders: async (
    page = 0,
    size = 20,
    status?: OrderItemStatus
  ): Promise<PageResponse<SellerOrderItem>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<SellerOrderItem>>>('/seller/orders', {
      params: { page, size, status },
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

  // 배송 상태 변경 (DEPARTURE → DELIVERING → FINAL_DELIVERY)
  updateDeliveryStatus: async (
    deliveryId: number,
    status: DeliveryStatus
  ): Promise<void> => {
    await apiClient.patch(`/seller/deliveries/${deliveryId}/status`, { status });
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  상품 이미지 관리 (누락 보강)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // 상품 이미지 추가 — multipart/form-data (images 파트 = 파일들)
  addProductImage: async (
    productId: number,
    images: File[]
  ): Promise<ProductImageAddResponse> => {
    const formData = new FormData();
    images.forEach((image) => formData.append('images', image));
    const res = await apiClient.post<ApiResponse<ProductImageAddResponse>>(
      `/seller/products/${productId}/images`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
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
