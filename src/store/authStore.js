// 소유: 공통 베이스
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null, // GET /users/me 결과: { uuid, email, name, rankLevel, createdAt }
  accessToken: null,
  isAuthenticated: false,

  login: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
  logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
  setTokens: (accessToken) => set({ accessToken }),
  setUser: (user) => set({ user }),
}));
