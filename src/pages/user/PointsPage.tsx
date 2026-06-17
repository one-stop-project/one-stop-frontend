import { useState } from 'react';
import { Coins } from 'lucide-react';
import { usePointsQuery } from '@/hooks/queries/usePointQuery';
import { PointHistoryType } from '@/domains/point/pointApi';
import { PageSpinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate } from '@/utils/format';

const TYPE_LABELS: Record<PointHistoryType, string> = {
  CHARGE: '충전',
  EARN: '적립',
  USE: '사용',
  REFUND: '환불',
  EXPIRE: '만료',
};

// 차감 유형(빨강, - 표기) vs 적립 유형(초록, + 표기)
const DEDUCTION: PointHistoryType[] = ['USE', 'EXPIRE'];

export default function PointsPage() {
  const [page, setPage] = useState(0);
  const [type, setType] = useState<PointHistoryType | ''>('');
  const { data, isLoading, isError } = usePointsQuery(page, 20, type || undefined);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">포인트</h1>

      {/* 잔액 */}
      <section className="card p-6 mb-4">
        <div className="flex items-center gap-2 text-gray-500 mb-1">
          <Coins size={18} className="text-primary-600" />
          <span className="text-sm">보유 포인트</span>
        </div>
        <p className="text-3xl font-bold text-gray-900">
          {data ? data.balance.toLocaleString() : '—'}
          <span className="text-lg font-medium text-gray-500 ml-1">P</span>
        </p>
        {data?.expiringSoon && data.expiringSoon.amount > 0 && data.expiringSoon.expireAt && (
          <p className="text-xs text-red-500 mt-2">
            {data.expiringSoon.amount.toLocaleString()}P가 {formatDate(data.expiringSoon.expireAt)} 만료 예정
          </p>
        )}
      </section>

      {/* 이력 */}
      <section className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">적립/사용 내역</h2>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value as PointHistoryType | '');
              setPage(0);
            }}
            className="input-field w-32"
          >
            <option value="">전체</option>
            {(Object.keys(TYPE_LABELS) as PointHistoryType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <PageSpinner />
        ) : isError ? (
          <EmptyState title="포인트 내역을 불러오지 못했습니다" />
        ) : !data || data.history.content.length === 0 ? (
          <EmptyState title="포인트 내역이 없습니다" />
        ) : (
          <ul className="divide-y divide-gray-100">
            {data.history.content.map((h) => {
              const minus = DEDUCTION.includes(h.type);
              return (
                <li key={h.historyId} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 mr-2">
                        {TYPE_LABELS[h.type]}
                      </span>
                      {h.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(h.createdAt)}</p>
                  </div>
                  <span className={`text-sm font-semibold shrink-0 ${minus ? 'text-red-500' : 'text-green-600'}`}>
                    {minus ? '-' : '+'}
                    {Math.abs(h.amount).toLocaleString()}P
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {data && data.history.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn-secondary text-sm"
            >
              이전
            </button>
            <span className="text-sm text-gray-600">
              {page + 1} / {data.history.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page + 1 >= data.history.totalPages}
              className="btn-secondary text-sm"
            >
              다음
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
