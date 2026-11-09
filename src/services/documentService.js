// 소유: 공통 베이스
import { api } from './api';

export const documentService = {
  list: ({ page = 0, size = 20, sort = 'createdAt,desc' } = {}) =>
    api.get('/documents', { params: { page, size, sort } }).then((r) => r.data),
  get: (id) => api.get(`/documents/${id}`).then((r) => r.data),
  create: ({ name, description, inviteeEmails }) =>
    api.post('/documents', { name, description, inviteeEmails }).then((r) => r.data),
  update: (id, patch) => api.patch(`/documents/${id}`, patch).then((r) => r.data), // 바뀐 필드만
  remove: (id) => api.delete(`/documents/${id}`),

  // 열람자
  permissions: (id) => api.get(`/documents/${id}/permissions`).then((r) => r.data),
  invite: (id, inviteeEmails) => api.post(`/documents/${id}/permissions`, { inviteeEmails }).then((r) => r.data),
  revoke: (id, userUuid) => api.delete(`/documents/${id}/permissions/${encodeURIComponent(userUuid)}`),
};
