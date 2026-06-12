/**
 * 백엔드 enum과 1:1 매칭되는 공통 타입
 */

export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN';

// (판매자/어드민 PR에서 백엔드 값으로 정합 예정 — 이 PR은 구매자 흐름만)
export type ProductStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'REJECTED';

// 주문 전체 상태 (BE OrderStatus)
export type OrderStatus =
  | 'PENDING_PAYMENT' // 결제 대기
  | 'PAID' // 결제 완료
  | 'CANCELLED'; // 주문 취소

// 주문 항목 상태 (BE OrderItemStatus) — 판매자 주문 처리에 사용
export type OrderItemStatus =
  | 'PENDING_PAYMENT' // 결제 대기
  | 'ORDERED' // 주문 접수
  | 'CONFIRMED' // 판매자 확인 완료
  | 'SHIPPING' // 배송 중
  | 'DELIVERED' // 배송 완료
  | 'CANCELLED' // 주문 취소
  | 'REJECTED'; // 주문 거절

export type DeliveryStatus =
  | 'ACCEPT' // 결제완료
  | 'INSTRUCT' // 상품준비중
  | 'DEPARTURE' // 배송지시
  | 'DELIVERING' // 배송중
  | 'FINAL_DELIVERY' // 배송완료
  | 'ORDER_CANCELLED'; // 주문취소

export type PaymentMethod = 'MOCK' | 'CARD' | 'POINT';

// (판매자/어드민 PR에서 백엔드 값으로 정합 예정)
export type SellerStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'INACTIVE';
