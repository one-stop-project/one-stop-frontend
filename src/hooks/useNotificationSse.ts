import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/useAuthStore';
import { getAccessToken } from '@/api/client';
import { NotificationSseResponse } from '@/domains/notification/notificationApi';

async function parseSseStream(
  body: ReadableStream<Uint8Array>,
  onNotification: (n: NotificationSseResponse) => void
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    // SSE 이벤트는 빈 줄(\n\n)로 구분됨
    const blocks = buf.split('\n\n');
    buf = blocks.pop() ?? '';
    for (const block of blocks) {
      let eventName = '';
      let dataStr = '';
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) eventName = line.slice(6).trim();
        else if (line.startsWith('data:')) dataStr = line.slice(5).trim();
      }
      if (eventName === 'notification' && dataStr) {
        try {
          onNotification(JSON.parse(dataStr) as NotificationSseResponse);
        } catch {
          // 파싱 실패 무시
        }
      }
    }
  }
}

export function useNotificationSse() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    let stopped = false;
    let currentAbort: AbortController | null = null;

    const run = async () => {
      while (!stopped) {
        currentAbort = new AbortController();
        try {
          const token = getAccessToken();
          const res = await fetch('/api/notifications/subscribe', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            signal: currentAbort.signal,
          });
          if (!res.ok || !res.body) {
            await new Promise((r) => setTimeout(r, 5000));
            continue;
          }
          await parseSseStream(res.body, (n) => {
            toast.success(`${n.title}: ${n.message}`, {
              id: `notification-${n.notificationId}`,
              duration: 6000,
            });
          });
          // 스트림 정상 종료(BE 30분 타임아웃) → 즉시 재연결
        } catch {
          if (stopped) break;
          // 네트워크 오류 → 5초 후 재시도
          await new Promise((r) => setTimeout(r, 5000));
        }
      }
    };

    run();
    return () => {
      stopped = true;
      currentAbort?.abort();
    };
  }, [isAuthenticated]);
}
