import PropTypes from 'prop-types';
import Chip from './Chip';

// 문서 status · 버전 status · 열람자 status 를 한 곳에서 문구/색으로 바꾼다
const MAP = {
  EMPTY: { label: '비어 있음', tone: 'gray' },
  PROCESSING: { label: '분석 중', tone: 'warn' },
  READY: { label: '준비 완료', tone: 'green' },
  FAILED: { label: '실패', tone: 'danger' },
  PENDING: { label: '대기', tone: 'warn' },
  ACCEPTED: { label: '수락', tone: 'green' },
  REJECTED: { label: '거절', tone: 'gray' },
};

export default function StatusBadge({ status }) {
  const item = MAP[status];
  if (!item) return <Chip tone="gray">{status}</Chip>;
  return <Chip tone={item.tone}>{item.label}</Chip>;
}

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
};
