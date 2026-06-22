import { useState } from 'react';
import { Activity, ShieldAlert, UserRoundSearch } from 'lucide-react';
import AdminSecurityAuditPage from '@/pages/admin/AdminSecurityAuditPage';
import SecurityActionModal from '@/components/admin/SecurityActionModal';

type SanctionableRole = 'BUYER' | 'SELLER';

interface SecurityTarget {
  id: number;
  email: string;
  role: SanctionableRole;
}

export default function AdminSystemPage() {
  const [targetId, setTargetId] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [targetRole, setTargetRole] = useState<SanctionableRole>('BUYER');
  const [securityTarget, setSecurityTarget] = useState<SecurityTarget | null>(null);

  const handleOpenSecurityAction = (event: React.FormEvent) => {
    event.preventDefault();
    const userId = Number(targetId);
    if (!Number.isInteger(userId) || userId <= 0 || !targetEmail.trim()) return;

    setSecurityTarget({
      id: userId,
      email: targetEmail.trim(),
      role: targetRole,
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <ShieldAlert className="text-red-600" size={24} />
          <h1 className="text-2xl font-bold text-gray-900">시스템 점검</h1>
        </div>
        <p className="text-sm text-gray-600">
          서버 상태와 보안 이벤트를 점검하고 Buyer/Seller 계정에 필요한 보안 조치를 실행합니다.
        </p>
      </div>

      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <Activity size={18} className="text-blue-600" />
          <h2 className="font-semibold text-gray-900">서버 모니터링 (JVM)</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <MonitoringPanel
            title="EC2 Main"
            src="https://onestop1.duckdns.org/grafana/d/adsjcs8/jvm-micrometer?orgId=1&kiosk&var-DS_PROMETHEUS=cfps5v9jx6fb4e&var-application=ec2-main&var-instance=10.0.18.198%3A8081&refresh=30s"
          />
          <MonitoringPanel
            title="EC2 Dummy"
            src="https://onestop1.duckdns.org/grafana/d/adsjcs8/jvm-micrometer?orgId=1&kiosk&var-DS_PROMETHEUS=cfps5v9jx6fb4e&var-application=ec2-dummy&var-instance=10.0.22.194%3A8081&refresh=30s"
          />
        </div>
      </section>

      <section className="mb-10" aria-labelledby="security-action-heading">
        <div className="mb-4 flex items-center gap-2">
          <UserRoundSearch size={18} className="text-red-600" />
          <h2 id="security-action-heading" className="font-semibold text-gray-900">유저 보안 제재</h2>
        </div>
        <form onSubmit={handleOpenSecurityAction} className="card p-5">
          <p className="mb-4 text-xs text-gray-500">
            보안 제재 대상은 Buyer와 Seller 계정으로 제한됩니다.
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[160px_180px_minmax(0,1fr)_auto]">
            <label>
              <span className="sr-only">회원 역할</span>
              <select
                className="input-field"
                value={targetRole}
                onChange={(event) => setTargetRole(event.target.value as SanctionableRole)}
              >
                <option value="BUYER">Buyer</option>
                <option value="SELLER">Seller</option>
              </select>
            </label>
            <label>
              <span className="sr-only">회원 ID</span>
              <input
                type="number"
                min={1}
                required
                className="input-field"
                placeholder="회원 ID"
                value={targetId}
                onChange={(event) => setTargetId(event.target.value)}
              />
            </label>
            <label>
              <span className="sr-only">회원 이메일</span>
              <input
                type="email"
                required
                className="input-field"
                placeholder="회원 이메일"
                value={targetEmail}
                onChange={(event) => setTargetEmail(event.target.value)}
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
            >
              보안 제재
            </button>
          </div>
        </form>
      </section>

      <AdminSecurityAuditPage embedded />

      <SecurityActionModal
        isOpen={securityTarget !== null}
        userId={securityTarget?.id ?? null}
        userEmail={securityTarget?.email ?? null}
        userRole={securityTarget?.role ?? 'BUYER'}
        onClose={() => setSecurityTarget(null)}
      />
    </div>
  );
}

function MonitoringPanel({ title, src }: { title: string; src: string }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-gray-500">{title}</p>
      <div className="overflow-hidden rounded-lg border border-gray-200" style={{ height: 600 }}>
        <iframe src={src} title={`${title} JVM 모니터링`} width="100%" height="100%" frameBorder="0" />
      </div>
    </div>
  );
}
