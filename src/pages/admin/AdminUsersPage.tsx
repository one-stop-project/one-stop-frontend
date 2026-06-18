import { useState } from 'react';
import { ShieldCheck, UserPlus } from 'lucide-react';
import {
  useAdminUsersQuery,
  useGrantAdminMutation,
  useRevokeAdminMutation,
} from '@/hooks/queries/useAdminUserQuery';
import { AdminUser } from '@/domains/admin/userAdminApi';
import { PageSpinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDateTime } from '@/utils/format';

const ROLE_LABELS: Record<string, { text: string; color: string }> = {
  SUPER_ADMIN: { text: '최고관리자', color: 'bg-purple-100 text-purple-700' },
  ADMIN: { text: '관리자', color: 'bg-blue-100 text-blue-700' },
  BUYER: { text: '구매자', color: 'bg-gray-100 text-gray-600' },
  SELLER: { text: '판매자', color: 'bg-gray-100 text-gray-600' },
};

export default function AdminUsersPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useAdminUsersQuery(page, 20);
  const grant = useGrantAdminMutation();
  const revoke = useRevokeAdminMutation();

  const [grantId, setGrantId] = useState('');

  const handleGrant = (e: React.FormEvent) => {
    e.preventDefault();
    const userId = Number(grantId);
    if (!grantId.trim() || !Number.isInteger(userId) || userId <= 0) return;
    grant.mutate(userId, { onSuccess: () => setGrantId('') });
  };

  const handleRevoke = (user: AdminUser) => {
    if (!window.confirm(`${user.name}(${user.email}) 님의 관리자 권한을 회수할까요?`)) return;
    revoke.mutate(user.id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">관리자 권한 관리</h1>
      <p className="text-sm text-gray-600 mb-6">
        관리자 권한을 부여하거나 회수합니다. 최고관리자(SUPER_ADMIN)만 접근할 수 있습니다.
      </p>

      {/* 권한 부여 — 대상 회원 번호를 직접 입력 (구매자 → 관리자) */}
      <form onSubmit={handleGrant} className="card p-5 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <UserPlus size={18} className="text-blue-600" />
          <h2 className="font-semibold text-gray-900">관리자 권한 부여</h2>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          관리자로 지정할 회원의 번호(ID)를 입력하세요. 구매자 계정만 부여할 수 있습니다.
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            value={grantId}
            onChange={(e) => setGrantId(e.target.value)}
            placeholder="회원 번호"
            className="input flex-1 max-w-xs"
          />
          <button type="submit" className="btn-primary" disabled={grant.isPending}>
            {grant.isPending ? '처리 중...' : '권한 부여'}
          </button>
        </div>
      </form>

      {/* 현재 관리자 목록 — 회수 대상 */}
      {isLoading ? (
        <PageSpinner />
      ) : !data || data.content.length === 0 ? (
        <EmptyState icon={<ShieldCheck size={40} />} title="관리자 계정이 없습니다" />
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">번호</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">계정</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">권한</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">가입일</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.content.map((u) => {
                  const id = u.id;
                  const role = ROLE_LABELS[u.role] ?? { text: u.role, color: 'bg-gray-100 text-gray-600' };
                  return (
                    <tr key={id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">{id}</td>
                      <td className="px-4 py-3 text-sm">
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${role.color}`}>{role.text}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{formatDateTime(u.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {u.role === 'ADMIN' ? (
                          <button
                            onClick={() => handleRevoke(u)}
                            disabled={revoke.isPending}
                            className="btn-secondary text-sm text-red-600"
                          >
                            권한 회수
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page <= 0} className="btn-secondary text-sm">
                이전
              </button>
              <span className="text-sm text-gray-600">{page + 1} / {data.totalPages}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= data.totalPages - 1} className="btn-secondary text-sm">
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
