import { apiClient, ApiResponse } from '@/api/client';
import { UserRole, UserStatus } from '@/types/common';

export interface UserMeResponse {
  userId: number;
  email: string;
  name: string;
  phone: string;
  address: string;
  detailAddress?: string | null; // 상세주소 — 값이 있을 때만 내려옴(NON_NULL)
  role: UserRole;
  status: UserStatus;
  social: boolean; // 소셜(OAuth2) 가입 여부 — 항상 존재
  provider?: string | null; // "kakao" 등 — 소셜 계정만
  subscription?: { active: boolean; endAt: string } | null;
  createdAt: string;
}

export interface UserUpdateRequest {
  name?: string;
  phone?: string;
  address?: string;
  detailAddress?: string;
}

export interface UserUpdateResponse {
  userId: number;
  name: string;
  phone: string;
  address: string;
  detailAddress?: string | null;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface WithdrawRequest {
  password: string;
}

export const userApi = {
  getMe: async (): Promise<UserMeResponse> => {
    const res = await apiClient.get<ApiResponse<UserMeResponse>>('/users/me');
    return res.data.data;
  },

  updateMe: async (data: UserUpdateRequest): Promise<UserUpdateResponse> => {
    const res = await apiClient.patch<ApiResponse<UserUpdateResponse>>('/users/me', data);
    return res.data.data;
  },

  changePassword: async (data: PasswordChangeRequest): Promise<void> => {
    await apiClient.patch('/users/me/password', data);
  },

  withdraw: async (data: WithdrawRequest): Promise<void> => {
    await apiClient.delete('/users/me', { data });
  },
};
