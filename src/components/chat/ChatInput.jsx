// 소유: WJH
import { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../common/Button';

const MAX_INPUT_LENGTH = 1000;

/** 입력값은 ChatInterface 가 들고 있습니다 (첫 화면 예시 질문을 눌러 채우기 위해) */
export default function ChatInput({
    value: controlledValue,
    onChange: setControlledValue,
    onSend,
    disabled = false,
    showCount = true,
    placeholder = '질문을 입력하세요',
}) {
    const [internalValue, setInternalValue] = useState('');
    const isControlled = controlledValue !== undefined;
    const question = isControlled ? controlledValue : internalValue;
    const setQuestion = isControlled ? setControlledValue : setInternalValue;
    const trimmed = question.trim();
    const canSend = !disabled && trimmed.length > 0;

    function send() {
        if (!canSend) return;
        onSend(trimmed);
        setQuestion('');
    }

    function handleKeyDown(e) {
        if (e.key !== 'Enter' || e.shiftKey) return;
        if (e.nativeEvent.isComposing) return;
        e.preventDefault();
        send();
    }

    function handleSubmit(e) {
        e.preventDefault();
        send();
    }

    return (
        <form onSubmit={handleSubmit}>
            {/* 입력창·글자 수·보내기 버튼을 하나의 둥근 입력 줄로 묶습니다. Enter 전송·Shift+Enter 줄바꿈은 그대로 */}
            <div
                className={`flex items-center gap-3 rounded-btn border px-4 py-2 focus-within:border-brand ${
                    disabled ? 'border-line bg-th' : 'border-line bg-white'
                }`}
            >
                <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={handleKeyDown}
                    maxLength={MAX_INPUT_LENGTH}
                    rows={1}
                    disabled={disabled}
                    aria-label="질문"
                    placeholder={placeholder}
                    className="field-sizing-content max-h-32 min-h-11 min-w-0 flex-1 md:min-h-6 resize-none bg-transparent py-1 text-body leading-6 text-ink outline-none placeholder:text-placeholder"
                />
                {showCount ? (
                    <span className="shrink-0 text-caption text-muted">{question.length} / {MAX_INPUT_LENGTH}</span>
                ) : null}
                <Button type="submit" size="sm" disabled={!canSend}>전송</Button>
            </div>
        </form>
    );
}

ChatInput.propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func,
    onSend: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    showCount: PropTypes.bool,
    placeholder: PropTypes.string,
};
