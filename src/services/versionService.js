// 소유: 공통 베이스
import { api } from './api';

export const versionService = {
  /** files: File[]. 배열 순서가 곧 버전 번호 순서 */
  upload: (documentId, files) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    // Content-Type 은 브라우저가 boundary 와 함께 붙이도록 비웁니다
    return api
      .post(`/documents/${documentId}/versions`, form, { headers: { 'Content-Type': undefined }, timeout: 120000 })
      .then((r) => r.data);
  },

  get: (documentId, versionNo) => api.get(`/documents/${documentId}/versions/${versionNo}`).then((r) => r.data),
  content: (documentId, versionNo) =>
    api.get(`/documents/${documentId}/versions/${versionNo}/content`).then((r) => r.data),
  remove: (documentId, versionNo) => api.delete(`/documents/${documentId}/versions/${versionNo}`),
  history: (documentId) => api.get(`/documents/${documentId}/history`).then((r) => r.data),
  compare: (documentId, from, to) =>
    api.get(`/documents/${documentId}/compare`, { params: { from, to } }).then((r) => r.data),
};
