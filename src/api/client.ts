import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';

/**
 * API Client — JWT 인증 자동 처리
 *
 * 기능:
 * 1. Request 인터셉터: Authorization 헤더 자동 주입
 * 2. Response 인터셉터: 401 발생 시 자동 refresh + 재시도
 * 3. 에러 메시지 통일 처리
 * 4. credentials 포함 (HttpOnly RT 쿠키 전송)
 */

// 알림 SSE 등 axios를 거치지 않는 raw fetch에서도 같은 API 베이스를 쓰도록 내보낸다.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true, // ★ HttpOnly RT 쿠키 전송 필수
  headers: {
    'Content-Type': 'application/json',
  },
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Request 인터셉터 — Access Token 주입
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Response 인터셉터 — 401 자동 refresh
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let isRefreshing = false;
// token=문자열이면 갱신 성공(해당 토큰으로 재시도), null이면 갱신 실패(대기 요청을 실패로 깨움)
let refreshSubscribers: Array<(token: string | null) => void> = [];

function onTokenRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // 401 + 첫 시도 + refresh API가 아닐 때만 재시도
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/oauth2/exchange')
    ) {
      if (isRefreshing) {
        // 이미 refresh 중이면 큐에 대기
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((token: string | null) => {
            // 갱신 실패(token=null)면 대기 요청도 실패로 끝내 영구 멈춤(무한 스피너)을 막는다
            if (!token) {
              reject(error);
              return;
            }
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await apiClient.post<{
          data: { accessToken: string; expiresIn: number };
        }>('/auth/refresh');

        const newToken = data.data.accessToken;
        setAccessToken(newToken);

        onTokenRefreshed(newToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh 실패 → 대기 중인 요청들을 실패로 깨운 뒤(버리지 않음) 로그아웃 처리
        onTokenRefreshed(null);
        clearAccessToken();
        toast.error('세션이 만료되었습니다. 다시 로그인해주세요.');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 에러 메시지 표시 (선택적)
    // 검증 실패(@Valid) 응답은 errors[]에 필드별 사유가 담겨 옴 — 두루뭉술한 message 대신 실제 사유를 보여줌
    const data = error.response?.data;
    const fieldReason = data?.errors?.map((e) => e.reason).filter(Boolean).join('\n');
    const message = fieldReason || data?.message || '요청 처리 중 오류가 발생했습니다.';
    const code = data?.code;

    // 특정 에러만 자동 토스트 (silent 옵션 지원)
    if (!(originalRequest as any)?._silent) {
      if (error.response?.status && error.response.status >= 500) {
        toast.error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } else if (error.response?.status !== 401) {
        toast.error(message);
      }
    }

    return Promise.reject({
      ...error,
      code,
      message,
    });
  }
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Access Token 메모리 저장
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// 보안 정책:
// - AT는 메모리만 저장 (XSS 방어)
// - localStorage 사용 금지
// - 새로고침 시 사라지지만 refresh API로 즉시 복구

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function clearAccessToken() {
  accessToken = null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  공통 응답 타입
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: boolean;
  code: string;
  message: string;
  errors?: Array<{ field: string; reason: string }>;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}
