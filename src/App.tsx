import {BrowserRouter, Route, Routes} from 'react-router-dom';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';
import {Toaster} from 'react-hot-toast';

import {MainLayout} from '@/components/layout/MainLayout';
import {SellerLayout} from '@/components/layout/SellerLayout';
import {AdminLayout} from '@/components/layout/AdminLayout';
import {ProtectedRoute} from '@/components/route/ProtectedRoute';
import {AuthInitializer} from '@/components/route/AuthInitializer';

// 👈 추가된 부분 1: 컴포넌트 임포트
import CouponsPage from '@/pages/coupon/CouponsPage';
import AiAssistantWidget from '@/components/AiAssistantWidget';
import NotificationSse from '@/components/NotificationSse';

// Auth
import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';
import OAuth2CallbackPage from '@/pages/auth/OAuth2CallbackPage';

// Product
import HomePage from '@/pages/product/HomePage';
import ProductListPage from '@/pages/product/ProductListPage';
import ProductDetailPage from '@/pages/product/ProductDetailPage';

// Cart / Order / Payment
import CartPage from '@/pages/cart/CartPage';
import CheckoutPage from '@/pages/order/CheckoutPage';
import OrderListPage from '@/pages/order/OrderListPage';
import OrderDetailPage from '@/pages/order/OrderDetailPage';
import OrderCompletePage from '@/pages/order/OrderCompletePage';
import PaymentPage from '@/pages/payment/PaymentPage';

// User
import MyPage from '@/pages/user/MyPage';
import ReviewsPage from '@/pages/user/ReviewsPage';
import PointsPage from '@/pages/user/PointsPage';
import PasswordChangePage from '@/pages/user/PasswordChangePage';
import WithdrawPage from '@/pages/user/WithdrawPage';

// Seller
import SellerDashboard from '@/pages/seller/SellerDashboard';
import SellerProductsPage from '@/pages/seller/SellerProductsPage';
import SellerProductsNewPage from '@/pages/seller/SellerProductsNewPage';
import SellerProductEditPage from '@/pages/seller/SellerProductEditPage';
import SellerInventoryPage from '@/pages/seller/SellerInventoryPage';
import SellerOrdersPage from '@/pages/seller/SellerOrdersPage';
import SellerReviewsPage from '@/pages/seller/SellerReviewsPage';

// Admin
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminProductsPage from '@/pages/admin/AdminProductsPage';
import AdminSellersPage from '@/pages/admin/AdminSellersPage';
import AdminOrdersPage from '@/pages/admin/AdminOrdersPage';
import AdminCategoriesPage from '@/pages/admin/AdminCategoriesPage';
import AdminCouponsPage from '@/pages/admin/AdminCouponsPage';
import AdminSubscriptionsPage from '@/pages/admin/AdminSubscriptionsPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminAnalyticsPage from '@/pages/admin/AdminAnalyticsPage';
import AdminSystemPage from '@/pages/admin/AdminSystemPage';
import AdminSecurityAuditPage from '@/pages/admin/AdminSecurityAuditPage';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // 권한없음·잘못된 요청(4xx)은 재시도해도 동일하게 실패하므로 즉시 중단(불필요한 재요청·중복 알림 방지).
            // 일시적 서버 오류(5xx)와 응답이 없는 네트워크/타임아웃 오류만 1회 재시도한다.
            retry: (failureCount, error) => {
                const status = (error as { response?: { status?: number } })?.response?.status;
                // 응답 자체가 없는 경우(네트워크 끊김·타임아웃 등)는 일시적일 수 있으므로 1회 재시도.
                if (typeof status !== 'number') return failureCount < 1;
                return status >= 500 && failureCount < 1;
            },
            refetchOnWindowFocus: false,
            staleTime: 30 * 1000,
        },
    },
});

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AuthInitializer>
                    <Routes>
                        {/* 인증 (레이아웃 없음) */}
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignupPage />} />
                        <Route path="/oauth2/callback" element={<OAuth2CallbackPage />} />

                        {/* 메인 레이아웃 (구매자/공통) */}
                        <Route element={<MainLayout />}>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/products" element={<ProductListPage />} />
                            <Route path="/products/:id" element={<ProductDetailPage />} />

                            {/* 장바구니 — 비로그인 게스트도 이용(백엔드 guest_cart_id 쿠키) */}
                            <Route path="/cart" element={<CartPage />} />

                            {/* 인증만 필요 (역할 무관) — 내정보·비밀번호·탈퇴 */}
                            <Route element={<ProtectedRoute />}>
                                <Route path="/mypage" element={<MyPage />} />
                                <Route path="/mypage/password" element={<PasswordChangePage />} />
                                <Route path="/mypage/withdraw" element={<WithdrawPage />} />
                            </Route>

                            {/* 구매자 전용(BUYER) — 백엔드가 BUYER 역할만 허용하는 주문·결제·쿠폰·포인트·리뷰 */}
                            <Route element={<ProtectedRoute roles="BUYER" />}>
                                <Route path="/checkout" element={<CheckoutPage />} />
                                <Route path="/payment/:id" element={<PaymentPage />} />
                                <Route path="/orders" element={<OrderListPage />} />
                                <Route path="/orders/:id" element={<OrderDetailPage />} />
                                <Route path="/orders/:id/complete" element={<OrderCompletePage />} />
                                <Route path="/coupons" element={<CouponsPage />} />
                                <Route path="/mypage/reviews" element={<ReviewsPage />} />
                                <Route path="/mypage/points" element={<PointsPage />} />
                            </Route>
                        </Route>

                        {/* 판매자 (SELLER 권한) */}
                        <Route element={<ProtectedRoute roles="SELLER" />}>
                            <Route element={<SellerLayout />}>
                                <Route path="/seller" element={<SellerDashboard />} />
                                <Route path="/seller/products" element={<SellerProductsPage />} />
                                <Route path="/seller/products/new" element={<SellerProductsNewPage />} />
                                <Route path="/seller/products/:id/edit" element={<SellerProductEditPage />} />
                                <Route path="/seller/inventory" element={<SellerInventoryPage />} />
                                <Route path="/seller/orders" element={<SellerOrdersPage />} />
                                <Route path="/seller/reviews" element={<SellerReviewsPage />} />
                            </Route>
                        </Route>

                        {/* 관리자 (ADMIN/SUPER_ADMIN 권한) */}
                        <Route element={<ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']} />}>
                            <Route element={<AdminLayout />}>
                                <Route path="/admin" element={<AdminDashboard />} />
                                <Route path="/admin/products" element={<AdminProductsPage />} />
                                <Route path="/admin/sellers" element={<AdminSellersPage />} />
                                <Route path="/admin/orders" element={<AdminOrdersPage />} />
                                <Route path="/admin/categories" element={<AdminCategoriesPage />} />
                                <Route path="/admin/coupons" element={<AdminCouponsPage />} />
                                <Route path="/admin/subscriptions" element={<AdminSubscriptionsPage />} />
                                <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />

                                {/* 최고관리자(SUPER_ADMIN) 전용 */}
                                <Route element={<ProtectedRoute roles="SUPER_ADMIN" />}>
                                    <Route path="/admin/users" element={<AdminUsersPage />} />
                                    <Route path="/admin/system" element={<AdminSystemPage />} />
                                    <Route path="/admin/security-audit" element={<AdminSecurityAuditPage />} />
                                </Route>
                            </Route>
                        </Route>

                        {/* 404 */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>

                    {/* 👈 추가된 부분 3: AI 어시스턴트 위젯 배치 */}
                    <AiAssistantWidget />
                    <NotificationSse />

                </AuthInitializer>
            </BrowserRouter>

            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 3000,
                    style: {
                        borderRadius: '10px',
                        fontSize: '14px',
                    },
                }}
            />

            {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
    );
}

function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <h1 className="text-6xl font-bold text-gray-300">404</h1>
            <p className="text-gray-600">페이지를 찾을 수 없습니다.</p>
            <a href="/" className="btn-primary">
                홈으로 돌아가기
            </a>
        </div>
    );
}
