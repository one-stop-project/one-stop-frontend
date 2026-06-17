import {apiClient, ApiResponse} from '@/api/client';
import {UserRole} from '@/types/common';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Request DTO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface SignUpRequest {
    email: string;
    password: string;
    name: string;
    phone: string;
    address: string;
    role: UserRole;            // ★ 추가 — 백엔드 @NotNull UserRole 충족 ('BUYER' | 'SELLER')
    shopName?: string;
    businessNumber?: string;
    bankAccount?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Response DTO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface SignUpResponse {
  userId: number;
  email: string;
  name: string;
  role: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  userId: number;
  email: string;
  name: string;
  role: UserRole;
}

export interface TokenRefreshResponse {
  accessToken: string;
  expiresIn: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  API 호출 함수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const authApi = {
  signup: async (data: SignUpRequest): Promise<SignUpResponse> => {
    const res = await apiClient.post<ApiResponse<SignUpResponse>>('/auth/signup', data);
    return res.data.data;
  },

  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data);
    return res.data.data;
  },

  refresh: async (): Promise<TokenRefreshResponse> => {
    const res = await apiClient.post<ApiResponse<TokenRefreshResponse>>('/auth/refresh');
    return res.data.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  // 소셜 로그인 성공 후 받은 일회용 code를 Access Token으로 교환 (refresh_token/device_id는 쿠키)
  exchangeOAuth2: async (code: string): Promise<TokenRefreshResponse> => {
    const res = await apiClient.post<ApiResponse<TokenRefreshResponse>>('/auth/oauth2/exchange', {
      code,
    });
    return res.data.data;
  },
};
