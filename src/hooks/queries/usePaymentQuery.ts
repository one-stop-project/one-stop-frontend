import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { paymentApi, PaymentRequest } from '@/domains/payment/paymentApi';

export function useApprovePaymentMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PaymentRequest) => paymentApi.approve(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      // 주문완료 토스트는 제거(완료 화면으로 바로 이동) — 중복 안내 방지
      navigate(`/orders/${data.orderId}/complete`);
    },
  });
}
