import PropTypes from 'prop-types';

const TONES = {
  green: 'bg-chip text-chip-ink',
  soft: 'bg-soft text-chip-ink',
  white: 'bg-white text-chip-ink',
  warn: 'bg-warn text-warn-ink',
  danger: 'bg-danger-bg text-danger',
  gray: 'bg-neutral text-muted',
};

/** Figma 의 Tag (둥근 알약) */
export default function Chip({ tone = 'green', size = 'sm', className = '', children }) {
  const text = size === 'md' ? 'text-[13px]' : 'text-[11px]';
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full px-2.5 py-1 font-medium whitespace-nowrap ${text} ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

Chip.propTypes = {
  tone: PropTypes.oneOf(Object.keys(TONES)),
  size: PropTypes.oneOf(['sm', 'md']),
  className: PropTypes.string,
  children: PropTypes.node,
};
