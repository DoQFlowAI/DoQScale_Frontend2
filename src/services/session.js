// 소유: 공통 베이스
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';

/** 로그인 상태와 대화를 모두 비웁니다. 로그아웃·토큰 갱신 실패 때 씁니다 (명세 4.4 로그인, 9.3) */
export function expireSession() {
  useAuthStore.getState().logout();
  useChatStore.getState().clear();
}
