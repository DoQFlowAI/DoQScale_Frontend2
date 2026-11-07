// 소유: 공통 베이스
import { create } from 'zustand';

// 토큰은 메모리에만 둡니다 (persist·localStorage 미사용, 명세 9.2). 새로고침하면 다시 로그인합니다.
export const useAuthStore = create((set) => ({
  user: null, // GET /users/me 결과: { uuid, email, name, rankLevel, createdAt }
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,

  login: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken, isAuthenticated: true }),
  logout: () => set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
  setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
  setUser: (user) => set({ user }),
}));
