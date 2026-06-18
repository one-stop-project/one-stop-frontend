import { useState } from 'react';
import { PackagePlus, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useSellerProductsQuery,
  useSellerProductDetailQuery,
  useInboundMutation,
  useUpdateItemMutation,
} from '@/hooks/queries/useSellerQuery';
import { PageSpinner, Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/Pagination';
import { SellerProduct, ProductItemResponse, ItemUpdateRequest } from '@/domains/seller/sellerApi';
import { ProductItemStatus } from '@/types/common';
import { formatPrice } from '@/utils/format';

const ITEM_STATUS = {
  ON_SALE: { label: '판매중', cls: 'bg-green-100 text-green-700' },
  STOP: { label: '판매중지', cls: 'bg-gray-200 text-gray-600' },
} as const;

export default function SellerInventoryPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useSellerProductsQuery(page, 20);

  if (isLoading) return <PageSpinner />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">재고 관리</h1>
      <p className="text-sm text-gray-600 mb-6">
        상품을 펼쳐 옵션별 재고를 확인하고 입고·가격·판매상태를 관리할 수 있습니다.
      </p>

      {data?.content.length === 0 ? (
        <EmptyState title="등록된 상품이 없습니다" />
      ) : (
        <>
          <div className="space-y-3">
            {data?.content.map((p) => (
              <InventoryRow key={p.productId} product={p} />
            ))}
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

function InventoryRow({ product }: { product: SellerProduct }) {
  const [open, setOpen] = useState(false);
  // 옵션(itemId)·재고·상태는 판매자 전용 상세에서 얻음. 펼칠 때만 조회.
  const { data: detail, isLoading } = useSellerProductDetailQuery(product.productId, open);

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
          재고 관리
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
                <InventoryOptionRow key={item.itemId} item={item} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-2">옵션이 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
}

function InventoryOptionRow({ item }: { item: ProductItemResponse }) {
  const [qty, setQty] = useState('');
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(String(item.price));
  const [status, setStatus] = useState<ProductItemStatus>(item.status);
  const inboundMutation = useInboundMutation();
  const updateMutation = useUpdateItemMutation();

  const badge = ITEM_STATUS[item.status];

  const submitInbound = () => {
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

  const submitEdit = () => {
    const p = Number(price);
    if (!Number.isInteger(p) || p < 100) {
      toast.error('가격은 100원 이상의 정수여야 합니다.');
      return;
    }
    const data: ItemUpdateRequest = { price: p, status };
    updateMutation.mutate(
      { itemId: item.itemId, data },
      { onSuccess: () => setEditing(false) }
    );
  };

  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{item.optionName || '기본 옵션'}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
          </div>
          <p className="text-xs text-gray-500">
            {formatPrice(item.price)} · 재고 {item.stock.toLocaleString()}개
          </p>
        </div>
        <input
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          placeholder="수량"
          className="input-field w-20"
        />
        <button
          type="button"
          onClick={submitInbound}
          disabled={inboundMutation.isPending}
          className="btn-primary text-sm whitespace-nowrap"
        >
          {inboundMutation.isPending ? '처리 중' : '입고'}
        </button>
        <button
          type="button"
          onClick={() => setEditing((e) => !e)}
          className="btn-secondary text-sm whitespace-nowrap"
        >
          수정
        </button>
      </div>

      {editing && (
        <div className="mt-2 pt-2 border-t border-gray-200 flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">가격</label>
            <input
              type="number"
              min={100}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input-field w-28"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">판매 상태</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProductItemStatus)}
              className="input-field w-28"
            >
              <option value="ON_SALE">판매중</option>
              <option value="STOP">판매중지</option>
            </select>
          </div>
          <button
            type="button"
            onClick={submitEdit}
            disabled={updateMutation.isPending}
            className="btn-primary text-sm"
          >
            저장
          </button>
          <button
            type="button"
            onClick={() => {
              setPrice(String(item.price));
              setStatus(item.status);
              setEditing(false);
            }}
            className="btn-secondary text-sm"
          >
            취소
          </button>
        </div>
      )}
    </div>
  );
}
