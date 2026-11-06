import { api } from './api';

export const userService = {
  me: () => api.get('/users/me').then((r) => r.data),
  lookup: (email) => api.get('/users/lookup', { params: { email } }).then((r) => r.data),
};
