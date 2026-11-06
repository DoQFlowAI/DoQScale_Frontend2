import { create } from 'zustand';

let seq = 0;
const localId = () => `local-${Date.now()}-${seq++}`;

/**
 * message: { id, role: 'user' | 'assistant', content, sources?, masked?, streaming?, error? }
 * 서버 기록을 받아 오면 id 는 messageId.
 */
export const useChatStore = create((set) => ({
  sessionId: null,
  messages: [],
  isLoading: false,

  setSession: (sessionId) => set({ sessionId }),
  setMessages: (messages) => set({ messages }),
  setLoading: (isLoading) => set({ isLoading }),

  addMessage: (message) => {
    const id = message.id ?? localId();
    set((s) => ({ messages: [...s.messages, { ...message, id }] }));
    return id;
  },

  appendToken: (id, token) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, content: m.content + token } : m)),
    })),

  setSources: (id, sources) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, sources } : m)),
    })),

  finishMessage: (id, patch = {}) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, streaming: false, ...patch } : m)),
      isLoading: false,
    })),

  clear: () => set({ sessionId: null, messages: [], isLoading: false }),
}));
