import { Check, X } from 'lucide-react';
import { useAdminSellersQuery, useApproveSellerMutation } from '@/hooks/queries/useAdminQuery';
import { adminApi } from '@/domains/admin/adminApi';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PageSpinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  SUSPENDED: 'bg-gray-100 text-gray-700',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: '승인 대기',
  APPROVED: '승인됨',
  REJECTED: '반려됨',
  SUSPENDED: '정지',
};

export default function AdminSellersPage() {
  const { data, isLoading } = useAdminSellersQuery();
  const approveMutation = useApproveSellerMutation();
  const queryClient = useQueryClient();

  if (isLoading) return <PageSpinner />;

  const handleReject = async (sellerId: number) => {
    const reason = prompt('반려 사유를 입력하세요');
    if (!reason) return;
    try {
      await adminApi.rejectSeller(sellerId, reason);
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      toast.success('판매자가 반려되었습니다.');
    } catch {
      // 에러는 인터셉터가 처리
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">판매자 승인 관리</h1>
      <p className="text-sm text-gray-600 mb-6">승인 요청한 판매자를 검토하고 승인/반려할 수 있습니다.</p>

      {!data || data.length === 0 ? (
        <EmptyState title="승인 대기 중인 판매자가 없습니다" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">상호명</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">사업자번호</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">상태</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((s) => (
                <tr key={s.sellerId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">{s.shopName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{s.businessNumber}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[s.status]}`}>
                      {STATUS_LABELS[s.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {s.status === 'PENDING' && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => approveMutation.mutate(s.sellerId)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                          title="승인"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => handleReject(s.sellerId)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="반려"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
