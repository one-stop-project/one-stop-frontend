import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface RejectReasonModalProps {
  isOpen: boolean;
  // 모달 제목 (예: "상품 반려" / "판매자 반려")
  title: string;
  isSubmitting?: boolean;
  onClose: () => void;
  // 공백을 제거한 사유 문자열을 넘긴다(빈 값이면 호출되지 않음).
  onSubmit: (reason: string) => void;
}

const MAX_LENGTH = 500;

// 반려 사유를 입력받는 공용 모달. 브라우저 기본 prompt 대신 앱 디자인에 맞춘 입력 화면을 제공한다.
export default function RejectReasonModal({
  isOpen,
  title,
  isSubmitting = false,
  onClose,
  onSubmit,
}: RejectReasonModalProps) {
  const [reason, setReason] = useState('');

  // 모달이 새로 열릴 때마다 이전 입력값을 비운다.
  useEffect(() => {
    if (isOpen) setReason('');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // 공백만 입력하면 서버가 거부(@NotBlank)하므로 제출 전에 막는다.
    const trimmed = reason.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-reason-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <button
          type="button"
          aria-label="닫기"
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          disabled={isSubmitting}
          onClick={onClose}
        >
          <X size={20} />
        </button>

        <div className="px-7 pb-7 pt-8">
          {/* 경고 아이콘 */}
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="text-red-500" size={24} />
          </div>

          <h2 id="reject-reason-title" className="text-center text-lg font-bold text-gray-900">
            {title}
          </h2>
          <p className="mx-auto mt-1.5 max-w-xs text-center text-sm leading-relaxed text-gray-500">
            입력한 사유는 판매자에게 그대로 전달됩니다.
          </p>

          <form onSubmit={handleSubmit} className="mt-5">
            <textarea
              className="input-field min-h-28 resize-y"
              maxLength={MAX_LENGTH}
              autoFocus
              placeholder="반려 사유를 입력해주세요."
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
            <div className="mt-1.5 text-right text-xs text-gray-400">
              {reason.length}/{MAX_LENGTH}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-lg border border-gray-200 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                disabled={isSubmitting}
                onClick={onClose}
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 rounded-lg bg-red-600 py-2.5 font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSubmitting || !reason.trim()}
              >
                {isSubmitting ? '처리 중...' : '반려하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
