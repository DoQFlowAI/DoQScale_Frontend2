// 소유: WJH (채팅)
import { api, API_URL } from './api';
import { useAuthStore } from '../store/authStore';
import { toApiError } from '../utils/errors';

export const chatService = {
  createSession: () => api.post('/chat/sessions').then((r) => r.data),
  messages: (sessionId) => api.get(`/chat/sessions/${sessionId}/messages`).then((r) => r.data),

  /**
   * TODO(WJH): POST /ai/chat { sessionId, question } 스트리밍 (명세 7.2)
   *   - EventSource 대신 fetch + ReadableStream (POST·Authorization 헤더 필요). 주소는 api.js 의 API_URL
   *   - data: {"token"} / data: {"sources"} / data: [DONE], 잘린 줄은 버퍼에 모아 처리
   *   - signal(AbortController)로 중단, 401 이면 tokenRefresh.js(KJH)의 refreshAccessToken() 후 한 번 재시도
   */
  stream: async ({ sessionId, question, signal }) => {
    const send = (token) =>
      fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({ sessionId, question }),
        signal,
      });

    const res = await send(useAuthStore.getState().accessToken);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw toApiError(res.status, body);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) return;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (data === '[DONE]') return;
      }
    }
  }

};
