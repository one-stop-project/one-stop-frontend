import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authApi } from '@/domains/auth/authApi';
import { userApi } from '@/domains/user/userApi';
import { useAuthStore } from '@/store/useAuthStore';
import { setAccessToken } from '@/api/client';
import { PageSpinner } from '@/components/common/Spinner';

// 소셜 로그인 콜백: OAuth2SuccessHandler가 {프론트}/oauth2/callback?code=... 로 리다이렉트하면
// 일회용 code를 Access Token으로 교환하고 사용자 정보를 채운 뒤 홈으로 이동한다.
export default function OAuth2CallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const login = useAuthStore((s) => s.login);
  const ran = useRef(false);

  useEffect(() => {
    // StrictMode 이중 실행 가드 — 일회용 code가 두 번째 호출에서 거부되는 것 방지
    if (ran.current) return;
    ran.current = true;

    // 이미 로그인된 사용자가 오래된/빈 콜백을 열면 로그인이 아니라 홈으로 보냄
    const fallback = () =>
      navigate(useAuthStore.getState().isAuthenticated ? '/' : '/login', { replace: true });

    const code = params.get('code');
    if (!code) {
      fallback();
      return;
    }

    (async () => {
      try {
        const { accessToken, expiresIn } = await authApi.exchangeOAuth2(code);
        setAccessToken(accessToken);
        const me = await userApi.getMe();
        login(
          { userId: me.userId, email: me.email, name: me.name, role: me.role },
          accessToken,
          expiresIn
        );
        // 게스트 장바구니 캐시 제거 — 병합된 회원 장바구니를 새로 불러오게 함
        queryClient.removeQueries({ queryKey: ['cart'] });
        // URL에서 code 제거(뒤로가기 시 재실행 방지)
        window.history.replaceState(null, '', '/oauth2/callback');
        navigate('/', { replace: true });
      } catch {
        toast.error('소셜 로그인에 실패했습니다. 다시 시도해주세요.');
        fallback();
      }
    })();
  }, [params, navigate, login, queryClient]);

  return <PageSpinner />;
}
