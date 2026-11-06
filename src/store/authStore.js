// persist 미사용 (9.2): 토큰은 메모리에만 둔다. 새로고침하면 재로그인이 필요하다.
// 로그아웃·토큰 갱신 실패 처리에서는 logout()과 함께 useChatStore의 clear()도 부른다.
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null, // GET /users/me 결과
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  // 직접 로그아웃한 뒤에는 "원래 화면으로 복귀"를 하지 않는다 (다음 사용자에게 이전 경로가 새지 않게)
  skipReturn: false,
  // skipReturn 은 로그인 직후 PublicOnlyRoute 가 읽어야 하므로 여기서 건드리지 않는다 (Layout 이 마운트되면 해제)
  login: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken, isAuthenticated: true }),
  clearSkipReturn: () => set({ skipReturn: false }),
  logout: (options = {}) =>
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      skipReturn: Boolean(options.manual),
    }),
  setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
  setUser: (user) => set({ user }),
}));
