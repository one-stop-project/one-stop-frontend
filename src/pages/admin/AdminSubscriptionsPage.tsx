import { useState } from 'react';
import { Crown } from 'lucide-react';
import {
  useAdminSubscriptionStatsQuery,
  useAdminSubscriptionsQuery,
} from '@/hooks/queries/useAdminSubscriptionQuery';
import { SubscriptionStatus } from '@/domains/admin/subscriptionAdminApi';
import { PageSpinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDateTime } from '@/utils/format';

const STATUS_LABELS: Record<SubscriptionStatus, { text: string; color: string }> = {
  ACTIVE: { text: '구독 중', color: 'bg-green-100 text-green-700' },
  CANCELLED: { text: '해지', color: 'bg-yellow-100 text-yellow-700' },
  EXPIRED: { text: '만료', color: 'bg-gray-100 text-gray-600' },
};

export default function AdminSubscriptionsPage() {
  const [page, setPage] = useState(0);
  const { data: stats } = useAdminSubscriptionStatsQuery();
  const { data, isLoading } = useAdminSubscriptionsQuery(page, 20);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">구독 관리</h1>
      <p className="text-sm text-gray-600 mb-6">멤버십 구독 현황과 통계를 확인할 수 있습니다.</p>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="전체" value={stats?.totalCount} />
        <StatCard label="구독 중" value={stats?.activeCount} accent="text-green-600" />
        <StatCard label="해지" value={stats?.cancelledCount} accent="text-yellow-600" />
        <StatCard label="만료" value={stats?.expiredCount} accent="text-gray-500" />
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : !data || data.content.length === 0 ? (
        <EmptyState icon={<Crown size={40} />} title="구독 내역이 없습니다" />
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">회원</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">시작일</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">다음 결제</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">해지 사유</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.content.map((s) => (
                  <tr key={s.subscriptionId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <p className="font-medium">{s.userName}</p>
                      <p className="text-xs text-gray-500">{s.userEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${STATUS_LABELS[s.status].color}`}>
                        {STATUS_LABELS[s.status].text}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{formatDateTime(s.startAt)}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {s.nextPaymentDate ? formatDateTime(s.nextPaymentDate) : '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{s.cancelReason ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page <= 0} className="btn-secondary text-sm">
                이전
              </button>
              <span className="text-sm text-gray-600">{page + 1} / {data.totalPages}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= data.totalPages - 1} className="btn-secondary text-sm">
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, accent = 'text-gray-900' }: { label: string; value?: number; accent?: string }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent}`}>{value ?? '-'}</p>
    </div>
  );
}
