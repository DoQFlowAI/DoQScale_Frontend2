// 소유: 공통 베이스
import PropTypes from 'prop-types';

export default function LoadingSpinner({ label = '불러오는 중…' }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-10 text-sm text-muted">
      <span aria-hidden="true" className="h-6 w-6 animate-spin rounded-full border-3 border-chip border-t-brand" />
      <span>{label}</span>
    </div>
  );
}

LoadingSpinner.propTypes = {
  label: PropTypes.string,
};
