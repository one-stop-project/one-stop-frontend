import { ShoppingBag, TrendingUp, Package, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDashboardQuery } from '@/hooks/queries/useAdminQuery';
import { PageSpinner } from '@/components/common/Spinner';
import { formatPrice } from '@/utils/format';
import { OrderStatus, DeliveryStatus } from '@/types/common';

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: '결제 대기',
  PAID: '결제 완료',
  CANCELLED: '취소',
};

const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  ACCEPT: '결제 완료',
  INSTRUCT: '상품 준비중',
  DEPARTURE: '배송 지시',
  DELIVERING: '배송 중',
  FINAL_DELIVERY: '배송 완료',
  ORDER_CANCELLED: '주문 취소',
};

export default function AdminDashboard() {
  const { data, isLoading } = useDashboardQuery();

  if (isLoading || !data) return <PageSpinner />;

  const { orders, deliveries } = data;
  const totalOrders = Object.values(orders.statusCount).reduce((a, b) => a + (b ?? 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">관리자 대시보드</h1>

      {/* 오늘 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={<ShoppingBag />}
          label="오늘 주문"
          value={`${orders.todayOrderCount.toLocaleString()}건`}
          color="bg-orange-50 text-orange-600"
        />
        <StatCard
          icon={<TrendingUp />}
          label="오늘 매출"
          value={formatPrice(orders.todayRevenue)}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          icon={<Package />}
          label="전체 주문"
          value={`${totalOrders.toLocaleString()}건`}
          color="bg-blue-50 text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* 주문 상태별 현황 */}
        <section className="card p-6">
          <h2 className="text-lg font-semibold mb-4">주문 상태별 현황</h2>
          <div className="space-y-3">
            {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => (
              <div key={s} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">{ORDER_STATUS_LABELS[s]}</span>
                <span className="font-bold text-gray-900">
                  {(orders.statusCount[s] ?? 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 배송 상태별 현황 */}
        <section className="card p-6">
          <h2 className="text-lg font-semibold mb-4">배송 상태별 현황</h2>
          <div className="space-y-3">
            {(Object.keys(DELIVERY_STATUS_LABELS) as DeliveryStatus[]).map((s) => (
              <div key={s} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">{DELIVERY_STATUS_LABELS[s]}</span>
                <span className="font-bold text-gray-900">
                  {(deliveries.statusCount[s] ?? 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 승인 관리 바로가기 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/admin/products"
          className="card p-5 flex items-center gap-3 hover:bg-gray-50 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-50 text-purple-600">
            <Package />
          </div>
          <div>
            <p className="font-medium text-sm">상품 승인 관리</p>
            <p className="text-xs text-gray-500">승인 요청된 상품 검토</p>
          </div>
        </Link>
        <Link
          to="/admin/sellers"
          className="card p-5 flex items-center gap-3 hover:bg-gray-50 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-50 text-green-600">
            <Store />
          </div>
          <div>
            <p className="font-medium text-sm">판매자 승인 관리</p>
            <p className="text-xs text-gray-500">승인 요청한 판매자 검토</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="card p-5">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color} mb-3`}>
        {icon}
      </div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
