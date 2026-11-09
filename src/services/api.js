// 소유: 공통 베이스
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { ApiError, toApiError } from '../utils/errors';
import { refreshAccessToken } from './tokenRefresh';

// 브라우저는 /api 로만 요청합니다. Backend 포트를 코드에 넣지 않습니다 (명세 3장).
export const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({ baseURL: API_URL, timeout: 30000 });

// 성공 응답 { success, data, message } 에서 data 만 꺼냅니다. 서비스는 r.data 로 바로 씁니다.
const unwrap = (body) => (body && typeof body === 'object' && 'success' in body ? body.data : body);

api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  (res) => {
    res.data = unwrap(res.data);
    return res;
  },
  async (error) => {
    const { response, config } = error;
    if (!response) {
      if (axios.isCancel(error)) throw error;
      throw new ApiError({ status: 0 }); // 네트워크 오류·타임아웃
    }
    // 401 → 토큰 갱신(tokenRefresh.js, KJH) 후 한 번만 다시 보냅니다. /auth/** 의 401(로그인 실패 등)은 제외
    const isAuthUrl = /^\/?auth\//.test(config?.url ?? '');
    if (response.status === 401 && config && !config._retry && !isAuthUrl) {
      config._retry = true;
      try {
        const token = await refreshAccessToken();
        config.headers.Authorization = `Bearer ${token}`;
        return api(config);
      } catch {
        // 갱신 실패: 아래에서 원래 401 을 던집니다
      }
    }
    throw toApiError(response.status, response.data);
  },
);
