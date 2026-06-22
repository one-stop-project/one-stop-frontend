import { apiClient, PageResponse } from '@/api/client';

// 백엔드 SecuritySeverity enum 과 1:1 (LOW/MEDIUM/HIGH/CRITICAL)
export type SecurityAuditSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface AdminAuditView {
  id: number;
  eventType: string;
  severity: SecurityAuditSeverity;
  category: string | null;
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

export type SecurityAuditCategoryStats = Record<string, number>;

// 주의: 이 엔드포인트들은 백엔드가 ApiResponse 봉투 없이 데이터를 직접 반환한다
// (SecurityAuditController — raw Spring Page / Map) → res.data 로 읽는다.
export const securityAuditApi = {
  getCritical: async (hours = 24, page = 0, size = 20): Promise<PageResponse<AdminAuditView>> => {
    const res = await apiClient.get<PageResponse<AdminAuditView>>(
      '/admin/security-audit/critical',
      { params: { hours, page, size } },
    );
    return res.data;
  },

  getHighRisk: async (days = 7, page = 0, size = 20): Promise<PageResponse<AdminAuditView>> => {
    const res = await apiClient.get<PageResponse<AdminAuditView>>(
      '/admin/security-audit/high-risk',
      { params: { days, page, size } },
    );
    return res.data;
  },

  getStatsByCategory: async (days = 7): Promise<SecurityAuditCategoryStats> => {
    const res = await apiClient.get<SecurityAuditCategoryStats>(
      '/admin/security-audit/stats/by-category',
      { params: { days } },
    );
    return res.data;
  },
};
