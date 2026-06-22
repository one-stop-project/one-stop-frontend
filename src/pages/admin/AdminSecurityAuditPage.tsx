import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, BarChart3, ShieldAlert } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { Spinner } from '@/components/common/Spinner';
import {
  AdminAuditView,
  securityAuditApi,
  SecurityAuditSeverity,
} from '@/domains/admin/securityAuditApi';
import { formatDateTime } from '@/utils/format';

const PAGE_SIZE = 20;

const SEVERITY_STYLE: Record<SecurityAuditSeverity, string> = {
  CRITICAL: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW: 'bg-gray-100 text-gray-600',
};

export default function AdminSecurityAuditPage({ embedded = false }: { embedded?: boolean }) {
  const [criticalPage, setCriticalPage] = useState(0);
  const [highRiskPage, setHighRiskPage] = useState(0);

  const statsQuery = useQuery({
    queryKey: ['admin', 'security-audit', 'stats', 7],
    queryFn: () => securityAuditApi.getStatsByCategory(7),
  });
  const criticalQuery = useQuery({
    queryKey: ['admin', 'security-audit', 'critical', 24, criticalPage, PAGE_SIZE],
    queryFn: () => securityAuditApi.getCritical(24, criticalPage, PAGE_SIZE),
  });
  const highRiskQuery = useQuery({
    queryKey: ['admin', 'security-audit', 'high-risk', 7, highRiskPage, PAGE_SIZE],
    queryFn: () => securityAuditApi.getHighRisk(7, highRiskPage, PAGE_SIZE),
  });

  const categoryStats = Object.entries(statsQuery.data ?? {}).sort(([, a], [, b]) => b - a);

  return (
    <div className={embedded ? '' : 'mx-auto max-w-7xl px-4 py-8'}>
      {!embedded && <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <ShieldAlert className="text-red-600" size={24} />
          <h1 className="text-2xl font-bold text-gray-900">보안 감사 로그</h1>
        </div>
        <p className="text-sm text-gray-600">치명적 이벤트와 고위험 활동을 한눈에 점검합니다.</p>
      </div>}

      <section className="mb-10" aria-labelledby="category-stats-heading">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="text-blue-600" size={18} />
          <h2 id="category-stats-heading" className="font-semibold text-gray-900">
            카테고리별 이벤트 · 최근 7일
          </h2>
        </div>
        {statsQuery.isLoading ? (
          <LoadingPanel />
        ) : categoryStats.length === 0 ? (
          <div className="card px-5 py-8 text-center text-sm text-gray-500">집계된 이벤트가 없습니다.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categoryStats.map(([category, count]) => (
              <div key={category} className="card border-l-4 border-l-blue-500 p-5">
                <p className="truncate text-xs font-medium uppercase tracking-wide text-gray-500">{category}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{count.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <AuditSection
        title="Critical 이벤트 · 최근 24시간"
        description="즉시 확인이 필요한 치명적 보안 이벤트입니다."
        icon={<AlertTriangle className="text-red-600" size={18} />}
        events={criticalQuery.data?.content}
        isLoading={criticalQuery.isLoading}
        page={criticalPage}
        totalPages={criticalQuery.data?.totalPages ?? 0}
        onPageChange={setCriticalPage}
      />

      <AuditSection
        title="High-Risk 이벤트 · 최근 7일"
        description="Critical 및 High 등급의 고위험 이벤트입니다."
        icon={<ShieldAlert className="text-orange-600" size={18} />}
        events={highRiskQuery.data?.content}
        isLoading={highRiskQuery.isLoading}
        page={highRiskPage}
        totalPages={highRiskQuery.data?.totalPages ?? 0}
        onPageChange={setHighRiskPage}
      />
    </div>
  );
}

interface AuditSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  events?: AdminAuditView[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function AuditSection({
  title,
  description,
  icon,
  events,
  isLoading,
  page,
  totalPages,
  onPageChange,
}: AuditSectionProps) {
  return (
    <section className="mb-10">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="font-semibold text-gray-900">{title}</h2>
        </div>
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      </div>

      {isLoading ? (
        <LoadingPanel />
      ) : !events || events.length === 0 ? (
        <div className="card">
          <EmptyState icon={<ShieldAlert size={36} />} title="해당 기간의 이벤트가 없습니다" />
        </div>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <TableHead>등급</TableHead>
                  <TableHead>카테고리 / 이벤트</TableHead>
                  <TableHead>행위자</TableHead>
                  <TableHead>대상</TableHead>
                  <TableHead>결과</TableHead>
                  <TableHead>IP / 요청 URI</TableHead>
                  <TableHead>발생 시각</TableHead>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.map((event) => (
                  <AuditRow key={event.id} event={event} />
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        </>
      )}
    </section>
  );
}

function AuditRow({ event }: { event: AdminAuditView }) {
  return (
    <tr className="align-top transition-colors hover:bg-gray-50">
      <td className="px-4 py-3">
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${SEVERITY_STYLE[event.severity]}`}>
          {event.severity}
        </span>
      </td>
      <td className="px-4 py-3">
        <p className="text-xs font-medium text-gray-500">{event.category ?? '미분류'}</p>
        <p className="mt-1 text-sm font-medium text-gray-900">{event.eventType}</p>
      </td>
      <td className="px-4 py-3 text-xs text-gray-600">
        <p>{event.actorEmail ?? (event.actorUserId ? `#${event.actorUserId}` : '비인증')}</p>
        {event.actorRole && <p className="mt-1 text-gray-400">{event.actorRole}</p>}
      </td>
      <td className="px-4 py-3 text-xs text-gray-600">
        <p>{event.targetResource ?? '-'}</p>
        {event.targetId && <p className="mt-1 text-gray-400">#{event.targetId}</p>}
      </td>
      <td className="px-4 py-3 text-xs">
        <p className={event.result === 'SUCCESS' ? 'text-green-700' : 'text-red-600'}>{event.result ?? '-'}</p>
        {event.errorCode && <p className="mt-1 text-red-500">{event.errorCode}</p>}
      </td>
      <td className="max-w-xs px-4 py-3 text-xs text-gray-500">
        <p>{event.clientIp ?? '-'}</p>
        <p className="mt-1 truncate" title={event.requestUri ?? undefined}>{event.requestUri ?? '-'}</p>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{formatDateTime(event.occurredAt)}</td>
    </tr>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{children}</th>;
}

function LoadingPanel() {
  return <div className="card flex justify-center py-12"><Spinner /></div>;
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-center gap-3">
      <button className="btn-secondary text-sm" disabled={page === 0} onClick={() => onPageChange(page - 1)}>
        이전
      </button>
      <span className="text-sm text-gray-600">{page + 1} / {totalPages}</span>
      <button
        className="btn-secondary text-sm"
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
      >
        다음
      </button>
    </div>
  );
}
