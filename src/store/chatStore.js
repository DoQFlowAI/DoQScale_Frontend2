// 소유: WJH (채팅). clear 는 로그인(KJH)·로그아웃(services/session.js)이 쓰므로 이름과 동작을 유지
import { create } from 'zustand';

export const useChatStore = create((set) => ({
  sessionId: null,
  messages: [],
  isLoading: false,
  widgetOpen: false,
  pendingQuestion: null,

  setWidgetOpen: (widgetOpen) => set({ widgetOpen }),
  setPendingQuestion: (pendingQuestion) => set({ pendingQuestion }),
  askQuestion: (question) => set({ widgetOpen: true, pendingQuestion: question }),
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
  removeMessage: (id) =>
    set((s) => ({
      messages: s.messages.filter((m) => m.id !== id),
      isLoading: false,
    })),
  finishMessage: (id, patch = {}) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch, streaming: false } : m)),
      isLoading: false,
    })),
  clear: () => set({ sessionId: null, messages: [], isLoading: false, widgetOpen: false, pendingQuestion: null }),
}));
