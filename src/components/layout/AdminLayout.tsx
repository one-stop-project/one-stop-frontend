import { LayoutDashboard, Package, Store, ShoppingBag, FolderTree, Ticket, Crown, ShieldCheck, LucideIcon } from 'lucide-react';
import { DashboardLayout } from './DashboardLayout';
import { useAuthStore } from '@/store/useAuthStore';

interface AdminNav {
  to: string;
  label: string;
  icon: LucideIcon;
  superAdminOnly?: boolean; // 최고관리자에게만 노출
}

const NAV: AdminNav[] = [
  { to: '/admin', label: '대시보드', icon: LayoutDashboard },
  { to: '/admin/products', label: '상품 관리', icon: Package },
  { to: '/admin/sellers', label: '판매자 관리', icon: Store },
  { to: '/admin/orders', label: '주문 조회', icon: ShoppingBag },
  { to: '/admin/categories', label: '카테고리 관리', icon: FolderTree },
  { to: '/admin/coupons', label: '쿠폰 관리', icon: Ticket },
  { to: '/admin/subscriptions', label: '구독 관리', icon: Crown },
  { to: '/admin/users', label: '권한 관리', icon: ShieldCheck, superAdminOnly: true },
];

export function AdminLayout() {
  const isSuperAdmin = useAuthStore((s) => s.hasRole)('SUPER_ADMIN');
  const navItems = NAV.filter((item) => !item.superAdminOnly || isSuperAdmin).map(
    ({ to, label, icon }) => ({ to, label, icon })
  );

  return <DashboardLayout title="관리자" navItems={navItems} />;
}
