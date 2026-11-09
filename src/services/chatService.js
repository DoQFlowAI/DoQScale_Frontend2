// 소유: WJH (채팅)
import { api } from './api';

export const chatService = {
  createSession: () => api.post('/chat/sessions').then((r) => r.data),
  messages: (sessionId) => api.get(`/chat/sessions/${sessionId}/messages`).then((r) => r.data),

  /**
   * TODO(WJH): POST /ai/chat { sessionId, question } 스트리밍 (명세 7.2)
   *   - EventSource 대신 fetch + ReadableStream (POST·Authorization 헤더 필요). 주소는 api.js 의 API_URL
   *   - data: {"token"} / data: {"sources"} / data: [DONE], 잘린 줄은 버퍼에 모아 처리
   *   - signal(AbortController)로 중단, 401 이면 tokenRefresh.js(KJH)의 refreshAccessToken() 후 한 번 재시도
   */
  // stream: async ({ sessionId, question, signal, onToken, onSources }) => {},
};
