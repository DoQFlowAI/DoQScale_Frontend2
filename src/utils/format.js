const pad = (n) => String(n).padStart(2, '0');

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** 'yy-MM-dd' (버전 목록 등록일) */
export function formatShortDate(value) {
  const d = toDate(value);
  if (!d) return '-';
  return `${String(d.getFullYear()).slice(2)}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 'MM-dd' (버전 선택 모달) */
export function formatMonthDay(value) {
  const d = toDate(value);
  if (!d) return '-';
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 'yyyy-MM-dd' (초대 알림) */
export function formatDate(value) {
  const d = toDate(value);
  if (!d) return '-';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatFileSize(bytes) {
  if (typeof bytes !== 'number' || Number.isNaN(bytes)) return '-';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export const RANK_LABELS = { 1: '사원', 2: '팀장' };
export const LEADER_RANK = 2;

export function rankLabel(rankLevel) {
  return RANK_LABELS[rankLevel] ?? '';
}
