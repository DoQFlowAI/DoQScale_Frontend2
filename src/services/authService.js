// 소유: 공통 베이스
import { api } from './api';

// API-A-1~4. 경로·필드는 API 설계서 v1.4
export const authService = {
  signup: ({ email, password, name, rankLevel, signupKey }) =>
    api.post('/auth/signup', { email, password, name, rankLevel, signupKey }).then((r) => r.data),
  login: (email, password) => api.post('/auth/login', { email, password }).then((r) => r.data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }).then((r) => r.data),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }).then((r) => r.data),
};
