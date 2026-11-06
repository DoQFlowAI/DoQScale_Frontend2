import { useId } from 'react';
import PropTypes from 'prop-types';

/** Figma 의 Field: 라벨 + Input + (힌트 | 오류) */
export default function TextField({ label, error, hint, className = '', ...inputProps }) {
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-[13px] font-medium text-ink-2">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={describedBy}
        className={`min-h-11 w-full rounded-xl border bg-white px-3.5 py-3 text-[15px] text-ink placeholder:text-[#9aa8a3] disabled:bg-th ${
          error ? 'border-danger' : 'border-line'
        }`}
        {...inputProps}
      />
      {error ? (
        <p id={`${id}-err`} role="alert" className="text-[12px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[12px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

TextField.propTypes = {
  label: PropTypes.string.isRequired,
  error: PropTypes.string,
  hint: PropTypes.string,
  className: PropTypes.string,
};
