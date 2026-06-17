import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // ★ 프로덕션 빌드 설정 — dist/ 산출물을 GitHub Actions(CD)가 독립 배포(EC2 /var/www/frontend)
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    // 백엔드 OAuth2 redirect-base 기본값(localhost:3001)에 맞춤 — 소셜 로그인 콜백 정상 동작
    port: 3001,
    strictPort: true,
    proxy: {
      // 개발 모드(npm run dev)에서만 사용
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // 소셜 로그인: OAuth2 시작 + 카카오 redirect 콜백을 백엔드로 전달
      // (/oauth2/callback 은 FE 라우트라 프록시하지 않음 — /oauth2/authorization 만)
      '/oauth2/authorization': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/login/oauth2': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
