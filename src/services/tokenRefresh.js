// 소유: KJH (로그인)
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { ApiError, toApiError } from '../utils/errors';
import { expireSession } from './session';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// 인터셉터가 없는 별도 인스턴스 (refresh의 401이 다시 refresh를 부르지 않게 함)
const refreshClient = axios.create({ baseURL: API_URL, timeout: 30000 });

const unwrap = (body) => (body && typeof body === 'object' && 'success' in body ? body.data : body);

let refreshing = null;

/**
 * 토큰 갱신. api.js 의 401 처리와 WJH 의 chatService.stream 이 부릅니다.
 * 약속: 이름과 동작(성공하면 새 accessToken 을 돌려줌, 실패하면 throw)은 바꾸지 않습니다.
 */
export function refreshAccessToken() {
  if (refreshing) return refreshing;

  refreshing = refreshClient
    .post('/auth/refresh')
    .then((res) => {
      const data = unwrap(res.data);
      if (!data?.accessToken) {
        throw new ApiError({ status: 401 });
      }
      useAuthStore.getState().setTokens(data.accessToken);
      return data.accessToken;
    })
    .catch((err) => {
      expireSession();
      if (err instanceof ApiError) throw err;
      if (err?.response) throw toApiError(err.response.status, err.response.data);
      throw new ApiError({ status: 0 });
    })
    .finally(() => {
      refreshing = null;
    });

  return refreshing;
}
