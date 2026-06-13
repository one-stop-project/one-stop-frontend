import { LayoutDashboard, Package, Store, ShoppingBag, FolderTree } from 'lucide-react';
import { DashboardLayout } from './DashboardLayout';

export function AdminLayout() {
  return (
    <DashboardLayout
      title="관리자"
      navItems={[
        { to: '/admin', label: '대시보드', icon: LayoutDashboard },
        { to: '/admin/products', label: '상품 관리', icon: Package },
        { to: '/admin/sellers', label: '판매자 관리', icon: Store },
        { to: '/admin/orders', label: '주문 조회', icon: ShoppingBag },
        { to: '/admin/categories', label: '카테고리 관리', icon: FolderTree },
      ]}
    />
  );
}
