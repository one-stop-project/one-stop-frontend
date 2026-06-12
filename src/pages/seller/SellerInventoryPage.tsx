import { PackagePlus } from 'lucide-react';
import { useSellerProductsQuery } from '@/hooks/queries/useSellerQuery';
import { PageSpinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';

export default function SellerInventoryPage() {
  const { data, isLoading } = useSellerProductsQuery(0, 50);

  if (isLoading) return <PageSpinner />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">재고 관리</h1>
      <p className="text-sm text-gray-600 mb-6">상품별 재고를 확인하고 입고 처리할 수 있습니다.</p>

      {data?.content.length === 0 ? (
        <EmptyState title="등록된 상품이 없습니다" />
      ) : (
        <div className="space-y-3">
          {data?.content.map((p) => (
            <div key={p.productId} className="card p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-100 rounded-lg shrink-0" />
                <div>
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.categoryNames.join(', ')}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-gray-500">누적 판매량</p>
                  <p className="text-lg font-bold text-gray-900">
                    {p.salesCount.toLocaleString()}
                  </p>
                </div>
                {/* 입고는 옵션(ProductItem) 단위 itemId가 필요하나, 목록 응답이 itemId를
                    노출하지 않아 비활성화. 백엔드가 옵션ID를 내려주면 옵션 선택 UI와 함께 연결 예정. */}
                <button
                  type="button"
                  disabled
                  title="옵션별 입고 기능은 준비 중입니다"
                  className="btn-secondary flex items-center gap-1 text-sm opacity-50 cursor-not-allowed"
                >
                  <PackagePlus size={16} />
                  입고
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
