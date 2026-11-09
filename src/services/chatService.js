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

        const event = JSON.parse(data);
        if (event.token) onToken?.(event.token);
        if (event.sources) onSources?.(event.sources);
      }
    }
  }

};
