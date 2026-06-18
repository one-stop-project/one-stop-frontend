import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useSellerProductsQuery, useDeleteProductMutation } from '@/hooks/queries/useSellerQuery';
import { PageSpinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { formatPrice } from '@/utils/format';

const STATUS_COLORS: Record<string, string> = {
  APPROVE_REQUESTED: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  DISCONTINUED: 'bg-gray-100 text-gray-700',
  FORCE_INACTIVE: 'bg-orange-100 text-orange-700',
};

const STATUS_LABELS: Record<string, string> = {
  APPROVE_REQUESTED: '승인 요청',
  APPROVED: '판매 중',
  REJECTED: '반려됨',
  DISCONTINUED: '판매 중단',
  FORCE_INACTIVE: '강제 비활성',
};

export default function SellerProductsPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useSellerProductsQuery(page, 20);
  const deleteMutation = useDeleteProductMutation();

  if (isLoading) return <PageSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">상품 관리</h1>
        <Link to="/seller/products/new" className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          상품 등록
        </Link>
      </div>

      {data?.content.length === 0 ? (
        <EmptyState
          title="등록된 상품이 없습니다"
          description="첫 상품을 등록하고 판매를 시작해보세요!"
          action={
            <Link to="/seller/products/new" className="btn-primary inline-block">
              상품 등록하기
            </Link>
          }
        />
      ) : (
        <>
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  상품
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  가격
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                  판매량
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
                          onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
                          className="w-12 h-12 rounded object-cover shrink-0 bg-gray-100"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.categoryNames.join(', ')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{formatPrice(p.minPrice)}</td>
                  <td className="px-6 py-4 text-sm">{p.salesCount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[p.status]}`}
                    >
                      {STATUS_LABELS[p.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        to={`/seller/products/${p.productId}/edit`}
                        className="text-sm text-primary-600 hover:underline"
                      >
                        수정
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm('정말 삭제하시겠습니까?')) {
                            deleteMutation.mutate(p.productId);
                          }
                        }}
                        className="text-sm text-red-600 hover:underline"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          totalPages={data?.totalPages ?? 1}
          onChange={setPage}
        />
        </>
      )}
    </div>
  );
}
