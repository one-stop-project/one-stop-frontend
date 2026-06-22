/**
 * URL 파라미터 문자열을 양의 정수 ID로 안전 변환한다.
 * 유효한 양의 정수가 아니면 null 을 반환한다.
 *
 * 목적: `/products/abc` 처럼 숫자가 아닌 경로나 `?categoryId=1.5` 같은 값에서
 * Number(...) 가 NaN/소수를 만들어 백엔드 `@PathVariable/@RequestParam Long` 바인딩이
 * 400을 내는 것을 막는다. (쿼리 훅의 `enabled: id !== null` 가드와 함께 동작)
 */
export function parseId(value: string | undefined | null): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}
