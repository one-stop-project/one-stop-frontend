import { Link } from 'react-router-dom';
import { Package, ShoppingBag, Truck, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import {
  useSellerProductsQuery,
  useSellerOrdersQuery,
  useSellerMyStatusQuery,
  useSellerOrderCountsQuery,
  useSellerProductSalesQuery,
} from '@/hooks/queries/useSellerQuery';

// 상품 상태 코드 → 한글 라벨 (상품 목록 화면과 동일한 표기)
const PRODUCT_STATUS_LABELS: Record<string, string> = {
  APPROVE_REQUESTED: '승인 요청',
  APPROVED: '판매 중',
  REJECTED: '반려됨',
  DISCONTINUED: '판매 중단',
  FORCE_INACTIVE: '강제 비활성',
};

export default function SellerDashboard() {
  // 판매자 본인 계정 상태 — 승인 전(대기/반려/정지)에는 매출·주문 등 데이터 조회 권한이 없어 403이 난다.
  const { data: myStatus } = useSellerMyStatusQuery();
  const approved = myStatus?.sellerStatus === 'APPROVED';

  // 승인된 판매자일 때만 대시보드 데이터를 조회한다(미승인 상태에서 권한없음 호출이 한꺼번에 터지는 것을 막는다).
  const { data: products } = useSellerProductsQuery(0, 5, approved);
  const { data: orders } = useSellerOrdersQuery(0, 5, undefined, approved);
  // 주문 상태별 건수는 전용 집계 API로 받는다(예전엔 목록을 size=1로 불러 totalElements만 쓰는 우회였음).
  const { data: counts } = useSellerOrderCountsQuery(approved);
  // 상품별 매출(배송완료 기준) 상위 5개
  const { data: sales } = useSellerProductSalesQuery({ size: 5 }, approved);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">판매자 대시보드</h1>

      {/* 승인 대기 안내 */}
      {myStatus && myStatus.sellerStatus === 'PENDING' && (
        <div className="mb-6 p-4 rounded-lg border border-blue-200 bg-blue-50 flex gap-3">
          <AlertTriangle size={20} className="shrink-0 mt-0.5 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-blue-700">판매자 승인 대기 중입니다.</p>
            <p className="text-sm mt-1 text-blue-600">
              승인이 완료되면 상품 등록·주문 관리·매출 통계를 이용할 수 있습니다.
            </p>
          </div>
        </div>
      )}

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

      <section className="card p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-primary-600" />
          <h2 className="text-lg font-semibold">상품별 매출</h2>
          <span className="text-xs text-gray-400">배송 완료 기준</span>
        </div>
        {sales && sales.content.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 font-medium">상품</th>
                  <th className="py-2 font-medium text-right">판매 수량</th>
                  <th className="py-2 font-medium text-right">매출액</th>
                </tr>
              </thead>
              <tbody>
                {sales.content.map((s) => (
                  <tr key={s.productId} className="border-b last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        {s.thumbnailUrl ? (
                          <img
                            src={s.thumbnailUrl}
                            alt={s.productName}
                            onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
                            className="w-10 h-10 rounded object-cover shrink-0 bg-gray-100"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded shrink-0" />
                        )}
                        <span className="font-medium truncate max-w-[18rem]">{s.productName}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right">{s.salesQuantity.toLocaleString()}개</td>
                    <td className="py-3 text-right font-semibold">
                      {s.grossSalesAmount.toLocaleString()}원
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400 py-6 text-center">판매 완료된 상품이 아직 없습니다.</p>
        )}
      </section>

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
                <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                  {PRODUCT_STATUS_LABELS[p.status] ?? p.status}
                </span>
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
