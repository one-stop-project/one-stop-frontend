import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  adminCategoryApi,
  CategoryCreateRequest,
  CategoryUpdateRequest,
} from '@/domains/admin/categoryApi';

// 카테고리 변경 후 목록 캐시 갱신 (목록은 useCategoriesQuery = ['categories'])
function useInvalidateCategories() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  };
}

export function useCreateCategoryMutation() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: (data: CategoryCreateRequest) => adminCategoryApi.create(data),
    onSuccess: () => {
      invalidate();
      toast.success('카테고리가 추가되었습니다.');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? '카테고리 추가에 실패했습니다.');
    },
  });
}

export function useUpdateCategoryMutation() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: ({ categoryId, data }: { categoryId: number; data: CategoryUpdateRequest }) =>
      adminCategoryApi.update(categoryId, data),
    onSuccess: () => {
      invalidate();
      toast.success('카테고리가 수정되었습니다.');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? '카테고리 수정에 실패했습니다.');
    },
  });
}

export function useDeleteCategoryMutation() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: (categoryId: number) => adminCategoryApi.delete(categoryId),
    onSuccess: () => {
      invalidate();
      toast.success('카테고리가 삭제되었습니다.');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? '카테고리 삭제에 실패했습니다.');
    },
  });
}
