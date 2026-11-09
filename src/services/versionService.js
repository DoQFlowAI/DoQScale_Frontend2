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
  /**
   * 버전 단건 (API-V-03). 버전 본문 패널에서 씁니다.
   * 응답: versionNo, originalFilename, fileSize, status, changeType, changeSummary, createdAt, contentText
   * contentText 는 버전 본문 패널(필수 기능)용입니다. 04 API 설계서·Backend 반영 대기 중이고, 목 서버는 READY 버전에만 본문을 줍니다.
   */
  get: (documentId, versionNo) => api.get(`/documents/${documentId}/versions/${versionNo}`).then((r) => r.data),
  remove: (documentId, versionNo) => api.delete(`/documents/${documentId}/versions/${versionNo}`),
  history: (documentId) => api.get(`/documents/${documentId}/history`).then((r) => r.data),
  compare: (documentId, from, to) =>
    api.get(`/documents/${documentId}/compare`, { params: { from, to } }).then((r) => r.data),
};
