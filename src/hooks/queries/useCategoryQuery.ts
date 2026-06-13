import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { categoryApi } from '@/domains/category/categoryApi';
import {
  adminCategoryApi,
  CategoryCreateRequest,
  CategoryUpdateRequest,
} from '@/domains/admin/categoryApi';

const CATEGORY_KEY = ['category'];

// 카테고리 트리 조회 — 거의 안 바뀌므로 길게 캐싱
export function useCategoryTreeQuery() {
  return useQuery({
    queryKey: [...CATEGORY_KEY, 'tree'],
    queryFn: () => categoryApi.getTree(),
    staleTime: 10 * 60 * 1000,   // 10분
    gcTime: 30 * 60 * 1000,
  });
}

// 카테고리 변경 후 트리/목록 캐시 갱신 (useCategoriesQuery=['categories'], 위 트리=['category'])
function useInvalidateCategories() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    queryClient.invalidateQueries({ queryKey: CATEGORY_KEY });
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
