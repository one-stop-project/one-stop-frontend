import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { ApiResponse, apiClient } from '@/api/client';

type SecurityActionType = 'SUSPEND' | 'UNSUSPEND' | 'FORCE_LOGOUT';

interface SecurityActionResponse {
  targetUserId: number;
  actionType: SecurityActionType;
  reasonCode: string;
  startedAt: string;
  expiresAt: string | null;
}

interface SecurityActionModalProps {
  isOpen: boolean;
  userId: number | null;
  userEmail: string | null;
  onClose: () => void;
}

const ACTION_LABELS: Record<SecurityActionType, string> = {
  SUSPEND: '계정 정지',
  UNSUSPEND: '계정 정지 해제',
  FORCE_LOGOUT: '강제 로그아웃',
};

export default function SecurityActionModal({
  isOpen,
  userId,
  userEmail,
  onClose,
}: SecurityActionModalProps) {
  const [actionType, setActionType] = useState<SecurityActionType>('SUSPEND');
  const [reasonCode, setReasonCode] = useState('');
  const [reasonDetail, setReasonDetail] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setActionType('SUSPEND');
    setReasonCode('');
    setReasonDetail('');
    setDurationMinutes('60');
  }, [isOpen, userId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || userId === null) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedDuration = Number(durationMinutes);
    if (!reasonCode.trim()) return;
    if (actionType === 'SUSPEND' && (!Number.isInteger(parsedDuration) || parsedDuration < 1 || parsedDuration > 43200)) {
      toast.error('정지 시간은 1분에서 43,200분 사이여야 합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.post<ApiResponse<SecurityActionResponse>>(
        `/admin/security/users/${userId}/actions`,
        {
          actionType,
          reasonCode: reasonCode.trim(),
          reasonDetail: reasonDetail.trim() || undefined,
          durationMinutes: actionType === 'SUSPEND' ? parsedDuration : undefined,
        },
      );
      const result = res.data.data;
      toast.success(`${ACTION_LABELS[result.actionType]} 처리가 완료되었습니다.`);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="security-action-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <h2 id="security-action-title" className="text-lg font-bold text-gray-900">보안 제재</h2>
            <p className="mt-1 text-sm text-gray-500">{userEmail ?? `회원 #${userId}`} · ID {userId}</p>
          </div>
          <button
            type="button"
            aria-label="닫기"
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            disabled={isSubmitting}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">제재 유형</span>
            <select
              className="input-field"
              value={actionType}
              onChange={(event) => setActionType(event.target.value as SecurityActionType)}
            >
              {Object.entries(ACTION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">사유 코드</span>
            <input
              className="input-field"
              required
              maxLength={100}
              placeholder="예: ABUSIVE_BEHAVIOR"
              value={reasonCode}
              onChange={(event) => setReasonCode(event.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">상세 사유</span>
            <textarea
              className="input-field min-h-24 resize-y"
              maxLength={1000}
              placeholder="관리 목적의 상세 사유를 입력하세요."
              value={reasonDetail}
              onChange={(event) => setReasonDetail(event.target.value)}
            />
          </label>

          {actionType === 'SUSPEND' && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">정지 시간 (분)</span>
              <input
                type="number"
                className="input-field"
                min={1}
                max={43200}
                required
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
              />
            </label>
          )}

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
            <button type="button" className="btn-secondary" disabled={isSubmitting} onClick={onClose}>취소</button>
            <button
              type="submit"
              className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting || !reasonCode.trim()}
            >
              {isSubmitting ? '처리 중...' : '제재 실행'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
