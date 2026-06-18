import { useState } from 'react';
import { TrendingUp, History } from 'lucide-react';
import {
  usePopularKeywordsQuery,
  useActionHistoriesQuery,
} from '@/hooks/queries/useAdminAnalyticsQuery';
import { AdminActionTarget, AdminActionType } from '@/domains/admin/analyticsAdminApi';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDateTime } from '@/utils/format';

const TARGET_LABELS: Record<AdminActionTarget, string> = {
  SELLER: '판매자',
  PRODUCT: '상품',
  ADMIN_USER: '관리자',
};

const ACTION_LABELS: Record<AdminActionType, { text: string; color: string }> = {
  APPROVE: { text: '승인', color: 'bg-green-100 text-green-700' },
  REJECT: { text: '반려', color: 'bg-red-100 text-red-700' },
  FORCE_INACTIVE: { text: '강제 비활성', color: 'bg-red-100 text-red-700' },
  REACTIVATE: { text: '재활성화', color: 'bg-blue-100 text-blue-700' },
  GRANT_ADMIN: { text: '권한 부여', color: 'bg-purple-100 text-purple-700' },
  REVOKE_ADMIN: { text: '권한 회수', color: 'bg-gray-100 text-gray-600' },
};

export default function AdminAnalyticsPage() {
  const [date, setDate] = useState('');
  const { data: keywordData, isLoading: keywordLoading } = usePopularKeywordsQuery(date || undefined, 20);

  const [page, setPage] = useState(0);
  const { data: historyData, isLoading: historyLoading } = useActionHistoriesQuery(page, 20);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">운영 분석</h1>
      <p className="text-sm text-gray-600 mb-6">인기 검색어와 관리자 처리 이력을 확인합니다.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 인기 검색어 */}
        <section className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600" />
              <h2 className="font-semibold text-gray-900">인기 검색어</h2>
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input text-sm py-1.5"
            />
          </div>
          <p className="text-xs text-gray-500 mb-3">
            기준일: {keywordData?.date ?? (date || '오늘')}
          </p>

          {keywordLoading ? (
            <div className="py-10 flex justify-center"><Spinner /></div>
          ) : !keywordData || keywordData.keywords.length === 0 ? (
            <EmptyState icon={<TrendingUp size={36} />} title="검색어 데이터가 없습니다" />
          ) : (
            <ol className="divide-y divide-gray-100">
              {keywordData.keywords.map((k) => (
                <li key={k.rank} className="flex items-center gap-3 py-2.5">
                  <span className={`w-6 text-center font-bold text-sm ${k.rank <= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                    {k.rank}
                  </span>
                  <span className="flex-1 text-sm text-gray-900">{k.keyword}</span>
                  <span className="text-xs text-gray-500">{k.count.toLocaleString()}회</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* 관리자 처리 이력 */}
        <section className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <History size={18} className="text-blue-600" />
            <h2 className="font-semibold text-gray-900">처리 이력</h2>
          </div>

          {historyLoading ? (
            <div className="py-10 flex justify-center"><Spinner /></div>
          ) : !historyData || historyData.content.length === 0 ? (
            <EmptyState icon={<History size={36} />} title="처리 이력이 없습니다" />
          ) : (
            <>
              <ul className="divide-y divide-gray-100">
                {historyData.content.map((h) => {
                  const action = ACTION_LABELS[h.action] ?? { text: h.action, color: 'bg-gray-100 text-gray-600' };
                  return (
                    <li key={h.id} className="py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${action.color}`}>{action.text}</span>
                        <span className="text-sm text-gray-900">
                          {TARGET_LABELS[h.targetType] ?? h.targetType} #{h.targetId}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>처리자 #{h.actorId}{h.reason ? ` · ${h.reason}` : ''}</span>
                        <span>{formatDateTime(h.createdAt)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {historyData.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page <= 0} className="btn-secondary text-sm">
                    이전
                  </button>
                  <span className="text-sm text-gray-600">{page + 1} / {historyData.totalPages}</span>
                  <button onClick={() => setPage((p) => p + 1)} disabled={page >= historyData.totalPages - 1} className="btn-secondary text-sm">
                    다음
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
