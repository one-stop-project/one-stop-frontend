import { useState } from 'react';
import { Check, X } from 'lucide-react';
import {
  useAdminProductsQuery,
  useApproveProductMutation,
  useRejectProductMutation,
} from '@/hooks/queries/useAdminQuery';
import { PageSpinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';

const STATUS_COLORS: Record<string, string> = {
  APPROVE_REQUESTED: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  DISCONTINUED: 'bg-gray-100 text-gray-700',
  FORCE_INACTIVE: 'bg-orange-100 text-orange-700',
};

const STATUS_LABELS: Record<string, string> = {
  APPROVE_REQUESTED: '승인 요청',
  APPROVED: '승인 완료',
  REJECTED: '반려',
  DISCONTINUED: '판매 중단',
  FORCE_INACTIVE: '강제 비활성',
};

export default function AdminProductsPage() {
  const [page, setPage] = useState(0);

  const { data, isLoading, isError } = useAdminProductsQuery(page, 20);
  const approveMutation = useApproveProductMutation();
  const rejectMutation = useRejectProductMutation();

  if (isLoading) return <PageSpinner />;
  if (isError) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <EmptyState title="상품 목록을 불러오지 못했습니다" description="잠시 후 다시 시도해주세요." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">상품 승인 관리</h1>
      <p className="text-sm text-gray-600 mb-6">승인 요청된 상품을 검토하고 승인/반려할 수 있습니다.</p>

      {data?.content.length === 0 ? (
        <EmptyState title="승인 대기 중인 상품이 없습니다" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  상품
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  판매자
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  상태
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.content.map((p) => (
                <tr key={p.productId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {p.thumbnailUrl ? (
                        <img
                          src={p.thumbnailUrl}
                          alt={p.name}
                          className="w-12 h-12 rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{p.name}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{p.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">판매자 #{p.sellerId}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[p.status]}`}>
                      {STATUS_LABELS[p.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {p.status === 'APPROVE_REQUESTED' && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => approveMutation.mutate(p.productId)}
                          disabled={approveMutation.isPending && approveMutation.variables === p.productId}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          title="승인"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('반려 사유를 입력하세요');
                            if (reason)
                              rejectMutation.mutate({ productId: p.productId, reason });
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="반려"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 페이지네이션 */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={data.first}
            className="btn-secondary text-sm"
          >
            이전
          </button>
          <span className="text-sm text-gray-600">
            {page + 1} / {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={data.last}
            className="btn-secondary text-sm"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
