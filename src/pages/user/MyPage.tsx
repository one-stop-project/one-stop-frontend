import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, User as UserIcon, Lock, Trash2, Crown, Star, Coins, Ticket } from 'lucide-react';
import { useMyInfoQuery, useUpdateMyInfoMutation } from '@/hooks/queries/useUserQuery';
import {
  useMySubscriptionQuery,
  useSubscribeMutation,
  useCancelSubscriptionMutation,
} from '@/hooks/queries/useSubscriptionQuery';
import { PageSpinner } from '@/components/common/Spinner';
import { formatPhone, formatDate } from '@/utils/format';
import { useAuthStore } from '@/store/useAuthStore';

export default function MyPage() {
  const { data: me, isLoading } = useMyInfoQuery();
  const updateMutation = useUpdateMyInfoMutation();
  const isBuyer = useAuthStore((s) => s.hasRole)('BUYER'); // 주문·리뷰·포인트·구독은 구매자 전용
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });

  if (isLoading || !me) return <PageSpinner />;

  const startEditing = () => {
    setForm({ name: me.name, phone: me.phone, address: me.address });
    setEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate(form, {
      onSuccess: () => setEditing(false),
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">마이페이지</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 사이드바 — 사용자 카드 */}
        <aside className="md:col-span-1">
          <div className="card p-6 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
              {me.name.charAt(0)}
            </div>
            <h2 className="font-bold text-lg">{me.name}</h2>
            <p className="text-sm text-gray-500 mb-4">{me.email}</p>

            <div className="space-y-1 text-left text-xs text-gray-500">
              <p>가입일: {formatDate(me.createdAt)}</p>
              {me.social && me.provider && <p>{me.provider} 계정 연동</p>}
            </div>
          </div>

          {isBuyer && (
            <nav className="card p-2 mt-4 space-y-1">
              <Link
                to="/orders"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm"
              >
                <Package size={18} className="text-gray-500" />
                주문 내역
              </Link>
              <Link
                to="/mypage/reviews"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm"
              >
                <Star size={18} className="text-gray-500" />
                리뷰 관리
              </Link>
              <Link
                to="/mypage/points"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm"
              >
                <Coins size={18} className="text-gray-500" />
                포인트
              </Link>
              <Link
                to="/coupons"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm"
              >
                <Ticket size={18} className="text-gray-500" />
                쿠폰
              </Link>
            </nav>
          )}
        </aside>

        {/* 메인 — 정보 수정 */}
        <main className="md:col-span-2 space-y-4">
          <section className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <UserIcon size={20} className="text-primary-600" />
                내 정보
              </h2>
              {!editing && (
                <button onClick={startEditing} className="text-sm text-primary-600 hover:text-primary-700">
                  수정
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-3">
                <Field label="이름">
                  <input
                    className="input-field"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </Field>
                <Field label="전화번호">
                  <input
                    className="input-field"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </Field>
                <Field label="주소">
                  <input
                    className="input-field"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </Field>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setEditing(false)} className="btn-secondary flex-1">
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="btn-primary flex-1"
                  >
                    저장
                  </button>
                </div>
              </div>
            ) : (
              <dl className="space-y-3 text-sm">
                <Row label="이름" value={me.name} />
                <Row label="전화번호" value={formatPhone(me.phone)} />
                <Row label="주소" value={me.address} />
              </dl>
            )}
          </section>

          {isBuyer && <SubscriptionSection />}

          {!me.social && (
            <section className="card p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
                <Lock size={20} className="text-primary-600" />
                비밀번호 변경
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                주기적으로 비밀번호를 변경하여 계정을 안전하게 지키세요.
              </p>
              <Link to="/mypage/password" className="btn-secondary inline-block">
                비밀번호 변경하기
              </Link>
            </section>
          )}

          <section className="card p-6 border-red-200">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-2 text-red-700">
              <Trash2 size={20} />
              회원 탈퇴
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              탈퇴 시 모든 정보가 삭제되며 복구할 수 없습니다.
            </p>
            <Link to="/mypage/withdraw" className="text-sm text-red-600 hover:text-red-700 font-medium">
              탈퇴하기 →
            </Link>
          </section>
        </main>
      </div>
    </div>
  );
}

function SubscriptionSection() {
  const { data: sub, isLoading } = useMySubscriptionQuery();
  const subscribe = useSubscribeMutation();
  const cancel = useCancelSubscriptionMutation();

  const active = sub != null && sub.status === 'ACTIVE';
  // 해지(CANCELLED)는 종료일까지 혜택이 유지되고 재구독이 막혀 있다(백엔드 규칙).
  const cancelledButValid = sub != null && sub.status === 'CANCELLED';

  const handleCancel = () => {
    const reason = prompt('구독 해지 사유를 입력하세요');
    if (!reason || !reason.trim()) return;
    cancel.mutate({ reason: reason.trim() });
  };

  return (
    <section className="card p-6">
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
        <Crown size={20} className="text-primary-600" />
        멤버십 구독
      </h2>

      {isLoading ? (
        <p className="text-sm text-gray-400">불러오는 중...</p>
      ) : active ? (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">이용 중</span>
            <span className="text-sm text-gray-600">{sub!.daysLeft}일 남음</span>
          </div>
          <dl className="space-y-2 text-sm mb-4">
            <Row label="시작일" value={formatDate(sub!.startAt)} />
            <Row label="종료일" value={formatDate(sub!.endAt)} />
            <Row label="다음 결제일" value={formatDate(sub!.nextPaymentDate)} />
          </dl>
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancel.isPending}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            구독 해지 →
          </button>
        </div>
      ) : cancelledButValid ? (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">해지됨</span>
            <span className="text-sm text-gray-600">종료일까지 {sub!.daysLeft}일 혜택 유지</span>
          </div>
          <dl className="space-y-2 text-sm mb-3">
            <Row label="시작일" value={formatDate(sub!.startAt)} />
            <Row label="혜택 종료일" value={formatDate(sub!.endAt)} />
          </dl>
          <p className="text-xs text-gray-400">
            해지하셨지만 종료일까지는 멤버십 혜택이 유지됩니다. 재구독은 기간 종료 후 가능합니다.
          </p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            멤버십에 가입하면 주문 시 할인 등 혜택을 받을 수 있어요.
          </p>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('멤버십을 구독하시겠습니까?')) subscribe.mutate();
            }}
            disabled={subscribe.isPending}
            className="btn-primary"
          >
            {subscribe.isPending ? '처리 중...' : '멤버십 구독하기'}
          </button>
        </div>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <dt className="text-gray-600">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  );
}
