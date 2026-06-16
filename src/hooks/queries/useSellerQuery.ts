import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  sellerApi,
  ProductCreateRequest,
  ProductUpdateRequest,
  ItemUpdateRequest,
} from '@/domains/seller/sellerApi';
import { DeliveryStatus, OrderItemStatus } from '@/types/common';

export function usePopularTagsQuery(keyword: string, enabled: boolean) {
  return useQuery({
    queryKey: ['seller', 'popular-tags', keyword],
    queryFn: () => sellerApi.getPopularTags(keyword, 8),
    enabled,
    staleTime: 60 * 1000,
  });
}

export function useSellerProductDetailQuery(productId: number | null, enabled = true) {
  return useQuery({
    queryKey: ['seller', 'product-detail', productId],
    queryFn: () => sellerApi.getMyProductDetail(productId!),
    enabled: enabled && productId !== null,
    staleTime: 30 * 1000,
  });
}

export function useSellerProductsQuery(page = 0, size = 20) {
  return useQuery({
    queryKey: ['seller', 'products', page, size],
    queryFn: () => sellerApi.getMyProducts(page, size),
  });
}

export function useSellerOrdersQuery(page = 0, size = 20, status?: OrderItemStatus) {
  return useQuery({
    queryKey: ['seller', 'orders', page, size, status],
    queryFn: () => sellerApi.getMyOrders(page, size, status),
  });
}

export function useCreateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, images }: { data: ProductCreateRequest; images: File[] }) =>
      sellerApi.createProduct(data, images),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'products'] });
      toast.success('상품이 등록되었습니다. 관리자 승인 후 노출됩니다.');
    },
  });
}

export function useUpdateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, data }: { productId: number; data: ProductUpdateRequest }) =>
      sellerApi.updateProduct(productId, data),
    onSuccess: () => {
      // ['seller'] 무효화로 목록(['seller','products'])·판매자 상세(['seller','product-detail']) 모두 갱신
      queryClient.invalidateQueries({ queryKey: ['seller'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'detail'] });
      toast.success('상품이 수정되었습니다.');
    },
  });
}

export function useAddProductImageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, images }: { productId: number; images: File[] }) =>
      sellerApi.addProductImage(productId, images),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', 'detail'] });
      // ['seller'] 무효화로 판매자 상세(['seller','product-detail'])의 이미지 목록도 즉시 갱신
      queryClient.invalidateQueries({ queryKey: ['seller'] });
      toast.success('이미지가 추가되었습니다.');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? '이미지 추가에 실패했습니다.');
    },
  });
}

export function useDeleteProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: number) => sellerApi.deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'products'] });
      toast.success('삭제되었습니다.');
    },
  });
}

export function useUpdateItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: number; data: ItemUpdateRequest }) =>
      sellerApi.updateItem(itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller'] });
      // 가격·판매상태 변동이 상품 상세에 반영되도록 캐시 갱신
      queryClient.invalidateQueries({ queryKey: ['products', 'detail'] });
      toast.success('옵션이 수정되었습니다.');
    },
  });
}

export function useInboundMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      quantity,
      reason,
    }: {
      itemId: number;
      quantity: number;
      reason?: string;
    }) => sellerApi.inbound(itemId, { quantity, reason }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['seller'] });
      // 입고로 품절 여부가 바뀔 수 있어 상품 상세 캐시도 갱신
      queryClient.invalidateQueries({ queryKey: ['products', 'detail'] });
      toast.success(`입고 완료 — 현재 재고 ${res.currentStock.toLocaleString()}개`);
    },
  });
}

export function useConfirmOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderItemId: number) => sellerApi.confirmOrder(orderItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'orders'] });
      toast.success('주문이 확인되었습니다.');
    },
  });
}

export function useShipDeliveryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      deliveryId,
      deliveryCompany,
      invoiceNumber,
    }: {
      deliveryId: number;
      deliveryCompany: string;
      invoiceNumber: string;
    }) => sellerApi.shipDelivery(deliveryId, { deliveryCompany, invoiceNumber }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller'] });
      toast.success('배송이 시작되었습니다.');
    },
  });
}

export function useRejectOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderItemId, reason }: { orderItemId: number; reason: string }) =>
      sellerApi.rejectOrder(orderItemId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'orders'] });
      toast.success('주문을 거절했습니다.');
    },
  });
}

export function useUpdateDeliveryStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ deliveryId, status }: { deliveryId: number; status: DeliveryStatus }) =>
      sellerApi.updateDeliveryStatus(deliveryId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller'] });
      toast.success('배송 상태가 변경되었습니다.');
    },
  });
}
