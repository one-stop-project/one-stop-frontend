import { useState } from 'react';
import { Check, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useSellerOrdersQuery,
  useConfirmOrderMutation,
  useShipDeliveryMutation,
} from '@/hooks/queries/useSellerQuery';
import { PageSpinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { SellerOrderItem } from '@/domains/seller/sellerApi';
import { formatPrice, formatDateTime } from '@/utils/format';

const ORDER_ITEM_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: '결제 대기',
  ORDERED: '주문 접수',
  CONFIRMED: '확인 완료',
  SHIPPING: '배송 중',
  DELIVERED: '배송 완료',
  CANCELLED: '주문 취소',
  REJECTED: '주문 거절',
};

export default function SellerOrdersPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useSellerOrdersQuery(page, 20);

  if (isLoading) return <PageSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">주문 관리</h1>

      {data?.content.length === 0 ? (
        <EmptyState title="들어온 주문이 없습니다" description="상품을 등록하고 판매를 시작해보세요!" />
      ) : (
        <div className="space-y-4">
          {data?.content.map((o) => (
            <SellerOrderCard key={o.orderItemId} order={o} />
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={data.first} className="btn-secondary text-sm">
            이전
          </button>
          <span className="text-sm text-gray-600">{page + 1} / {data.totalPages}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={data.last} className="btn-secondary text-sm">
            다음
          </button>
        </div>
      )}
    </div>
  );
}

function SellerOrderCard({ order }: { order: SellerOrderItem }) {
  const confirmMutation = useConfirmOrderMutation();
  const shipMutation = useShipDeliveryMutation();
  const [shipping, setShipping] = useState(false);
  const [company, setCompany] = useState('');
  const [invoice, setInvoice] = useState('');

  const submitShip = () => {
    if (!company.trim() || !invoice.trim()) {
      toast.error('택배사와 운송장 번호를 모두 입력해주세요.');
      return;
    }
    shipMutation.mutate(
      {
        deliveryId: order.deliveryId,
        deliveryCompany: company.trim(),
        invoiceNumber: invoice.trim(),
      },
      {
        onSuccess: () => {
          setShipping(false);
          setCompany('');
          setInvoice('');
        },
      }
    );
  };

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-gray-500">{formatDateTime(order.orderedAt)}</p>
          <p className="text-sm font-medium text-gray-700">주문 #{order.orderId}</p>
        </div>
        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
          {ORDER_ITEM_STATUS_LABELS[order.orderItemStatus] ?? order.orderItemStatus}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 bg-gray-100 rounded-lg shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{order.itemName}</p>
          <p className="text-xs text-gray-500">{order.quantity}개</p>
          <p className="text-sm font-semibold mt-1">{formatPrice(order.subtotal)}</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 text-sm mb-4">
        <p className="text-gray-600">
          주문자: <span className="font-medium text-gray-900">{order.buyerName}</span>
        </p>
        <p className="text-gray-600 mt-1">
          배송지: <span className="font-medium text-gray-900">{order.receiverAddress}</span>
        </p>
      </div>

      <div className="flex gap-2">
        {order.orderItemStatus === 'ORDERED' && (
          <button
            onClick={() => confirmMutation.mutate(order.orderItemId)}
            disabled={confirmMutation.isPending}
            className="btn-primary flex items-center gap-1 text-sm"
          >
            <Check size={16} />
            주문 확인
          </button>
        )}
        {order.deliveryStatus === 'INSTRUCT' && !shipping && (
          <button
            type="button"
            onClick={() => setShipping(true)}
            className="btn-secondary flex items-center gap-1 text-sm"
          >
            <Truck size={16} />
            배송 시작
          </button>
        )}
      </div>

      {shipping && (
        <div className="mt-3 border-t border-gray-100 pt-3 flex flex-col sm:flex-row gap-2">
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="택배사 (예: CJ대한통운)"
            className="input-field flex-1"
          />
          <input
            value={invoice}
            onChange={(e) => setInvoice(e.target.value)}
            placeholder="운송장 번호"
            className="input-field flex-1"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShipping(false)}
              className="btn-secondary text-sm"
            >
              취소
            </button>
            <button
              type="button"
              onClick={submitShip}
              disabled={shipMutation.isPending}
              className="btn-primary text-sm whitespace-nowrap"
            >
              {shipMutation.isPending ? '등록 중' : '운송장 등록'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
