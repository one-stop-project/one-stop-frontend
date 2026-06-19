import { apiClient, ApiResponse } from '@/api/client';

/**
 * 관리자 카테고리 관리 API
 * 백엔드: AdminCategoryController (/api/admin/categories)
 *
 * 누락 보강: 와이어프레임 adminKeywords.PNG 대응
 */

export interface CategoryCreateRequest {
  name: string;
  parentId?: number | null;
}

export interface CategoryUpdateRequest {
  name: string;
}

// 백엔드 CategoryResponse 와 1:1 — 생성/수정 응답은 트리(children)가 아니라
// 단일 노드(parentId 포함)를 돌려준다. 화면은 이 결과로 목록을 다시 불러온다.
export interface AdminCategory {
  id: number;
  name: string;
  parentId: number | null;
}

export const adminCategoryApi = {
  create: async (data: CategoryCreateRequest): Promise<AdminCategory> => {
    const res = await apiClient.post<ApiResponse<AdminCategory>>('/admin/categories', data);
    return res.data.data;
  },

  update: async (categoryId: number, data: CategoryUpdateRequest): Promise<AdminCategory> => {
    const res = await apiClient.patch<ApiResponse<AdminCategory>>(
      `/admin/categories/${categoryId}`,
      data
    );
    return res.data.data;
  },

  delete: async (categoryId: number): Promise<void> => {
    await apiClient.delete(`/admin/categories/${categoryId}`);
  },
};
