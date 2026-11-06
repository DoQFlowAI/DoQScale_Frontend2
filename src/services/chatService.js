import { api, API_URL, refreshAccessToken } from './api';
import { useAuthStore } from '../store/authStore';
import { ApiError, toApiError } from '../utils/errors';

async function request(signal, body, token) {
  return fetch(`${API_URL}/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    signal,
  });
}

/** SSE 한 줄("data: ...")을 처리한다. 끝났으면 true */
function handleLine(line, { onToken, onSources }) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('data:')) return false;
  const payload = trimmed.slice(5).trim();
  if (payload === '[DONE]') return true;
  if (!payload) return false;
  let json;
  try {
    json = JSON.parse(payload);
  } catch {
    return false; // 깨진 조각은 무시
  }
  if (typeof json.token === 'string') onToken?.(json.token);
  if (Array.isArray(json.sources)) onSources?.(json.sources);
  return false;
}

export const chatService = {
  createSession: () => api.post('/chat/sessions').then((r) => r.data),

  messages: (sessionId) => api.get(`/chat/sessions/${sessionId}/messages`).then((r) => r.data),

  /**
   * POST /ai/chat (SSE). EventSource 는 POST·Authorization 헤더를 못 써서 fetch + ReadableStream 을 쓴다.
   * 끝까지 읽으면 resolve, 오류면 ApiError 로 reject, signal 로 중단하면 AbortError.
   */
  async stream({ sessionId, question, signal, onToken, onSources }) {
    const body = { sessionId, question };
    let token = useAuthStore.getState().accessToken;
    let res;
    try {
      res = await request(signal, body, token);
      if (res.status === 401) {
        token = await refreshAccessToken();
        res = await request(signal, body, token);
      }
    } catch (e) {
      if (e?.name === 'AbortError') throw e;
      if (e instanceof ApiError) throw e;
      throw new ApiError({ status: 0 });
    }

    if (!res.ok) {
      let data = null;
      try {
        data = await res.json();
      } catch {
        // 본문이 JSON 이 아니면 상태 코드만 쓴다
      }
      throw toApiError(res.status, data);
    }
    if (!res.body) throw new ApiError({ status: 502 });

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    const handlers = { onToken, onSources };
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // 잘려서 온 줄은 버퍼에 남겨 두고 완성된 줄만 처리한다
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (handleLine(line, handlers)) return;
        }
      }
      buffer += decoder.decode();
      if (buffer) handleLine(buffer, handlers);
    } catch (e) {
      if (e?.name === 'AbortError') throw e;
      throw new ApiError({ status: 0 });
    } finally {
      reader.cancel().catch(() => {});
    }
  },
};
