import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { userAdminApi } from '@/domains/admin/userAdminApi';

export function useAdminUsersQuery(page = 0, size = 20) {
  return useQuery({
    queryKey: ['admin', 'users', page, size],
    queryFn: () => userAdminApi.getAdminUsers(page, size),
  });
}

export function useGrantAdminMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => userAdminApi.grant(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('관리자 권한을 부여했습니다.');
    },
  });
}

export function useRevokeAdminMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => userAdminApi.revoke(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('관리자 권한을 회수했습니다.');
    },
  });
}
