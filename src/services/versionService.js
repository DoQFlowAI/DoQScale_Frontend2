import { api } from './api';

export const versionService = {
  /** files: File[] — 배열 순서가 곧 버전 번호 순서 */
  upload: (documentId, files) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    return api
      .post(`/documents/${documentId}/versions`, form, {
        headers: { 'Content-Type': undefined }, // boundary 는 브라우저가 붙인다
        timeout: 120000,
      })
      .then((r) => r.data);
  },

  remove: (documentId, versionNo) =>
    api.delete(`/documents/${documentId}/versions/${versionNo}`).then(() => undefined),

  history: (documentId) => api.get(`/documents/${documentId}/history`).then((r) => r.data),

  compare: (documentId, from, to) =>
    api.get(`/documents/${documentId}/compare`, { params: { from, to } }).then((r) => r.data),
};
