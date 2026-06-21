import { Link } from 'react-router-dom';
import { Package, ShoppingBag, Truck, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  useSellerProductsQuery,
  useSellerOrdersQuery,
  useSellerMyStatusQuery,
  useSellerOrderCountsQuery,
} from '@/hooks/queries/useSellerQuery';

export default function SellerDashboard() {
  const { data: products } = useSellerProductsQuery(0, 5);
  const { data: orders } = useSellerOrdersQuery(0, 5);
  // 주문 상태별 건수는 전용 집계 API로 받는다(예전엔 목록을 size=1로 불러 totalElements만 쓰는 우회였음).
  const { data: counts } = useSellerOrderCountsQuery();
  // 판매자 본인 계정 상태 — 반려/정지면 상단에 사유를 안내한다.
  const { data: myStatus } = useSellerMyStatusQuery();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">판매자 대시보드</h1>

      {/* 계정이 반려/정지 상태면 사유 안내 */}
      {myStatus &&
        (myStatus.sellerStatus === 'REJECTED' || myStatus.sellerStatus === 'SUSPENDED') && (
          <div
            className={`mb-6 p-4 rounded-lg border flex gap-3 ${
              myStatus.sellerStatus === 'REJECTED'
                ? 'border-red-200 bg-red-50'
                : 'border-amber-200 bg-amber-50'
            }`}
          >
            <AlertTriangle
              size={20}
              className={`shrink-0 mt-0.5 ${
                myStatus.sellerStatus === 'REJECTED' ? 'text-red-600' : 'text-amber-600'
              }`}
            />
            <div>
              <p
                className={`text-sm font-semibold ${
                  myStatus.sellerStatus === 'REJECTED' ? 'text-red-700' : 'text-amber-700'
                }`}
              >
                {myStatus.sellerStatus === 'REJECTED'
                  ? '판매자 가입이 반려되었습니다.'
                  : '판매자 활동이 정지되었습니다.'}
              </p>
              <p
                className={`text-sm mt-1 ${
                  myStatus.sellerStatus === 'REJECTED' ? 'text-red-600' : 'text-amber-700'
                }`}
              >
                사유:{' '}
                {myStatus.rejectReason?.trim()
                  ? myStatus.rejectReason
                  : '사유가 기재되지 않았습니다.'}
              </p>
              {myStatus.rejectedAt && (
                <p className="text-xs text-gray-500 mt-1">
                  처리일: {new Date(myStatus.rejectedAt).toLocaleDateString('ko-KR')}
                </p>
              )}
            </div>
          </div>
        )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Package className="text-blue-600" />}
          label="등록 상품"
          value={products?.totalElements ?? 0}
          link="/seller/products"
        />
        <StatCard
          icon={<ShoppingBag className="text-green-600" />}
          label="전체 주문"
          value={counts?.total ?? 0}
          link="/seller/orders"
        />
        <StatCard
          icon={<Truck className="text-orange-600" />}
          label="배송 중"
          value={counts?.shipping ?? 0}
          link="/seller/orders"
        />
        <StatCard
          icon={<CheckCircle2 className="text-purple-600" />}
          label="배송 완료"
          value={counts?.delivered ?? 0}
          link="/seller/orders"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">최근 등록 상품</h2>
            <Link to="/seller/products" className="text-sm text-primary-600 hover:underline">
              전체 보기
            </Link>
          </div>
          <div className="space-y-3">
            {products?.content.slice(0, 5).map((p) => (
              <div key={p.productId} className="flex items-center gap-3 text-sm">
                {p.thumbnailUrl ? (
                  <img
                    src={p.thumbnailUrl}
                    alt={p.name}
                    onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
                    className="w-10 h-10 rounded object-cover shrink-0 bg-gray-100"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.categoryNames.join(', ')}</p>
                </div>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded">{p.status}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">최근 주문</h2>
            <Link to="/seller/orders" className="text-sm text-primary-600 hover:underline">
              전체 보기
            </Link>
          </div>
          <div className="space-y-3">
            {orders?.content.slice(0, 5).map((o) => (
              <div key={o.orderItemId} className="text-sm border-b pb-2 last:border-0">
                <p className="font-medium">{o.itemName}</p>
                <p className="text-xs text-gray-500">
                  {o.buyerName} · {o.quantity}개
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  link,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  link: string;
}) {
  return (
    <Link to={link} className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </Link>
  );
}
