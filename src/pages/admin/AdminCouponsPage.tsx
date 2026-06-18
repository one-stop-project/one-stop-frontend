import { useState } from 'react';
import { Plus, Ticket } from 'lucide-react';
import {
  useAdminCouponsQuery,
  useCreateCouponMutation,
  useDeactivateCouponMutation,
} from '@/hooks/queries/useAdminCouponQuery';
import {
  CouponDiscountType,
  CouponStatus,
  CreateCouponRequest,
} from '@/domains/admin/couponAdminApi';
import { PageSpinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { formatPrice, formatDateTime } from '@/utils/format';

const STATUS_LABELS: Record<CouponStatus, { text: string; color: string }> = {
  ACTIVE: { text: '활성', color: 'bg-green-100 text-green-700' },
  INACTIVE: { text: '비활성', color: 'bg-gray-100 text-gray-600' },
};

const DISCOUNT_LABELS: Record<CouponDiscountType, string> = {
  RATE: '정률(%)',
  FIXED: '정액(원)',
};

const EMPTY_FORM: CreateCouponRequest = {
  name: '',
  discountType: 'RATE',
  discountValue: 10,
  minOrderPrice: 0,
  maxDiscountPrice: 5000,
  totalQuantity: 100,
  startAt: '',
  expiredAt: '',
};

export default function AdminCouponsPage() {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<CouponStatus | ''>('');
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useAdminCouponsQuery(page, 20, statusFilter || undefined);
  const deactivateMutation = useDeactivateCouponMutation();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">쿠폰 관리</h1>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary flex items-center gap-1">
          <Plus size={16} />
          쿠폰 생성
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-6">할인 쿠폰을 발급하고 발급 현황을 관리할 수 있습니다.</p>

      {showForm && <CouponCreateForm onDone={() => setShowForm(false)} />}

      {/* 상태 필터 */}
      <div className="flex gap-2 mb-4">
        {([['', '전체'], ['ACTIVE', '활성'], ['INACTIVE', '비활성']] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => {
              setStatusFilter(value);
              setPage(0);
            }}
            className={`px-3 py-1.5 text-sm rounded-lg border ${
              statusFilter === value
                ? 'bg-primary-50 border-primary-500 text-primary-700 font-medium'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : !data || data.content.length === 0 ? (
        <EmptyState icon={<Ticket size={40} />} title="쿠폰이 없습니다" />
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">이름</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">할인</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">최소주문</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">발급/총량</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">기간</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.content.map((c) => (
                  <tr key={c.couponId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-sm">
                      {c.discountType === 'RATE'
                        ? `${c.discountValue}%${c.maxDiscountPrice ? ` (최대 ${formatPrice(c.maxDiscountPrice)})` : ''}`
                        : formatPrice(c.discountValue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatPrice(c.minOrderPrice)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {c.issuedQuantity}/{c.totalQuantity}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDateTime(c.startAt)}
                      <br />~ {formatDateTime(c.expiredAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${STATUS_LABELS[c.status].color}`}>
                        {STATUS_LABELS[c.status].text}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.status === 'ACTIVE' && (
                        <button
                          onClick={() => {
                            if (confirm(`'${c.name}' 쿠폰을 비활성화할까요?`))
                              deactivateMutation.mutate(c.couponId);
                          }}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          비활성화
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page <= 0}
                className="btn-secondary text-sm"
              >
                이전
              </button>
              <span className="text-sm text-gray-600">
                {page + 1} / {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.totalPages - 1}
                className="btn-secondary text-sm"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CouponCreateForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState<CreateCouponRequest>(EMPTY_FORM);
  const createMutation = useCreateCouponMutation();

  const set = <K extends keyof CreateCouponRequest>(key: K, value: CreateCouponRequest[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return alert('쿠폰 이름을 입력하세요.');
    if (!form.startAt || !form.expiredAt) return alert('시작/종료 일시를 입력하세요.');
    if (new Date(form.expiredAt) <= new Date(form.startAt))
      return alert('종료 일시는 시작 일시보다 뒤여야 합니다.');

    const payload: CreateCouponRequest = {
      ...form,
      // 정액(FIXED)은 최대 할인액을 보내지 않음
      maxDiscountPrice: form.discountType === 'RATE' ? form.maxDiscountPrice : null,
    };
    createMutation.mutate(payload, { onSuccess: () => { setForm(EMPTY_FORM); onDone(); } });
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 mb-6 space-y-4">
      <h2 className="font-semibold text-gray-900">새 쿠폰 생성</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="쿠폰 이름">
          <input className="input-field" value={form.name} onChange={(e) => set('name', e.target.value)} maxLength={100} />
        </Field>
        <Field label="할인 방식">
          <select
            className="input-field"
            value={form.discountType}
            onChange={(e) => set('discountType', e.target.value as CouponDiscountType)}
          >
            <option value="RATE">정률(%)</option>
            <option value="FIXED">정액(원)</option>
          </select>
        </Field>
        <Field label={form.discountType === 'RATE' ? '할인율(%)' : '할인액(원)'}>
          <input type="number" min={1} className="input-field" value={form.discountValue}
            onChange={(e) => set('discountValue', Number(e.target.value))} />
        </Field>
        {form.discountType === 'RATE' && (
          <Field label="최대 할인액(원)">
            <input type="number" min={0} className="input-field" value={form.maxDiscountPrice ?? 0}
              onChange={(e) => set('maxDiscountPrice', Number(e.target.value))} />
          </Field>
        )}
        <Field label="최소 주문금액(원)">
          <input type="number" min={0} className="input-field" value={form.minOrderPrice}
            onChange={(e) => set('minOrderPrice', Number(e.target.value))} />
        </Field>
        <Field label="총 발급 수량">
          <input type="number" min={1} className="input-field" value={form.totalQuantity}
            onChange={(e) => set('totalQuantity', Number(e.target.value))} />
        </Field>
        <Field label="시작 일시">
          <input type="datetime-local" className="input-field" value={form.startAt}
            onChange={(e) => set('startAt', e.target.value)} />
        </Field>
        <Field label="종료 일시">
          <input type="datetime-local" className="input-field" value={form.expiredAt}
            onChange={(e) => set('expiredAt', e.target.value)} />
        </Field>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onDone} className="btn-secondary">취소</button>
        <button type="submit" disabled={createMutation.isPending} className="btn-primary">
          {createMutation.isPending ? '생성 중...' : '생성'}
        </button>
      </div>
    </form>
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
