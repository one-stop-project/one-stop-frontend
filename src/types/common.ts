/**
 * 백엔드 enum과 1:1 매칭되는 공통 타입
 */

export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN';

// 상품 상태 (BE ProductStatus)
export type ProductStatus =
  | 'APPROVE_REQUESTED' // 승인 요청
  | 'APPROVED' // 승인 완료
  | 'REJECTED' // 반려
  | 'DISCONTINUED' // 판매 중단
  | 'FORCE_INACTIVE'; // 강제 비활성

// 상품 옵션(아이템) 상태 (BE ProductItemStatus)
export type ProductItemStatus = 'ON_SALE' | 'STOP';

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

// 판매자 상태 (BE SellerStatus)
export type SellerStatus =
  | 'PENDING' // 승인 대기
  | 'APPROVED' // 승인 완료
  | 'REJECTED' // 반려
  | 'SUSPENDED'; // 정지
