import {FormEvent, useState} from 'react';
import {Link} from 'react-router-dom';
import {ShoppingBag} from 'lucide-react';
import {useSignupMutation} from '@/hooks/queries/useAuthQuery';

type UserType = 'BUYER' | 'SELLER';

// 백엔드 검증 규칙과 동일하게 맞춤 (SignUpRequest)
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
const PHONE_RE = /^010-\d{4}-\d{4}$/;
// @ 앞뒤로 문자가 있고 도메인에 점(.)이 있는 일반적인 이메일 형식
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldKey =
  | 'email'
  | 'password'
  | 'passwordConfirm'
  | 'name'
  | 'phone'
  | 'address'
  | 'shopName'
  | 'businessNumber'
  | 'bankName'
  | 'bankAccount';
type FieldErrors = Partial<Record<FieldKey, string>>;

export default function SignupPage() {
  const [userType, setUserType] = useState<UserType>('BUYER');
  const [form, setForm] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    phone: '',
    address: '',
    detailAddress: '',
    shopName: '',
    businessNumber: '',
    bankName: '',
    bankAccount: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  const signupMutation = useSignupMutation();

  // 전화번호 입력 시 자동으로 하이픈 삽입 (010-1234-5678)
  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length < 4) return d;
    if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // 검증 실패는 알림창 대신 각 칸 아래 인라인 에러로 한 번에 표시
    const next: FieldErrors = {};
    if (!EMAIL_RE.test(form.email)) {
      next.email = '이메일 형식이 올바르지 않습니다. 예: email@example.com';
    }
    if (!PASSWORD_RE.test(form.password)) {
      next.password = '영문, 숫자, 특수문자(@$!%*#?&)를 모두 포함해 8자 이상이어야 합니다.';
    }
    if (form.password !== form.passwordConfirm) {
      next.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    }
    if (!PHONE_RE.test(form.phone)) {
      next.phone = '전화번호 형식이 올바르지 않습니다. 예: 010-1234-5678';
    }
    if (!form.name.trim()) {
      next.name = '이름을 입력해주세요.';
    }
    if (!form.address.trim()) {
      next.address = '주소를 입력해주세요.';
    }
    // 판매자는 상호명·사업자등록번호와 정산 계좌(은행명·계좌번호)가 모두 필수.
    // 비워서 보내면 백엔드가 가입을 거부(SELLER_012)하므로 제출 전에 막는다.
    if (userType === 'SELLER') {
      if (!form.shopName.trim()) {
        next.shopName = '상호명을 입력해주세요.';
      }
      if (!form.businessNumber.trim()) {
        next.businessNumber = '사업자등록번호를 입력해주세요.';
      }
      if (!form.bankName.trim()) {
        next.bankName = '은행명을 입력해주세요.';
      }
      if (!form.bankAccount.trim()) {
        next.bankAccount = '계좌번호를 입력해주세요.';
      }
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const { passwordConfirm, ...rest } = form;

    if (userType === 'BUYER') {
      // BUYER: 판매자 전용 필드 제거 + role 포함 (주소·상세주소는 유지)
      const { shopName, businessNumber, bankName, bankAccount, ...buyerRest } = rest;
      signupMutation.mutate({
        ...buyerRest,
        role: 'BUYER',          // ★ 백엔드 @NotNull role 충족
      });
    } else {
      // SELLER: 전체 필드 + role 포함
      signupMutation.mutate({
        ...rest,
        role: 'SELLER',         // ★ 백엔드 @NotNull role 충족
      });
    }
  };

  const update = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // 사용자가 그 칸을 고치면 해당 칸의 에러는 즉시 지운다
    setErrors((prev) =>
      prev[field as FieldKey] ? { ...prev, [field]: undefined } : prev
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-gray-50 py-12 px-4">
      <div className="w-full max-w-lg mx-auto">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
            <ShoppingBag className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">One-Stop</span>
        </Link>

        <div className="card p-8 animate-fade-in">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">회원가입</h1>
          <p className="text-sm text-gray-600 mb-6">진심을 담은 쇼핑을 함께 시작해보세요.</p>

          {/* 회원 유형 선택 */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {(['BUYER', 'SELLER'] as UserType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setUserType(type)}
                className={`py-3 rounded-lg font-medium border-2 transition-all ${
                  userType === type
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {type === 'BUYER' ? '🛍️ 구매자' : '🏪 판매자'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* 공통 필드 */}
            <FormField label="이메일" required error={errors.email}>
              <input
                type="email"
                className="input-field"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="email@example.com"
                required
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="비밀번호" required error={errors.password}>
                <input
                  type="password"
                  className="input-field"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="영문+숫자+특수문자 8자 이상"
                  required
                />
              </FormField>
              <FormField label="비밀번호 확인" required error={errors.passwordConfirm}>
                <input
                  type="password"
                  className="input-field"
                  value={form.passwordConfirm}
                  onChange={(e) => update('passwordConfirm', e.target.value)}
                  required
                />
              </FormField>
            </div>

            <FormField label="이름" required error={errors.name}>
              <input
                type="text"
                className="input-field"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                required
              />
            </FormField>

            <FormField label="전화번호" required error={errors.phone}>
              <input
                type="tel"
                className="input-field"
                value={form.phone}
                onChange={(e) => update('phone', formatPhone(e.target.value))}
                placeholder="010-1234-5678"
                required
              />
            </FormField>

            <FormField label="주소" required error={errors.address}>
              <input
                type="text"
                className="input-field"
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                placeholder="서울시 강남구 테헤란로 123"
                required
              />
            </FormField>

            <FormField label="상세주소">
              <input
                type="text"
                className="input-field"
                value={form.detailAddress}
                onChange={(e) => update('detailAddress', e.target.value)}
                placeholder="동·호수 등 상세주소 (선택)"
              />
            </FormField>

            {/* 판매자 추가 필드 */}
            {userType === 'SELLER' && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-slide-up">
                <p className="text-sm font-medium text-gray-700">판매자 추가 정보</p>

                <FormField label="상호명" required error={errors.shopName}>
                  <input
                    type="text"
                    className="input-field"
                    value={form.shopName}
                    onChange={(e) => update('shopName', e.target.value)}
                    required
                  />
                </FormField>

                <FormField label="사업자등록번호" required error={errors.businessNumber}>
                  <input
                    type="text"
                    className="input-field"
                    value={form.businessNumber}
                    onChange={(e) => update('businessNumber', e.target.value)}
                    placeholder="123-45-67890"
                    required
                  />
                </FormField>

                {/* 정산 계좌 — 은행명과 계좌번호를 분리 입력 */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="은행명" required error={errors.bankName}>
                    <input
                      type="text"
                      className="input-field"
                      value={form.bankName}
                      onChange={(e) => update('bankName', e.target.value)}
                      placeholder="예: 국민은행"
                      required={userType === 'SELLER'}
                    />
                  </FormField>

                  <FormField label="계좌번호" required error={errors.bankAccount}>
                    <input
                      type="text"
                      className="input-field"
                      value={form.bankAccount}
                      onChange={(e) => update('bankAccount', e.target.value)}
                      placeholder="'-' 없이 숫자만"
                      required={userType === 'SELLER'}
                    />
                  </FormField>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={signupMutation.isPending}
              className="btn-primary w-full py-3 mt-6"
            >
              {signupMutation.isPending ? '가입 중...' : '회원가입'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            이미 회원이신가요?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-primary-600 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
