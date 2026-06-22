import { apiClient, ApiResponse, PageResponse } from '@/api/client';

export type SecurityAuditSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';

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

export const securityAuditApi = {
  getCritical: async (hours = 24, page = 0, size = 20): Promise<PageResponse<AdminAuditView>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<AdminAuditView>>>(
      '/admin/security-audit/critical',
      { params: { hours, page, size } },
    );
    return res.data.data;
  },

  getHighRisk: async (days = 7, page = 0, size = 20): Promise<PageResponse<AdminAuditView>> => {
    const res = await apiClient.get<ApiResponse<PageResponse<AdminAuditView>>>(
      '/admin/security-audit/high-risk',
      { params: { days, page, size } },
    );
    return res.data.data;
  },

  getStatsByCategory: async (days = 7): Promise<SecurityAuditCategoryStats> => {
    const res = await apiClient.get<ApiResponse<SecurityAuditCategoryStats>>(
      '/admin/security-audit/stats/by-category',
      { params: { days } },
    );
    return res.data.data;
  },
};
