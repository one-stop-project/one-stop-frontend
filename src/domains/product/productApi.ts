import {apiClient, ApiResponse, PageResponse} from '@/api/client';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  공통 타입 — 백엔드 ProductSummaryResponse 와 1:1
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ProductSummary {
  productId: number;
  name: string;
  thumbnailUrl: string | null;
  minPrice: number;      // 백엔드: minPrice (price 아님!)
  salesCount: number;
  viewCount: number;
}

// 백엔드 ProductItemResponse 와 1:1
export interface ProductItem {
  itemId: number;
  optionName: string;    // 백엔드: optionName (name 아님!)
  price: number;
  soldOut: boolean;      // 백엔드는 구매자에게 재고 수량을 숨기고 품절 여부만 내려줌
}

// 백엔드 ProductDetailResponse 와 1:1
export interface ProductDetail {
  productId: number;
  name: string;
  description: string;
  thumbnailUrl: string | null;
  viewCount: number;
  salesCount: number;
  shopName: string;            // 백엔드: shopName (sellerName 아님!)
  optionNames: string[];
  items: ProductItem[];
  imageUrls: string[];         // 백엔드: imageUrls (images 아님!)
  categoryNames: string[];     // 백엔드: categoryNames
  tags: string[];
}

// 백엔드 PopularKeywordResponse 와 1:1
export interface PopularKeyword {
  rank: number;
  keyword: string;
  count: number;
}

// 백엔드 CategoryTreeResponse 와 1:1
export interface Category {
  id: number;            // 백엔드 CategoryTreeResponse 필드명은 id (categoryId 아님)
  name: string;
  children: Category[];
}

export interface ProductSearchParams {
  page?: number;
  size?: number;
  keyword?: string;
  categoryId?: number;
  // ★ 백엔드는 Spring Pageable 정렬 사용: "필드,방향" (예: "LATEST")
  sort?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const productApi = {
  // 상품 목록/검색 — Page 응답
  getList: async (params: ProductSearchParams = {}): Promise<PageResponse<ProductSummary>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<ProductSummary>>>('/products', {
      params,
    });
    return res.data.data;
  },

  // 인기 상품 — ★ 배열 응답(List), 파라미터는 limit (size 아님)
  getPopular: async (limit: number = 10): Promise<ProductSummary[]> => {
    const res = await apiClient.get<ApiResponse<ProductSummary[]>>('/products/popular', {
      params: { limit },
    });
    return res.data.data;
  },

  // 상품 상세
  getDetail: async (productId: number): Promise<ProductDetail> => {
    const res = await apiClient.get<ApiResponse<ProductDetail>>(`/products/${productId}`);
    return res.data.data;
  },

  // 관련 상품 — List 응답 (배열 맞음)
  getRelated: async (productId: number): Promise<ProductSummary[]> => {
    const res = await apiClient.get<ApiResponse<ProductSummary[]>>(
      `/products/${productId}/related`
    );
    return res.data.data;
  },

  // 카테고리 트리
  getCategories: async (): Promise<Category[]> => {
    const res = await apiClient.get<ApiResponse<Category[]>>('/categories');
    return res.data.data;
  },

  // 인기 검색어 — 배열 응답, 파라미터 limit(1~10)
  getPopularKeywords: async (limit = 10): Promise<PopularKeyword[]> => {
    const res = await apiClient.get<ApiResponse<PopularKeyword[]>>('/products/popular-keywords', {
      params: { limit },
    });
    return res.data.data;
  },
};
