// 소유: WJH
import { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../common/Button';

const MAX_INPUT_LENGTH = 1000;

export default function ChatInput({ onSend, disabled = false, showCount = true }) {
    const [question, setQuestion] = useState('');
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
                    placeholder="질문을 입력하세요"
                    className="field-sizing-content max-h-32 min-h-11 min-w-0 flex-1 md:min-h-6 resize-none bg-transparent py-1 text-body leading-6 text-ink outline-none placeholder:text-placeholder"
                />
                {showCount ? (
                    <span className="shrink-0 text-caption text-muted">{question.length} / {MAX_INPUT_LENGTH}</span>
                ) : null}
                <Button type="submit" size="sm" disabled={!canSend}>보내기</Button>
            </div>
        </form>
    );
}

ChatInput.propTypes = {
    onSend: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    showCount: PropTypes.bool,
};
