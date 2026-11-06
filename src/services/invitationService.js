import { api } from './api';

export const invitationService = {
  list: () => api.get('/invitations').then((r) => r.data),
  accept: (permissionId) => api.post(`/invitations/${permissionId}/accept`).then((r) => r.data),
  reject: (permissionId) => api.post(`/invitations/${permissionId}/reject`).then((r) => r.data),
};
