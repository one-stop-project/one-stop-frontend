import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Minus, Plus, X, ChevronRight } from 'lucide-react';
import {
  useCartQuery,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
} from '@/hooks/queries/useCartQuery';
import { PageSpinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { formatPrice } from '@/utils/format';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';

// 백엔드 기본 배송비. 무료배송은 구독 혜택일 때만 적용되며(주문 생성 시 확정),
// '5만원 이상 무료' 같은 금액 기준은 백엔드에 없다. 장바구니에선 기본 배송비만 추정 표시한다.
const SHIPPING_FEE = 3000;

export default function CartPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: cart, isLoading } = useCartQuery();
  const updateMutation = useUpdateCartItemMutation();
  const removeMutation = useRemoveCartItemMutation();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  if (isLoading) return <PageSpinner />;

  // ★ 백엔드는 content 배열, 기준값은 itemId
  const items = cart?.content ?? [];
  const allSelected = items.length > 0 && selectedIds.size === items.length;

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(items.map((i) => i.itemId)));
  };

  const toggleOne = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectedItems = items.filter((i) => selectedIds.has(i.itemId));
  // subtotal은 price × quantity로 계산 (백엔드에 subtotal 필드 없음)
  const subtotal = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  // 선택 상품이 없으면 0, 있으면 기본 배송비(구독 무료배송은 결제 단계에서 확정)
  const shippingFee = subtotal === 0 ? 0 : SHIPPING_FEE;
  const total = subtotal + shippingFee;

  const handleCheckout = () => {
    if (selectedItems.length === 0) return;
    // 주문 생성은 백엔드 BUYER 전용 — 비로그인 게스트는 로그인으로 유도(로그인 시 장바구니 병합)
    if (!isAuthenticated) {
      toast.error('주문하려면 로그인이 필요합니다.');
      navigate('/login', { state: { from: { pathname: '/cart' } } });
      return;
    }
    // 장바구니 주문 = orderType CART + cartItemIds(로그인 장바구니의 행 id). 주문 후 백엔드가 장바구니에서 비움.
    const cartItemIds = selectedItems
      .map((i) => i.cartItemId)
      .filter((id): id is number => id != null);
    // 정상 흐름에선 로그인 장바구니에 cartItemId가 항상 존재. 비어 있으면 병합 전 게스트 데이터가 남은 상태이므로
    // 무음으로 멈추지 말고 새로고침을 안내한다.
    if (cartItemIds.length === 0) {
      toast.error('장바구니 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    navigate('/checkout', { state: { cartItemIds, subtotal } });
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <EmptyState
          icon={<ShoppingCart size={40} />}
          title="장바구니가 비어있어요"
          description="마음에 드는 상품을 담아보세요!"
          action={
            <Link to="/products" className="btn-primary inline-block">
              쇼핑 시작하기
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">장바구니</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 상품 목록 */}
        <div className="lg:col-span-2 space-y-3">
          <div className="card p-4 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium">
                전체 선택 ({selectedIds.size}/{items.length})
              </span>
            </label>
          </div>

          {items.map((item) => {
            const itemSubtotal = item.price * item.quantity;
            return (
              <div key={item.itemId} className="card p-4">
                <div className="flex gap-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.itemId)}
                    onChange={() => toggleOne(item.itemId)}
                    className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500 self-start mt-1"
                  />

                  <Link to={`/products/${item.productId}`} className="shrink-0">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-100 rounded-lg overflow-hidden">
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                          이미지
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/products/${item.productId}`}
                      className="block text-sm font-medium text-gray-900 hover:text-primary-600 truncate"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-xs text-gray-500 mt-0.5">{item.optionName}</p>

                    {!item.available && (
                      <p className="text-xs text-primary-600 mt-1 font-medium">
                        품절 또는 판매 중지된 상품입니다
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateMutation.mutate({
                              itemId: item.itemId,
                              quantity: Math.max(1, item.quantity - 1),
                            })
                          }
                          disabled={item.quantity <= 1}
                          className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-sm font-semibold w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateMutation.mutate({
                              itemId: item.itemId,
                              // 백엔드 수량 상한 99(@Max) — 재고와 99 중 작은 값으로 제한
                              quantity: Math.min(99, item.stock, item.quantity + 1),
                            })
                          }
                          disabled={!item.available || item.quantity >= Math.min(99, item.stock)}
                          className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <p className="font-bold text-gray-900">{formatPrice(itemSubtotal)}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => removeMutation.mutate(item.itemId)}
                    className="text-gray-400 hover:text-gray-600 self-start"
                    title="삭제"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 결제 요약 */}
        <aside className="lg:col-span-1">
          <div className="card p-6 sticky top-32">
            <h2 className="font-bold text-gray-900 mb-4">주문 요약</h2>

            <div className="space-y-3 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">상품 금액</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">배송비</span>
                <span className="font-medium">
                  {shippingFee === 0 ? '무료' : formatPrice(shippingFee)}
                </span>
              </div>
              {subtotal > 0 && (
                <p className="text-xs text-gray-500">
                  구독 회원은 배송비가 무료이며, 최종 배송비는 결제 단계에서 확정됩니다.
                </p>
              )}
            </div>

            <hr className="my-4" />

            <div className="flex justify-between mb-6">
              <span className="font-semibold">총 결제 금액</span>
              <span className="text-xl font-bold text-primary-600">{formatPrice(total)}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={selectedItems.length === 0}
              className="btn-primary w-full py-3 flex items-center justify-center gap-1"
            >
              {selectedItems.length}개 주문하기
              <ChevronRight size={18} />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
