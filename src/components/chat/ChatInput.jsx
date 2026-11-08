// 소유: WJH
import { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../common/Button';

const MAX_INPUT_LENGTH = 1000;

export default function ChatInput({ onSend, disabled = false }) {
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-1">
            <div className="flex items-end gap-2">
                <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={handleKeyDown}
                    maxLength={MAX_INPUT_LENGTH}
                    rows={2}
                    disabled={disabled}
                    aria-label="질문"
                    placeholder="질문을 입력하세요"
                    className="min-w-0 flex-1 resize-none rounded-xl border border-line bg-white px-3.5 py-3 text-body text-ink placeholder:text-placeholder disabled:bg-th"
                />
                <Button type="submit" disabled={!canSend}>전송</Button>
            </div>
            <p className="text-right text-caption text-muted">{question.length} / {MAX_INPUT_LENGTH}</p>
        </form>
    );
}

ChatInput.propTypes = {
    onSend: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
};
