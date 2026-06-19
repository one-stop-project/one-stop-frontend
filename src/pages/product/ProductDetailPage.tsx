import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Minus, Plus, Store, Eye, TrendingUp, Sparkles, ChevronDown, Check } from 'lucide-react';
import { useProductDetailQuery, useRelatedProductsQuery } from '@/hooks/queries/useProductQuery';
import { useAiReviewSummaryQuery } from '@/hooks/queries/useReviewQuery';
import { useAddToCartMutation } from '@/hooks/queries/useCartQuery';
import { ReviewSentiment } from '@/domains/review/reviewApi';
import { ProductCard } from '@/components/product/ProductCard';
import { PageSpinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuthStore } from '@/store/useAuthStore';
import { formatPrice } from '@/utils/format';
import { parseId } from '@/utils/parseId';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const productId = parseId(id);
  const navigate = useNavigate();

  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [selections, setSelections] = useState<string[]>([]); // 축별 선택값 (컬러, 사이즈 …)
  const [openTier, setOpenTier] = useState<number | null>(null); // 현재 펼쳐진 축

  const { data: product, isLoading, isError } = useProductDetailQuery(productId);
  const { data: related } = useRelatedProductsQuery(productId);
  const addToCart = useAddToCartMutation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasRole = useAuthStore((s) => s.hasRole);

  // 관련 상품으로 이동하면 라우트 param만 바뀌고 리마운트되지 않으므로
  // 상품이 바뀔 때 옵션/수량/이미지 선택 상태를 직접 초기화한다(대표 이미지 깨짐 방지).
  useEffect(() => {
    setSelectedItemId(null);
    setQuantity(1);
    setImageIndex(0);
    setSelections([]);
    setOpenTier(null);
  }, [productId]);

  if (productId === null || isError) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <EmptyState
          title="상품을 찾을 수 없습니다"
          description="삭제되었거나 잘못된 주소일 수 있어요."
          action={
            <Link to="/products" className="btn-primary inline-block">
              상품 목록으로
            </Link>
          }
        />
      </div>
    );
  }
  if (isLoading || !product) {
    return <PageSpinner />;
  }

  const selectedItem = product.items.find((i) => i.itemId === selectedItemId);
  const finalPrice = selectedItem ? selectedItem.price * quantity : 0;

  // ── 옵션 계층 분해 ──────────────────────────────────────────────
  // 옵션값은 "값 / 값" 규칙으로 합쳐져 내려온다(예: "블랙 / M"). 모든 옵션이
  // 똑같이 2칸 이상으로 쪼개질 때만 계층형(컬러→사이즈)으로 펼치고, 아니면
  // 합쳐진 이름 그대로 단일 드롭다운으로 보여준다.
  const rawParts = product.items.map((it) =>
    it.optionName.split('/').map((s) => s.trim()).filter(Boolean)
  );
  const counts = rawParts.map((p) => p.length || 1);
  const uniformMulti = counts.length > 0 && counts.every((c) => c === counts[0]) && counts[0] >= 2;
  const tierCount = uniformMulti ? counts[0] : 1;
  const parsedItems = product.items.map((it, idx) => ({
    item: it,
    parts: uniformMulti ? rawParts[idx] : [it.optionName],
  }));
  const axisLabel = (k: number) => (uniformMulti ? (product.optionNames[k] ?? '').trim() : '');

  // 앞 단계 선택과 일치하는 아이템들에서 k번째 축의 고를 수 있는 값 목록
  const tierValues = (k: number): string[] => {
    const seen: string[] = [];
    for (const p of parsedItems) {
      if (!selections.slice(0, k).every((sel, i) => p.parts[i] === sel)) continue;
      const v = p.parts[k];
      if (v && !seen.includes(v)) seen.push(v);
    }
    return seen;
  };
  // 모든 축 값이 정확히 일치하는 단일 아이템
  const itemForValues = (vals: string[]) =>
    parsedItems.find(
      (p) => p.parts.length === vals.length && vals.every((s, i) => p.parts[i] === s)
    )?.item;

  const chooseTier = (k: number, v: string) => {
    const next = [...selections.slice(0, k), v];
    setSelections(next);
    if (k < tierCount - 1) {
      setSelectedItemId(null);
      setOpenTier(k + 1); // 다음 축을 자동으로 펼침
    } else {
      const found = itemForValues(next);
      setSelectedItemId(found ? found.itemId : null);
      setQuantity(1);
      setOpenTier(null);
    }
  };

  // 대표 이미지 목록: imageUrls가 있으면 사용, 없으면 thumbnail
  const images =
    product.imageUrls && product.imageUrls.length > 0
      ? product.imageUrls
      : product.thumbnailUrl
        ? [product.thumbnailUrl]
        : [];

  const handleAddToCart = () => {
    // 비로그인도 담기 가능(백엔드 guest_cart_id 쿠키, 로그인 시 병합). 단 로그인한 판매자/관리자는 불가.
    if (isAuthenticated && !hasRole('BUYER')) {
      toast.error('구매자 계정만 이용할 수 있습니다.');
      return;
    }
    if (!selectedItemId) {
      toast.error('옵션을 선택해주세요.');
      return;
    }
    addToCart.mutate({ itemId: selectedItemId, quantity });
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    if (!hasRole('BUYER')) {
      toast.error('구매자 계정만 이용할 수 있습니다.');
      return;
    }
    if (!selectedItemId) {
      toast.error('옵션을 선택해주세요.');
      return;
    }
    // 바로구매 = DIRECT 주문 흐름으로 결제 페이지 이동
    navigate('/checkout', { state: { items: [{ itemId: selectedItemId, quantity }], subtotal: finalPrice } });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* 이미지 갤러리 */}
        <div>
          <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-3">
            {images.length > 0 ? (
              <img
                src={images[imageIndex]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                이미지 없음
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {images.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setImageIndex(idx)}
                  className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 ${
                    idx === imageIndex ? 'border-primary-600' : 'border-transparent'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 상품 정보 */}
        <div className="flex flex-col">
          <p className="text-sm text-gray-500 mb-2">
            {product.categoryNames?.join(' > ') || ''}
          </p>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>

          <div className="flex items-center gap-3 mb-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Store size={14} />
              <span>{product.shopName}</span>
            </div>
            <span className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-1">
              <TrendingUp size={14} />
              <span>{product.salesCount.toLocaleString()} 판매</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye size={14} />
              <span>{product.viewCount.toLocaleString()}</span>
            </div>
          </div>

          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 rounded-full bg-primary-50 text-primary-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <hr className="my-6" />

          {/* 옵션 선택 (계층형) — 축을 차례로 펼쳐 고른다(예: 컬러 → 사이즈) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              옵션 선택 <span className="text-gray-400 font-normal">(필수)</span>
              <span className="text-red-500"> *</span>
            </label>

            <div className="space-y-2">
              {Array.from({ length: tierCount }).map((_, k) => {
                const label = axisLabel(k);
                const selected = selections[k];
                const enabled = k <= selections.length; // 앞 축을 골라야 다음 축 활성화
                const isOpen = openTier === k;
                return (
                  <div key={k}>
                    <button
                      type="button"
                      disabled={!enabled}
                      onClick={() => enabled && setOpenTier(isOpen ? null : k)}
                      className={`w-full px-4 py-3 flex items-center justify-between rounded-lg border-2 transition-colors ${
                        isOpen ? 'border-primary-600' : 'border-gray-200'
                      } ${enabled ? 'hover:border-gray-300' : 'opacity-50 cursor-not-allowed'}`}
                    >
                      <span className={selected ? 'font-medium text-gray-900' : 'text-gray-400'}>
                        {selected
                          ? label
                            ? `${label} / ${selected}`
                            : selected
                          : label || '옵션을 선택하세요'}
                      </span>
                      <ChevronDown
                        size={18}
                        className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {isOpen && (
                      <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 divide-y divide-gray-100 overflow-hidden">
                        {tierValues(k).map((v) => {
                          const isLeaf = k === tierCount - 1;
                          const leafItem = isLeaf
                            ? itemForValues([...selections.slice(0, k), v])
                            : undefined;
                          const soldOut = isLeaf && !!leafItem?.soldOut;
                          const checked = selections[k] === v;
                          return (
                            <button
                              key={v}
                              type="button"
                              disabled={soldOut}
                              onClick={() => chooseTier(k, v)}
                              className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors hover:bg-white ${
                                soldOut ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                                  checked ? 'bg-primary-600 border-primary-600' : 'border-gray-300 bg-white'
                                }`}
                              >
                                {checked && <Check size={14} className="text-white" />}
                              </span>
                              <span className="flex-1 text-gray-800">{v}</span>
                              {soldOut && <span className="text-xs text-gray-400">품절</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 수량 + 가격 */}
          {selectedItem && (
            <>
              <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">수량</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-white"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="font-semibold w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                    className="w-8 h-8 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-white"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6">
                <span className="text-lg font-semibold">총 결제 금액</span>
                <span className="text-2xl font-bold text-primary-600">
                  {formatPrice(finalPrice)}
                </span>
              </div>
            </>
          )}

          {/* CTA */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={!selectedItemId || addToCart.isPending}
              className="flex-1 py-4 bg-white border-2 border-primary-600 text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShoppingCart size={20} />
              장바구니
            </button>
            <button
              onClick={handleBuyNow}
              disabled={!selectedItemId}
              className="flex-1 py-4 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              바로 구매
            </button>
          </div>
        </div>
      </div>

      {/* 상품 설명 */}
      <section className="mb-12 card p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">상품 설명</h2>
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{product.description}</p>
      </section>

      {/* AI 리뷰 요약 */}
      {productId !== null && <AiReviewSummaryCard productId={productId} />}

      {/* 관련 상품 — 판매중 옵션이 없어 minPrice 0으로 내려온 상품은 제외(0원 카드·상세 404 방어) */}
      {(() => {
        const relatedToShow = (related ?? []).filter((p) => p.minPrice > 0);
        if (relatedToShow.length === 0) return null;
        return (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-6">함께 보면 좋은 상품</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedToShow.map((p) => (
                <ProductCard key={p.productId} product={p} />
              ))}
            </div>
          </section>
        );
      })()}
    </div>
  );
}

const SENTIMENT_BADGE: Record<ReviewSentiment, { label: string; cls: string }> = {
  POSITIVE: { label: '긍정적', cls: 'bg-green-100 text-green-700' },
  NEUTRAL: { label: '중립적', cls: 'bg-gray-100 text-gray-600' },
  NEGATIVE: { label: '부정적', cls: 'bg-red-100 text-red-700' },
  UNAVAILABLE: { label: '집계 불가', cls: 'bg-gray-100 text-gray-400' },
};

// AI 리뷰 요약 카드 — status가 READY이고 summary가 있을 때만 표시(PENDING/INSUFFICIENT는 숨김)
function AiReviewSummaryCard({ productId }: { productId: number }) {
  const { data } = useAiReviewSummaryQuery(productId);

  if (!data || data.status !== 'READY' || !data.summary) return null;

  const { summary, reviewCount, averageRating } = data;
  const sentiment = SENTIMENT_BADGE[summary.sentiment] ?? SENTIMENT_BADGE.UNAVAILABLE;

  return (
    <section className="mb-12 card p-8">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="text-primary-600" size={20} />
        <h2 className="text-xl font-bold text-gray-900">AI 리뷰 요약</h2>
        <span className={`text-xs px-2 py-1 rounded-full ${sentiment.cls}`}>{sentiment.label}</span>
      </div>
      <p className="text-sm text-gray-500 mb-5">
        리뷰 {reviewCount.toLocaleString()}개 · 평균 ★{averageRating.toFixed(1)}
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-green-700 mb-2">장점</h3>
          {summary.pros.length > 0 ? (
            <ul className="space-y-1 text-sm text-gray-700 list-disc list-inside">
              {summary.pros.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">-</p>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-red-600 mb-2">단점</h3>
          {summary.cons.length > 0 ? (
            <ul className="space-y-1 text-sm text-gray-700 list-disc list-inside">
              {summary.cons.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">-</p>
          )}
        </div>
      </div>

      {summary.keywords.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {summary.keywords.map((k, i) => (
            <span key={i} className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
              #{k}
            </span>
          ))}
        </div>
      )}

      <p className="mt-5 text-xs text-gray-400">AI가 실제 구매자 리뷰를 요약한 내용입니다.</p>
    </section>
  );
}
