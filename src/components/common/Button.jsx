import PropTypes from 'prop-types';

const VARIANTS = {
  primary: 'bg-brand text-white border border-brand hover:bg-[#164538] disabled:bg-[#8fa89f] disabled:border-[#8fa89f]',
  outline:
    'bg-white text-brand border border-brand hover:bg-soft disabled:text-[#8fa89f] disabled:border-[#c5d3ce] disabled:hover:bg-white',
  danger:
    'bg-white text-danger border border-danger hover:bg-danger-bg disabled:text-[#c9a0a0] disabled:border-[#e3c8c8] disabled:hover:bg-white',
  ghost: 'bg-transparent text-muted border border-transparent hover:bg-th',
};

const SIZES = {
  md: 'px-5 py-3 text-[15px] rounded-[14px] min-h-11',
  sm: 'px-3.5 py-1.5 text-[13px] rounded-[10px] min-h-11 md:min-h-0',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap transition-colors disabled:opacity-100 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'outline', 'danger', 'ghost']),
  size: PropTypes.oneOf(['md', 'sm']),
  type: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node,
};
