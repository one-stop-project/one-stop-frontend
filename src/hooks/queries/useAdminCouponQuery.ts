import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  couponAdminApi,
  CreateCouponRequest,
  CouponStatus,
} from '@/domains/admin/couponAdminApi';

export function useAdminCouponsQuery(page = 0, size = 20, status?: CouponStatus) {
  return useQuery({
    queryKey: ['admin', 'coupons', page, size, status ?? null],
    queryFn: () => couponAdminApi.getCoupons(page, size, status),
  });
}

export function useCreateCouponMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCouponRequest) => couponAdminApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      toast.success('쿠폰이 생성되었습니다.');
    },
  });
}

export function useDeactivateCouponMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (couponId: number) => couponAdminApi.deactivate(couponId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      toast.success('쿠폰이 비활성화되었습니다.');
    },
  });
}
