// 소유: 공통 베이스
import { api } from './api';

// {permissionId} 에는 초대 목록의 invitationId 값을 넣습니다 (명세 4.4 공통 레이아웃)
export const invitationService = {
  list: () => api.get('/invitations').then((r) => r.data),
  accept: (permissionId) => api.post(`/invitations/${permissionId}/accept`).then((r) => r.data),
  reject: (permissionId) => api.post(`/invitations/${permissionId}/reject`).then((r) => r.data),
};
