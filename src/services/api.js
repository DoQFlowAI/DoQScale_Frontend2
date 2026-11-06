import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { ApiError, toApiError } from '../utils/errors';

export const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// 인터셉터를 타지 않는 별도 인스턴스 (refresh 재귀 방지)
const bare = axios.create({ baseURL: API_URL, timeout: 30000 });

/** 성공 { success, data, message } → data 만 꺼낸다 */
function unwrap(body) {
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) return body.data;
  return body;
}

// ---- 토큰 갱신 (한 번에 하나만, 동시에 실패한 요청은 그 결과를 기다린다) ----
let refreshing = null;

export function expireSession() {
  useAuthStore.getState().logout();
  useChatStore.getState().clear();
}

export function refreshAccessToken() {
  if (refreshing) return refreshing;
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) return Promise.reject(new ApiError({ status: 401 }));

  refreshing = bare
    .post('/auth/refresh', { refreshToken })
    .then((res) => {
      const data = unwrap(res.data);
      useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    })
    .catch((e) => {
      expireSession();
      throw e;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

const isAuthUrl = (url = '') => /^\/?auth\//.test(url);

api.interceptors.response.use(
  (res) => {
    res.data = unwrap(res.data);
    return res;
  },
  async (error) => {
    const { response, config } = error;
    if (!response) {
      // 네트워크 오류·타임아웃·취소
      if (axios.isCancel(error)) throw error;
      throw new ApiError({ status: 0 });
    }

    // 토큰 만료 → refresh 후 한 번만 재요청 (/auth/** 의 401 은 제외)
    if (response.status === 401 && config && !config._retry && !isAuthUrl(config.url)) {
      config._retry = true;
      try {
        const token = await refreshAccessToken();
        config.headers.Authorization = `Bearer ${token}`;
        return api(config);
      } catch {
        throw toApiError(401, response.data);
      }
    }
    throw toApiError(response.status, response.data);
  },
);
