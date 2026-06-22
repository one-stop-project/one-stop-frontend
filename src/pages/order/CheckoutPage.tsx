import { useState, useEffect, FormEvent } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useCreateOrderMutation } from '@/hooks/queries/useOrderQuery';
import { useMyInfoQuery } from '@/hooks/queries/useUserQuery';
import { useMyCouponsQuery } from '@/hooks/queries/useCouponQuery';
import { usePointsQuery } from '@/hooks/queries/usePointQuery';
import { useMySubscriptionQuery } from '@/hooks/queries/useSubscriptionQuery';
import { MyCoupon } from '@/domains/coupon/couponApi';
import { formatPrice } from '@/utils/format';

interface CheckoutItem {
  itemId: number;
  quantity: number;
}

// 백엔드 기본 배송비(구독 회원은 0). 예상 결제 금액에 반영한다.
const DELIVERY_FEE = 3000;
// 구독 회원 주문 할인율 — 백엔드 SubscriptionBenefitService.DISCOUNT_RATE(0.05)와 동일하게 맞춘다.
const SUBSCRIPTION_DISCOUNT_RATE = 0.05;

export default function CheckoutPage() {
  const location = useLocation();
  const { data: me } = useMyInfoQuery();
  const createOrder = useCreateOrderMutation();

  // DIRECT(바로구매)=items[{itemId,quantity}], CART(장바구니)=cartItemIds[]
  const state = location.state as {
    items?: CheckoutItem[];
    cartItemIds?: number[];
    subtotal?: number; // 페이지 진입 시 전달된 상품 소계 (포인트 상한 계산용)
  } | null;
  const items = state?.items;
  const cartItemIds = state?.cartItemIds;
  const isCart = Array.isArray(cartItemIds) && cartItemIds.length > 0;
  const subtotal = state?.subtotal ?? 0;

  const { data: pointData } = usePointsQuery(0, 1);
  const balance = pointData?.balance ?? 0;

  // 구독 혜택(5% 할인·무료배송)은 ACTIVE이거나, 해지(CANCELLED)했어도 종료일 전이면 유효 — 백엔드 isValid와 동일.
  const { data: sub } = useMySubscriptionQuery();
  const subscribed =
    !!sub &&
    (sub.status === 'ACTIVE' ||
      (sub.status === 'CANCELLED' && new Date(sub.endAt) > new Date()));
  const subscriptionDiscount =
    subscribed && subtotal > 0 ? Math.floor(subtotal * SUBSCRIPTION_DISCOUNT_RATE) : 0;
  const deliveryFee = subscribed ? 0 : DELIVERY_FEE;

  // 보유 중인 AVAILABLE 쿠폰만 가져와 — minOrderPrice·만료일 추가 필터는 FE에서
  const { data: couponPage } = useMyCouponsQuery({ status: 'AVAILABLE', size: 100 });
  const now = new Date();
  const usableCoupons: MyCoupon[] = (couponPage?.content ?? []).filter(
    (c) =>
      new Date(c.expiredAt) > now &&
      (subtotal === 0 || c.minOrderPrice <= subtotal)
  );

  const [form, setForm] = useState({
    receiverName: '',
    receiverPhone: '',
    receiverAddress: '',
    deliveryMessage: '',
  });
  const [usedPoint, setUsedPoint] = useState(0);
  const [selectedCouponId, setSelectedCouponId] = useState<number | null>(null);

  // 선택 쿠폰 할인액 미리보기 (RATE=% 적용, FIXED=고정, maxDiscountPrice 상한)
  const selectedCoupon = usableCoupons.find((c) => c.userCouponId === selectedCouponId) ?? null;
  const couponDiscount = (() => {
    if (!selectedCoupon || subtotal === 0) return 0;
    // FIXED(정액): 고정 금액이지만 주문금액을 넘을 수 없음(백엔드와 동일하게 subtotal로 상한)
    if (selectedCoupon.discountType === 'FIXED') {
      return Math.min(selectedCoupon.discountValue, subtotal);
    }
    // RATE(정률): % 적용 후 maxDiscountPrice가 있으면 상한 적용
    const raw = Math.floor((subtotal * selectedCoupon.discountValue) / 100);
    return selectedCoupon.maxDiscountPrice != null
      ? Math.min(raw, selectedCoupon.maxDiscountPrice)
      : raw;
  })();
  // 백엔드 결제금액 = 상품금액 - 쿠폰 - 포인트 - 구독할인 + 배송비. 미리보기도 동일하게 맞춘다.
  const estimatedTotal =
    subtotal > 0
      ? Math.max(0, subtotal - couponDiscount - subscriptionDiscount - usedPoint) + deliveryFee
      : null;

  useEffect(() => {
    if (me) {
      setForm((prev) => ({
        ...prev,
        receiverName: me.name,
        receiverPhone: me.phone,
        receiverAddress: me.address,
      }));
    }
  }, [me]);

  // 쿠폰/구독 할인으로 pointMax가 줄어들면 usedPoint를 자동 조정.
  // 백엔드는 쿠폰+포인트+구독할인 합이 상품금액을 넘으면 주문을 거절(ORDER_012)하므로 구독할인도 차감한다.
  const pointMax = Math.min(balance, Math.max(0, subtotal - couponDiscount - subscriptionDiscount));
  useEffect(() => {
    if (usedPoint > pointMax) setUsedPoint(pointMax);
  }, [pointMax]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isCart && (!items || items.length === 0)) {
    return <Navigate to="/cart" replace />;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // 실패 안내는 전역 인터셉터가 백엔드 메시지로 처리한다(별도 alert로 중복 안내하지 않음).
    createOrder.mutate({
      orderType: isCart ? 'CART' : 'DIRECT',
      items: isCart ? undefined : items,
      cartItemIds: isCart ? cartItemIds : undefined,
      receiverName: form.receiverName,
      receiverPhone: form.receiverPhone,
      receiverAddress: form.receiverAddress,
      deliveryMessage: form.deliveryMessage || undefined,
      usedPoint: usedPoint > 0 ? usedPoint : undefined,
      userCouponId: selectedCouponId ?? undefined,
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">주문/결제</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 배송지 정보 */}
        <section className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">배송지 정보</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                받는 분 <span className="text-primary-600">*</span>
              </label>
              <input
                type="text"
                className="input-field"
                value={form.receiverName}
                onChange={(e) => setForm({ ...form, receiverName: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                연락처 <span className="text-primary-600">*</span>
              </label>
              <input
                type="tel"
                className="input-field"
                value={form.receiverPhone}
                onChange={(e) => setForm({ ...form, receiverPhone: e.target.value })}
                placeholder="010-1234-5678"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                배송 주소 <span className="text-primary-600">*</span>
              </label>
              <input
                type="text"
                className="input-field"
                value={form.receiverAddress}
                onChange={(e) => setForm({ ...form, receiverAddress: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                배송 요청사항 (선택 · 최대 50자)
              </label>
              <textarea
                className="input-field"
                value={form.deliveryMessage}
                onChange={(e) => setForm({ ...form, deliveryMessage: e.target.value })}
                placeholder="문 앞에 두고 가주세요 등"
                rows={2}
                maxLength={50}
              />
            </div>
          </div>
        </section>

        {/* 할인 혜택 */}
        <section className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">할인 혜택</h2>

          {/* 쿠폰 선택 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">쿠폰</label>
            <select
              value={selectedCouponId ?? ''}
              onChange={(e) => setSelectedCouponId(e.target.value ? Number(e.target.value) : null)}
              className="input-field"
            >
              <option value="">쿠폰 선택 안 함</option>
              {usableCoupons.map((c) => {
                const preview =
                  c.discountType === 'RATE'
                    ? `${c.discountValue}% 할인${c.maxDiscountPrice != null ? ` (최대 ${formatPrice(c.maxDiscountPrice)})` : ''}`
                    : `${formatPrice(c.discountValue)} 할인`;
                return (
                  <option key={c.userCouponId} value={c.userCouponId}>
                    {preview} (최소 {formatPrice(c.minOrderPrice)})
                  </option>
                );
              })}
            </select>
            {selectedCoupon && couponDiscount > 0 && (
              <p className="text-xs text-green-600 mt-1">
                -{formatPrice(couponDiscount)} 적용
              </p>
            )}
          </div>

          {/* 포인트 사용 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              포인트 사용{' '}
              <span className="text-gray-400 font-normal">
                (보유: {balance.toLocaleString()}P)
              </span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                max={pointMax}
                step={1}
                value={usedPoint}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(pointMax, Number(e.target.value)));
                  setUsedPoint(v);
                }}
                className="input-field flex-1"
                placeholder="0"
              />
              <button
                type="button"
                onClick={() => setUsedPoint(pointMax)}
                className="btn-secondary text-sm px-3"
              >
                전액 사용
              </button>
            </div>
            {usedPoint > 0 && (
              <p className="text-xs text-green-600 mt-1">
                -{usedPoint.toLocaleString()}P 적용
              </p>
            )}
          </div>

          {/* 할인 합계 미리보기 */}
          {estimatedTotal !== null &&
            (couponDiscount > 0 || usedPoint > 0 || subscriptionDiscount > 0) && (
            <div className="mt-4 pt-4 border-t border-gray-100 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>상품 금액</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>쿠폰 할인</span>
                  <span>-{formatPrice(couponDiscount)}</span>
                </div>
              )}
              {subscriptionDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>구독 할인 (5%)</span>
                  <span>-{formatPrice(subscriptionDiscount)}</span>
                </div>
              )}
              {usedPoint > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>포인트 사용</span>
                  <span>-{usedPoint.toLocaleString()}P</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>배송비</span>
                <span>{deliveryFee === 0 ? '무료' : formatPrice(deliveryFee)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900 mt-1">
                <span>예상 결제 금액</span>
                <span>{formatPrice(estimatedTotal)}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {subscribed
                  ? '구독 혜택(5% 할인·무료배송)이 반영된 예상 금액이며, 최종 금액은 결제 단계에서 확정됩니다.'
                  : '최종 금액은 결제 단계에서 확정됩니다.'}
              </p>
            </div>
          )}
        </section>

        {/* 결제 안내 */}
        <section className="card p-6 bg-primary-50 border-primary-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">결제 방법 선택</h2>
          <p className="text-sm text-gray-600 mb-4">
            주문 생성 후 결제 페이지로 이동합니다.
          </p>
        </section>

        <button
          type="submit"
          disabled={createOrder.isPending}
          className="btn-primary w-full py-4 text-lg"
        >
          {createOrder.isPending ? '주문 생성 중...' : '주문하고 결제하기'}
        </button>
      </form>
    </div>
  );
}
