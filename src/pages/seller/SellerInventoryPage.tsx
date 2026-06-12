import { useState } from 'react';
import { PackagePlus, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSellerProductsQuery, useInboundMutation } from '@/hooks/queries/useSellerQuery';
import { useProductDetailQuery } from '@/hooks/queries/useProductQuery';
import { PageSpinner, Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { SellerProduct } from '@/domains/seller/sellerApi';
import { ProductItem } from '@/domains/product/productApi';
import { formatPrice } from '@/utils/format';

export default function SellerInventoryPage() {
  const { data, isLoading } = useSellerProductsQuery(0, 50);

  if (isLoading) return <PageSpinner />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">재고 관리</h1>
      <p className="text-sm text-gray-600 mb-6">
        상품을 펼쳐 옵션별로 재고를 입고 처리할 수 있습니다.
      </p>

      {data?.content.length === 0 ? (
        <EmptyState title="등록된 상품이 없습니다" />
      ) : (
        <div className="space-y-3">
          {data?.content.map((p) => (
            <InventoryRow key={p.productId} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function InventoryRow({ product }: { product: SellerProduct }) {
  const [open, setOpen] = useState(false);
  // 옵션(itemId)·품절여부는 상품 상세에서만 얻을 수 있어, 펼칠 때만 조회(불필요한 조회수 증가 방지)
  const { data: detail, isLoading } = useProductDetailQuery(product.productId, open);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {product.thumbnailUrl ? (
            <img
              src={product.thumbnailUrl}
              alt={product.name}
              className="w-14 h-14 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="w-14 h-14 bg-gray-100 rounded-lg shrink-0" />
          )}
          <div>
            <p className="font-medium text-sm">{product.name}</p>
            <p className="text-xs text-gray-500">{product.categoryNames.join(', ')}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="btn-secondary flex items-center gap-1 text-sm"
          aria-expanded={open}
        >
          <PackagePlus size={16} />
          재고 입고
          <ChevronDown size={16} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
        </button>
      </div>

      {open && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : detail && detail.items.length > 0 ? (
            <div className="space-y-2">
              {detail.items.map((item) => (
                <InboundOptionRow key={item.itemId} item={item} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-2">입고 가능한 옵션이 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
}

function InboundOptionRow({ item }: { item: ProductItem }) {
  const [qty, setQty] = useState('');
  const inboundMutation = useInboundMutation();

  const submit = () => {
    const n = Number(qty);
    if (!Number.isInteger(n) || n < 1) {
      toast.error('입고 수량은 1 이상의 정수여야 합니다.');
      return;
    }
    inboundMutation.mutate(
      { itemId: item.itemId, quantity: n },
      { onSuccess: () => setQty('') }
    );
  };

  return (
    <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.optionName || '기본 옵션'}</p>
        <p className="text-xs text-gray-500">
          {formatPrice(item.price)}
          {item.soldOut && <span className="ml-2 text-red-500">품절</span>}
        </p>
      </div>
      <input
        type="number"
        min={1}
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        placeholder="수량"
        className="input-field w-24"
      />
      <button
        type="button"
        onClick={submit}
        disabled={inboundMutation.isPending}
        className="btn-primary text-sm whitespace-nowrap"
      >
        {inboundMutation.isPending ? '처리 중' : '입고'}
      </button>
    </div>
  );
}
