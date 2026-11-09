// 소유: KJH (로그인)
import { ApiError } from '../utils/errors';
import { expireSession } from './session';

/**
 * 토큰 갱신. api.js 의 401 처리와 WJH 의 chatService.stream 이 부릅니다.
 * 약속: 이름과 동작(성공하면 새 accessToken 을 돌려줌, 실패하면 throw)은 바꾸지 않습니다.
 *
 * TODO(KJH): 명세 9.3
 *   - POST /auth/refresh { refreshToken } → useAuthStore.setTokens(새 access, 새 refresh) → 새 accessToken 반환
 *   - 동시에 여러 요청이 401 이어도 refresh 는 한 번만 (진행 중인 Promise 를 재사용)
 *   - refresh 요청은 인터셉터가 없는 별도 axios 인스턴스로 (refresh 의 401 이 다시 refresh 를 부르지 않게)
 *   - 실패하면 expireSession() 후 throw
 * 지금은 바로 세션을 끝내는 임시 코드입니다.
 */
export async function refreshAccessToken() {
  expireSession();
  throw new ApiError({ status: 401 });
}
