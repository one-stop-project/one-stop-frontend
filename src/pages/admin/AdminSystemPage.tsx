import { useState } from 'react';
import { ShieldAlert, Coins, AlertTriangle, CheckCircle2, PlayCircle } from 'lucide-react';
import {
  usePointStatsQuery,
  usePointInconsistenciesQuery,
  useRunPointExpirationMutation,
  useCriticalEventsQuery,
  useHighRiskEventsQuery,
  useAuditStatsByCategoryQuery,
} from '@/hooks/queries/useAdminSystemQuery';
import { SecuritySeverity, SecurityAuditLog } from '@/domains/admin/systemAdminApi';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { formatPrice, formatDateTime } from '@/utils/format';

const SEVERITY_COLOR: Record<SecuritySeverity, string> = {
  CRITICAL: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  INFO: 'bg-gray-100 text-gray-600',
  AUTH: 'bg-blue-100 text-blue-700',
};

type AuditTab = 'critical' | 'high-risk';

export default function AdminSystemPage() {
  const { data: stats, isLoading: statsLoading } = usePointStatsQuery();
  const { data: inconsistencies } = usePointInconsistenciesQuery(100);
  const runExpire = useRunPointExpirationMutation();

  const [tab, setTab] = useState<AuditTab>('critical');
  const { data: critical, isLoading: criticalLoading } = useCriticalEventsQuery(24, 0, 50);
  const { data: highRisk, isLoading: highRiskLoading } = useHighRiskEventsQuery(7, 0, 50);
  const { data: categoryStats } = useAuditStatsByCategoryQuery(7);

  const events = tab === 'critical' ? critical : highRisk;
  const eventsLoading = tab === 'critical' ? criticalLoading : highRiskLoading;

  const handleRunExpire = () => {
    if (!window.confirm('포인트 만료 처리를 지금 실행할까요? (기준일: 오늘)')) return;
    runExpire.mutate(undefined);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">시스템 점검</h1>
      <p className="text-sm text-gray-600 mb-6">
        포인트 회계 정합성과 보안 감사 로그를 점검합니다. 최고관리자(SUPER_ADMIN) 전용입니다.
      </p>

      {/* ── 포인트 회계 점검 ── */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Coins size={18} className="text-blue-600" />
          <h2 className="font-semibold text-gray-900">포인트 회계</h2>
        </div>

        {statsLoading ? (
          <div className="py-10 flex justify-center"><Spinner /></div>
        ) : stats ? (
          <>
            {/* 정합성 배너 */}
            <div
              className={`flex items-center gap-2 rounded-lg px-4 py-3 mb-4 text-sm ${
                stats.isConsistent ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {stats.isConsistent ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              {stats.isConsistent
                ? '회계 정합성 정상 — 발행과 잔액이 일치합니다.'
                : `회계 불일치 감지 — 차액 ${formatPrice(stats.accountingDiff)}P`}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
              <PointStat label="총 충전" value={stats.totalCharged} />
              <PointStat label="총 적립" value={stats.totalEarned} />
              <PointStat label="총 사용" value={stats.totalUsed} />
              <PointStat label="총 환불" value={stats.totalRefunded} />
              <PointStat label="총 만료" value={stats.totalExpired} />
              <PointStat label="현재 잔액 합계" value={stats.totalLiveBalance} accent="text-blue-600" />
            </div>

            <button onClick={handleRunExpire} disabled={runExpire.isPending} className="btn-secondary text-sm inline-flex items-center gap-1.5">
              <PlayCircle size={16} />
              {runExpire.isPending ? '실행 중...' : '포인트 만료 수동 실행'}
            </button>

            {/* 잔액 불일치 사용자 */}
            {inconsistencies && inconsistencies.length > 0 && (
              <div className="card overflow-x-auto mt-5">
                <p className="px-4 py-3 text-sm font-medium text-red-600 border-b border-gray-200">
                  잔액 불일치 사용자 {inconsistencies.length}명
                </p>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">회원</th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase">기록 잔액</th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase">실제 합계</th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase">차액</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {inconsistencies.map((r) => (
                      <tr key={r.userId} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-700">#{r.userId}</td>
                        <td className="px-4 py-2 text-sm text-right">{formatPrice(r.balance)}P</td>
                        <td className="px-4 py-2 text-sm text-right">{formatPrice(r.remainingAmountSum)}P</td>
                        <td className="px-4 py-2 text-sm text-right font-medium text-red-600">{formatPrice(r.diff)}P</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : null}
      </section>

      {/* ── 보안 감사 ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert size={18} className="text-blue-600" />
          <h2 className="font-semibold text-gray-900">보안 감사</h2>
        </div>

        {/* 카테고리별 집계 (최근 7일) */}
        {categoryStats && Object.keys(categoryStats).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {Object.entries(categoryStats).map(([cat, count]) => (
              <span key={cat} className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
                {cat} <span className="font-semibold">{count.toLocaleString()}</span>
              </span>
            ))}
          </div>
        )}

        {/* 탭 */}
        <div className="flex gap-2 mb-4">
          <TabButton active={tab === 'critical'} onClick={() => setTab('critical')}>
            치명 (최근 24시간)
          </TabButton>
          <TabButton active={tab === 'high-risk'} onClick={() => setTab('high-risk')}>
            고위험 (최근 7일)
          </TabButton>
        </div>

        {eventsLoading ? (
          <div className="py-10 flex justify-center"><Spinner /></div>
        ) : !events || events.content.length === 0 ? (
          <EmptyState icon={<ShieldAlert size={36} />} title="해당 기간의 이벤트가 없습니다" />
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">위협도</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">이벤트</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">행위자</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">대상/요청</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">IP</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">시각</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.content.map((e: SecurityAuditLog) => (
                  <tr key={e.id} className="hover:bg-gray-50 align-top">
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${SEVERITY_COLOR[e.severity] ?? 'bg-gray-100 text-gray-600'}`}>
                        {e.severity}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">{e.eventType}</td>
                    <td className="px-4 py-2 text-xs text-gray-600">
                      {e.actorEmail ?? (e.actorUserId ? `#${e.actorUserId}` : '비인증')}
                      {e.actorRole ? <span className="text-gray-400"> · {e.actorRole}</span> : null}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500 max-w-xs truncate">
                      {e.requestUri ?? e.targetResource ?? '-'}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-500">{e.clientIp ?? '-'}</td>
                    <td className="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">{formatDateTime(e.occurredAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function PointStat({ label, value, accent = 'text-gray-900' }: { label: string; value: number; accent?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${accent}`}>{formatPrice(value)}<span className="text-xs font-normal text-gray-400">P</span></p>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm rounded-lg font-medium ${
        active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}
