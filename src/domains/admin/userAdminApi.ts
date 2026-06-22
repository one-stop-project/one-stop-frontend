import { apiClient, ApiResponse, PageResponse } from '@/api/client';
import { UserRole, UserStatus } from '@/types/common';

/**
 * 관리자 권한 관리 API (SUPER_ADMIN 전용)
 * 백엔드: AdminUserController (/api/admin/users)
 */

// 백엔드 AdminUserResponse 와 1:1
export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export const userAdminApi = {
  // 관리자(ADMIN/SUPER_ADMIN) 목록 — 권한 회수 대상
  getAdminUsers: async (page = 0, size = 20): Promise<PageResponse<AdminUser>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<AdminUser>>>('/admin/users', {
      params: { page, size },
    });
    return res.data.data;
  },

  // 권한 부여 (BUYER → ADMIN)
  grant: async (userId: number): Promise<void> => {
    await apiClient.patch<ApiResponse<void>>(`/admin/users/${userId}/grant`);
  },

  // 권한 회수 (ADMIN → BUYER)
  revoke: async (userId: number): Promise<void> => {
    await apiClient.patch<ApiResponse<void>>(`/admin/users/${userId}/revoke`);
  },
};
