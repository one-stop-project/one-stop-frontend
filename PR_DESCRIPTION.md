# feat: 시스템 점검 보안 감사 및 Buyer/Seller 제재 통합

## 개요

시스템 점검 페이지를 보안 운영 중심으로 개편했습니다. 별도 보안 감사 로그 메뉴와 포인트 회계 영역을 제거하고, 서버 모니터링·Buyer/Seller 보안 제재·보안 감사 로그를 하나의 화면에 통합했습니다.

## 주요 변경 사항

### 시스템 점검 화면 개편

- 기존 JVM 서버 모니터링 유지
- 포인트 회계 통계, 정합성 점검, 만료 실행 UI 제거
- 보안 감사 로그 대시보드를 시스템 점검 하단에 통합
- 별도 `/admin/security-audit` 라우트 및 사이드바 메뉴 제거

### 보안 감사 로그

- 최근 7일 카테고리별 통계 카드 제공
- 최근 24시간 Critical 이벤트 조회 및 페이지네이션
- 최근 7일 High-Risk 이벤트 조회 및 페이지네이션
- 모든 감사 로그 API에서 `ApiResponse`의 `res.data.data` 반환
- 포인트 감사 로그 UI 및 API 호출 미포함

### Buyer/Seller 보안 제재

- 시스템 점검 페이지에 보안 제재 진입 영역 추가
- 대상 역할을 `BUYER` 또는 `SELLER`로 제한
- 유저 ID와 이메일을 입력한 뒤 제재 모달 실행
- 계정 정지, 정지 해제, 강제 로그아웃 지원
- 관리자 권한 관리 목록에서 보안 제재 버튼 및 관련 상태 제거

## 변경 파일

- `src/pages/admin/AdminSystemPage.tsx`
- `src/pages/admin/AdminSecurityAuditPage.tsx`
- `src/components/admin/SecurityActionModal.tsx`
- `src/pages/admin/AdminUsersPage.tsx`
- `src/components/layout/AdminLayout.tsx`
- `src/App.tsx`
- `src/domains/admin/securityAuditApi.ts`

## 테스트

- [x] TypeScript 컴파일 확인
- [x] Vite 프로덕션 빌드 확인
- [x] 관리자 목록의 보안 제재 진입점 제거 확인
- [x] 시스템 점검의 포인트 회계 UI 제거 확인
- [x] 별도 보안 감사 메뉴 및 라우트 제거 확인
- [x] 포인트 감사 로그 기능 미포함 확인

```bash
npm run build
```

## 백엔드 확인 필요 사항

- 첨부된 백엔드에는 Buyer/Seller 대상 검색 API가 없어 현재 화면은 역할, 유저 ID, 이메일 직접 입력 방식입니다.
- 프론트엔드는 제재 대상을 Buyer/Seller로 제한하지만, 관리자 계정 제재를 확실히 차단하려면 보안 제재 API에서도 대상 유저의 역할을 검증해야 합니다.
- 첨부된 `SecurityAuditController`의 감사 API는 `Page` 또는 `Map`을 직접 반환하고 있습니다. 합의된 공통 응답 규격에 맞게 `{ success, data }` 형태의 `ApiResponse` 래핑 여부를 확인해야 합니다.

## 체크리스트

- [x] 관리자 계정 대상 보안 제재 UI 제거
- [x] Buyer/Seller 대상 보안 제재만 노출
- [x] 시스템 점검에서 포인트 회계 제거
- [x] 보안 감사 로그를 시스템 점검에 통합
- [x] 최고관리자 전용 접근 유지
