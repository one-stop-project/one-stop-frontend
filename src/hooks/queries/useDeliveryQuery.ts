import { useQuery } from '@tanstack/react-query';
import { deliveryApi } from '@/domains/delivery/deliveryApi';

export function useOrderDeliveriesQuery(orderId: number | null) {
  return useQuery({
    queryKey: ['deliveries', 'order', orderId],
    queryFn: () => deliveryApi.getByOrder(orderId!),
    enabled: orderId !== null,
    retry: false, // 보조 정보 — 실패해도 재시도하지 않고(중복 호출 방지) 화면에 안내만 표시
  });
}

export function useDeliveryHistoryQuery(deliveryId: number | null) {
  return useQuery({
    queryKey: ['deliveries', 'history', deliveryId],
    queryFn: () => deliveryApi.getHistory(deliveryId!),
    enabled: deliveryId !== null,
    retry: false, // 보조 정보 — 실패 시 재시도 없이 조용히 처리
  });
}
