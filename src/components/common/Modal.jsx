import { useEffect, useId, useRef } from 'react';
import PropTypes from 'prop-types';

/** 가운데 모달 공통 틀: 딤 배경, Esc 닫기, 포커스 이동/복귀, 스크롤 잠금 */
export default function Modal({ open, title, subtitle, onClose, width = 'max-w-[640px]', footer, children, closeDisabled }) {
  const titleId = useId();
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape' && !closeDisabled) onCloseRef.current?.();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [open, closeDisabled]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => !closeDisabled && onClose?.()}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative flex max-h-[calc(100vh-32px)] w-full ${width} flex-col rounded-[24px] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.16)] outline-none`}
      >
        <div className="flex items-start gap-3 px-7 pt-7 pb-3">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-[22px] font-bold text-ink">
              {title}
            </h2>
            {subtitle ? <p className="mt-1 text-[13px] text-muted">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            aria-label="닫기"
            onClick={() => onClose?.()}
            disabled={closeDisabled}
            className="-mr-2 -mt-1 flex h-11 w-11 items-center justify-center text-[18px] text-muted hover:text-ink disabled:opacity-40"
          >
            ✕
          </button>
        </div>
        <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-7 py-2">{children}</div>
        {footer ? <div className="flex justify-end gap-2 border-t border-line px-7 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

Modal.propTypes = {
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  onClose: PropTypes.func,
  width: PropTypes.string,
  footer: PropTypes.node,
  children: PropTypes.node,
  closeDisabled: PropTypes.bool,
};
