import { apiClient, PageResponse } from '@/api/client';

/**
 * 관리자 시스템 점검 API (SUPER_ADMIN 전용 다수)
 * 백엔드: PointAdminController (/api/admin/points), SecurityAuditController (/api/admin/security-audit)
 * 주의: 이 컨트롤러들은 ApiResponse 봉투를 쓰지 않고 데이터를 직접 반환한다 → res.data 로 읽는다.
 */

// ── 포인트 시스템 점검 ──────────────────────────────

// BE PointSystemStats
export interface PointSystemStats {
  totalCharged: number;
  totalEarned: number;
  totalUsed: number;
  totalRefunded: number;
  totalExpired: number;
  totalLiveBalance: number;
  accountingDiff: number;
  isConsistent: boolean;
}

// BE PointInconsistencyReport
export interface PointInconsistencyReport {
  userId: number;
  balance: number;
  remainingAmountSum: number;
  diff: number;
}

// ── 보안 감사 ──────────────────────────────────────

// 백엔드 Severity enum 과 1:1 (CRITICAL/HIGH/MEDIUM/INFO). 'AUTH'는 severity가 아니라
// category 값이라 여기서 제외한다.
export type SecuritySeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';

// BE SecurityAuditLog (주요 필드)
export interface SecurityAuditLog {
  id: number;
  eventType: string;
  severity: SecuritySeverity;
  category: string;
  actorUserId: number | null;
  actorEmail: string | null;
  actorRole: string | null;
  targetResource: string | null;
  targetId: string | null;
  result: string | null;
  errorCode: string | null;
  clientIp: string | null;
  requestUri: string | null;
  occurredAt: string;
}

export const systemAdminApi = {
  // 포인트 회계 통계 (SUPER_ADMIN)
  getPointStats: async (): Promise<PointSystemStats> => {
    const res = await apiClient.get<PointSystemStats>('/admin/points/stats');
    return res.data;
  },

  // 잔액 불일치 사용자 (SUPER_ADMIN)
  getPointInconsistencies: async (limit = 100): Promise<PointInconsistencyReport[]> => {
    const res = await apiClient.get<PointInconsistencyReport[]>('/admin/points/inconsistencies', {
      params: { limit },
    });
    return res.data;
  },

  // 포인트 만료 수동 실행 (SUPER_ADMIN)
  runPointExpiration: async (targetDate?: string): Promise<Record<string, string>> => {
    const res = await apiClient.post<Record<string, string>>('/admin/points/expire/run', null, {
      params: targetDate ? { targetDate } : {},
    });
    return res.data;
  },

  // 치명 보안 이벤트 (SUPER_ADMIN, 최근 hours 시간)
  getCriticalEvents: async (hours = 24, page = 0, size = 50): Promise<PageResponse<SecurityAuditLog>> => {
    const res = await apiClient.get<PageResponse<SecurityAuditLog>>('/admin/security-audit/critical', {
      params: { hours, page, size },
    });
    return res.data;
  },

  // 고위험 보안 이벤트 (SUPER_ADMIN, 최근 days 일)
  getHighRiskEvents: async (days = 7, page = 0, size = 50): Promise<PageResponse<SecurityAuditLog>> => {
    const res = await apiClient.get<PageResponse<SecurityAuditLog>>('/admin/security-audit/high-risk', {
      params: { days, page, size },
    });
    return res.data;
  },

  // 카테고리별 이벤트 집계 (최근 days 일)
  getAuditStatsByCategory: async (days = 7): Promise<Record<string, number>> => {
    const res = await apiClient.get<Record<string, number>>('/admin/security-audit/stats/by-category', {
      params: { days },
    });
    return res.data;
  },
};
