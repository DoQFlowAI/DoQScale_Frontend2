import { api } from './api';

export const authService = {
  signup: (payload) => api.post('/auth/signup', payload).then((r) => r.data),
  login: (email, password) => api.post('/auth/login', { email, password }).then((r) => r.data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }).then((r) => r.data),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }).then((r) => r.data),
};
