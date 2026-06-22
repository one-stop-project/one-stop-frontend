export type NotificationType = 'PAYMENT_APPROVED';

export interface NotificationSseResponse {
  notificationId: number;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
}
