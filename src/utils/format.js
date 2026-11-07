// 소유: 공통 베이스
const pad = (n) => String(n).padStart(2, '0');

function toDate(value) {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
}

/** 'yyyy-MM-dd' */
export function formatDate(value) {
  const d = toDate(value);
  return d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : '-';
}

/** 'yy-MM-dd' */
export function formatShortDate(value) {
  const d = formatDate(value);
  return d === '-' ? d : d.slice(2);
}

/** 'MM-dd' */
export function formatMonthDay(value) {
  const d = formatDate(value);
  return d === '-' ? d : d.slice(5);
}

export function formatFileSize(bytes) {
  if (typeof bytes !== 'number' || Number.isNaN(bytes)) return '-';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

// 직급 (명세 4.1): 1 사원, 2 팀장. 문서 생성은 팀장만
export const RANK_LABELS = { 1: '사원', 2: '팀장' };
export const LEADER_RANK = 2;
export const rankLabel = (rankLevel) => RANK_LABELS[rankLevel] ?? '';
