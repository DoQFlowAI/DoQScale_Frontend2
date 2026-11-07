// 소유: 공통 베이스
import PropTypes from 'prop-types';

const VARIANTS = {
  primary: 'border-brand bg-brand text-white hover:bg-brand-hover disabled:border-disabled disabled:bg-disabled',
  outline:
    'border-brand bg-white text-brand hover:bg-soft disabled:border-disabled-line disabled:text-disabled disabled:hover:bg-white',
  danger:
    'border-danger bg-white text-danger hover:bg-danger-bg disabled:border-danger-disabled-line disabled:text-danger-disabled disabled:hover:bg-white',
  ghost: 'border-transparent bg-transparent text-muted hover:bg-th',
};

// 모바일 터치 영역 44px 이상 (명세 8.1)
const SIZES = {
  md: 'min-h-11 rounded-btn px-5 py-3 text-body',
  sm: 'min-h-11 rounded-btn-sm px-3.5 py-1.5 text-label md:min-h-0',
};

export default function Button({ variant = 'primary', size = 'md', type = 'button', className = '', children, ...rest }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap border font-medium transition-colors ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

Button.propTypes = {
  variant: PropTypes.oneOf(Object.keys(VARIANTS)),
  size: PropTypes.oneOf(Object.keys(SIZES)),
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  className: PropTypes.string,
  children: PropTypes.node,
};
