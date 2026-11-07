// 소유: 공통 베이스
import { useId } from 'react';
import PropTypes from 'prop-types';

/** 라벨 + 입력 + (오류 | 도움말). 나머지 props(type, value, onChange 등)는 input 에 그대로 전달 */
export default function TextField({ label, error, hint, className = '', ...inputProps }) {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error || hint;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-label font-medium text-ink-2">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={note ? noteId : undefined}
        className={`min-h-11 w-full rounded-xl border bg-white px-3.5 py-3 text-body text-ink placeholder:text-placeholder disabled:bg-th ${
          error ? 'border-danger' : 'border-line'
        }`}
        {...inputProps}
      />
      {note ? (
        <p id={noteId} role={error ? 'alert' : undefined} className={`text-caption ${error ? 'text-danger' : 'text-muted'}`}>
          {note}
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
