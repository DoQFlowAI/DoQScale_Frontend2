// 소유: 공통 베이스
import PropTypes from 'prop-types';
import Chip from './Chip';

// 문서 status · 버전 status · 열람자 status → 문구와 색
const MAP = {
  EMPTY: ['비어 있음', 'gray'],
  PROCESSING: ['분석 중', 'warn'],
  READY: ['준비 완료', 'green'],
  FAILED: ['실패', 'danger'],
  PENDING: ['대기', 'warn'],
  ACCEPTED: ['수락', 'green'],
  REJECTED: ['거절', 'gray'],
};

export default function StatusBadge({ status }) {
  const [label, tone] = MAP[status] ?? [status, 'gray'];
  return <Chip tone={tone}>{label}</Chip>;
}

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
};
