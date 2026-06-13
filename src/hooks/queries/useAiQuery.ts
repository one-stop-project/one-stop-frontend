import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { aiApi } from '@/domains/ai/aiApi';

// AI 쇼핑 어시스턴트 질의 (mutation — 매번 새 질문)
export function useShoppingAssistantMutation() {
  return useMutation({
    mutationFn: ({ message, categoryId }: { message: string; categoryId?: number }) =>
      aiApi.ask(message, categoryId),
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ?? 'AI 응답을 가져오지 못했습니다.'
      );
    },
  });
}
