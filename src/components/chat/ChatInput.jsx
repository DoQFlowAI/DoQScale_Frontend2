import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../common/Button';

export const MAX_QUESTION = 1000;

export default function ChatInput({ onSend, disabled = false, focusKey }) {
  const [value, setValue] = useState('');
  const ref = useRef(null);

  // 챗봇 패널이 열릴 때 입력창에 포커스
  useEffect(() => {
    if (focusKey) ref.current?.focus();
  }, [focusKey]);

  const trimmed = value.trim();
  const canSend = !disabled && trimmed.length > 0 && value.length <= MAX_QUESTION;

  const send = () => {
    if (!canSend) return;
    onSend(trimmed);
    setValue('');
  };

  return (
    <div
      className={`flex items-end gap-2 rounded-2xl border px-4 py-2.5 ${
        disabled ? 'border-line bg-th' : 'border-line bg-white focus-within:border-brand'
      }`}
    >
      <textarea
        ref={ref}
        value={value}
        rows={1}
        maxLength={MAX_QUESTION}
        disabled={disabled}
        aria-label="질문 입력"
        placeholder="질문을 입력하세요"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          // 한글 조합 중 Enter 는 전송하지 않는다. Shift+Enter 는 줄바꿈
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send();
          }
        }}
        className="max-h-32 min-h-[28px] min-w-0 flex-1 resize-none bg-transparent py-1 text-[15px] text-ink outline-none placeholder:text-[#9aa8a3] disabled:text-muted"
      />
      <span className="shrink-0 pb-2 text-[12px] text-muted">
        {value.length} / {MAX_QUESTION}
      </span>
      <Button size="sm" onClick={send} disabled={!canSend} className="mb-0.5">
        보내기
      </Button>
    </div>
  );
}

ChatInput.propTypes = {
  onSend: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  focusKey: PropTypes.bool,
};
