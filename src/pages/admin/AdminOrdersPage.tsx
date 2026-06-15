import { useState, FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useAdminOrdersQuery, AdminOrderFilters } from '@/hooks/queries/useAdminQuery';
import { OrderStatus } from '@/types/common';
import { PageSpinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { formatPrice, formatDateTime } from '@/utils/format';

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'bg-gray-100 text-gray-700',
  PAID: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: '결제 대기',
  PAID: '결제 완료',
  CANCELLED: '취소',
};

export default function AdminOrdersPage() {
  const [page, setPage] = useState(0);
  const [statusInput, setStatusInput] = useState<OrderStatus | ''>('');
  const [keyword, setKeyword] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [filters, setFilters] = useState<AdminOrderFilters>({});

  const { data, isLoading } = useAdminOrdersQuery(page, 20, filters);

  const applyFilters = (e: FormEvent) => {
    e.preventDefault();
    if (from && to && from > to) {
      toast.error('시작일이 종료일보다 늦을 수 없습니다.');
      return;
    }
    setFilters({
      status: statusInput || undefined,
      keyword: keyword.trim() || undefined,
      from: from || undefined,
      to: to || undefined,
    });
    setPage(0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">전체 주문 조회</h1>

      {/* 필터 */}
      <form onSubmit={applyFilters} className="flex flex-wrap items-end gap-2 mb-6">
        <select
          value={statusInput}
          onChange={(e) => setStatusInput(e.target.value as OrderStatus | '')}
          className="input-field w-36"
        >
          <option value="">전체 상태</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <label className="flex flex-col text-xs text-gray-500">
          시작일
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input-field w-40" />
        </label>
        <label className="flex flex-col text-xs text-gray-500">
          종료일
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input-field w-40" />
        </label>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="구매자 이름·이메일"
          className="input-field flex-1 min-w-[160px]"
        />
        <button type="submit" className="btn-primary whitespace-nowrap">
          조회
        </button>
      </form>

      {isLoading ? (
        <PageSpinner />
      ) : data?.content.length === 0 ? (
        <EmptyState title="해당 조건의 주문이 없습니다" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">주문</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">구매자</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">상품수</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">금액</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">주문일시</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.content.map((o) => (
                <tr key={o.orderId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">주문 #{o.orderId}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <p className="font-medium text-gray-900">{o.userName}</p>
                    <p className="text-xs text-gray-500">{o.userEmail}</p>
                  </td>
                  <td className="px-6 py-4 text-sm">{o.itemCount}종</td>
                  <td className="px-6 py-4 text-sm font-semibold">{formatPrice(o.finalPrice)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(o.createdAt)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-700'}`}
                    >
                      {STATUS_LABELS[o.status] ?? o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={data.first} className="btn-secondary text-sm">
            이전
          </button>
          <span className="text-sm text-gray-600">{page + 1} / {data.totalPages}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={data.last} className="btn-secondary text-sm">
            다음
          </button>
        </div>
      )}
    </div>
  );
}
