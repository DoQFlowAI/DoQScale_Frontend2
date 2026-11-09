// 소유: WJH (채팅)
import { api, API_URL } from './api';
import { useAuthStore } from '../store/authStore';
import { toApiError } from '../utils/errors';
import { refreshAccessToken } from './tokenRefresh';

export const chatService = {
  createSession: () => api.post('/chat/sessions').then((r) => r.data),
  messages: (sessionId) => api.get(`/chat/sessions/${sessionId}/messages`).then((r) => r.data),

  stream: async ({ sessionId, question, signal, onToken, onSources }) => {
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

    let res = await send(useAuthStore.getState().accessToken);

    if (res.status === 401) {
      const token = await refreshAccessToken();
      res = await send(token);
    }

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw toApiError(res.status, body);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // 한 줄을 처리합니다. [DONE] 이면 true. 깨진 JSON 한 줄은 건너뛰어 나머지 답변은 계속 받습니다
    const handleLine = (line) => {
      if (!line.startsWith('data:')) return false;
      const data = line.slice(5).trim();
      if (data === '[DONE]') return true;

      let event;
      try {
        event = JSON.parse(data);
      } catch {
        return false;
      }
      if (event?.token) onToken?.(event.token);
      if (event?.sources) onSources?.(event.sources);
      return false;
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        // 연결이 끝났을 때 개행 없이 남은 마지막 줄도 처리합니다
        buffer += decoder.decode();
        if (buffer) handleLine(buffer);
        return;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (handleLine(line)) return;
      }
    }
  }

};
