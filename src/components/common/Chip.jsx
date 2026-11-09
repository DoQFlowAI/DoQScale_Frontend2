// 소유: 공통 베이스
import PropTypes from 'prop-types';

const TONES = {
  green: 'bg-chip text-chip-ink',
  soft: 'bg-soft text-chip-ink',
  white: 'bg-white text-chip-ink',
  warn: 'bg-warn text-warn-ink',
  danger: 'bg-danger-bg text-danger',
  gray: 'bg-neutral text-muted',
};

const SIZES = { sm: 'text-2xs', md: 'text-label' };

/** 둥근 알약 모양 태그 */
export default function Chip({ tone = 'green', size = 'sm', className = '', children }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full px-2.5 py-1 font-medium ${SIZES[size]} ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

Chip.propTypes = {
  tone: PropTypes.oneOf(Object.keys(TONES)),
  size: PropTypes.oneOf(Object.keys(SIZES)),
  className: PropTypes.string,
  children: PropTypes.node,
};
