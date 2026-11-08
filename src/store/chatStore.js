// 소유: WJH (채팅). clear 는 로그인(KJH)·로그아웃(services/session.js)이 쓰므로 이름과 동작을 유지
import { create } from 'zustand';

/**
 * 질의응답 대화 (명세 6장). 대시보드와 문서 상세 챗봇 패널이 같이 씁니다.
 * message: { id, role: 'user' | 'assistant', content, sources?, masked?, streaming? }
 * 로그아웃·토큰 갱신 실패·새 로그인 때 clear() 로 비웁니다 (이전 사용자의 대화가 남지 않게).
 * TODO(WJH): 스트리밍 연결, 오류 표시 등 필요한 상태·액션 추가
 */
export const useChatStore = create((set) => ({
  sessionId: null,
  messages: [],
  isLoading: false,

  setSession: (sessionId) => set({ sessionId }),
  setLoading: (isLoading) => set({ isLoading }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  appendToken: (id, token) =>
    set((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, content: m.content + token } : m)) })),
  setSources: (id, sources) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, sources } : m),
    })),
  finishMessage: (id, patch = {}) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch, streaming: false } : m)),
      isLoading: false,
    })),
  clear: () => set({ sessionId: null, messages: [], isLoading: false }),
}));
