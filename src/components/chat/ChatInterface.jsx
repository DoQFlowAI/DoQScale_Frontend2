// 소유: WJH
import PropTypes from 'prop-types';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useStreamingText } from '../../utils/useStreamingText';
import { chatService } from '../../services/chatService';
import { getErrorMessage, isNotFound } from '../../utils/errors';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

let nextLocalId = 1;
const newLocalId = () => `local-${nextLocalId++}`;
const RATE_LIMIT_WAIT_MS = 10000;
const EXAMPLE_WAIT_MS = 800;
const EXAMPLE_TOKEN_MS = 45;

function toMessage(m) {
    return {
        id: `server-${m.messageId}`,
        role: m.role === 'USER' ? 'user' : 'assistant',
        content: m.content ?? '',
        sources: m.sources ?? [],
        masked: m.masked ?? false,
    };
}

function endAnswer(answerId) {
    const { messages, finishMessage, removeMessage } = useChatStore.getState();
    const answer = messages.find((m) => m.id === answerId);

    if (answer && answer.content) {
        finishMessage(answerId);
    }
    else {
        removeMessage(answerId);
    }
}

export default function ChatInterface({
    active = true,
    compact = false,
    emptySlot = null,
    renderEmpty = null,
    inputDisabled = false,
    placeholder = '질문을 입력하세요',
    inputPlaceholder,
}) {
    const sessionId = useChatStore((s) => s.sessionId);
    const messages = useChatStore((s) => s.messages);
    const isLoading = useChatStore((s) => s.isLoading);
    const pendingQuestion = useChatStore((s) => s.pendingQuestion);
    const { setSession, setLoading, addMessage, appendToken, setSources, finishMessage } = useChatStore.getState();
    const { start } = useStreamingText();
    const [error, setError] = useState('');
    const [rateLimited, setRateLimited] = useState(false);
    const [draft, setDraft] = useState('');
    const listRef = useRef(null);
    const exampleTimer = useRef(null);

    useEffect(() => {
        const state = useChatStore.getState();
        if (!active || !state.sessionId || state.isLoading) return;

        let ignore = false;
        chatService.messages(state.sessionId)
            .then((list) => {
                if (ignore || useChatStore.getState().isLoading) return;
                state.setMessages(list.map(toMessage));
            })
            .catch((e) => {
                if (ignore) return;
                if (isNotFound(e)) {
                    state.clear();
                }
            });
        return () => {
            ignore = true;
        };
    }, [active]);

    useEffect(() => {
        return () => {
            clearTimeout(exampleTimer.current);
            const { messages } = useChatStore.getState();
            messages.filter((m) => m.streaming).forEach((m) => endAnswer(m.id));
        };
    }, []);

    useEffect(() => {
        if (!rateLimited) return;
        const timer = setTimeout(() => setRateLimited(false), RATE_LIMIT_WAIT_MS);
        return () => clearTimeout(timer);
    }, [rateLimited]);

    useEffect(() => {
        const list = listRef.current;
        if (list) {
            list.scrollTop = list.scrollHeight;
        }
    }, [messages]);

    function showError(answerId, e) {
        endAnswer(answerId);
        setError(getErrorMessage(e, { chat: true }));

        if (e?.status === 429) {
            setRateLimited(true);
        }
    }

    const handleSend = useCallback(async (question, exampleAnswer) => {
        setError('');
        addMessage({ id: newLocalId(), role: 'user', content: question });

        const answerId = newLocalId();
        addMessage({ id: answerId, role: 'assistant', content: '', streaming: true });
        setLoading(true);

        if (exampleAnswer) {
            const tokens = exampleAnswer.match(/\S+\s*/g);
            let index = 0;

            const showNextToken = () => {
                if (!useChatStore.getState().messages.some((message) => message.id === answerId)) return;

                appendToken(answerId, tokens[index]);
                index += 1;
                if (index === tokens.length) {
                    finishMessage(answerId);
                } else {
                    exampleTimer.current = setTimeout(showNextToken, EXAMPLE_TOKEN_MS);
                }
            };

            exampleTimer.current = setTimeout(showNextToken, EXAMPLE_WAIT_MS);
            return;
        }

        let id = sessionId;
        if (!id) {
            try {
                const session = await chatService.createSession();
                id = session.sessionId;
                setSession(id);
            }
            catch (e) {
                showError(answerId, e);
                return;
            }
        }

        start({
            sessionId: id,
            question,
            onToken: (token) => {
                appendToken(answerId, token);
            },
            onSources: (sources) => {
                setSources(answerId, sources);
            },
            onDone: () => {
                finishMessage(answerId);
            },
            onError: (e) => {
                showError(answerId, e);
            },
        });
    }, [sessionId, addMessage, setLoading, setSession, start, appendToken, setSources, finishMessage]);

    useEffect(() => {
        if (!active || !pendingQuestion || isLoading) return;
        useChatStore.getState().setPendingQuestion(null);
        if (typeof pendingQuestion === 'string') {
            handleSend(pendingQuestion);
        } else {
            handleSend(pendingQuestion.question, pendingQuestion.exampleAnswer);
        }
    }, [active, pendingQuestion, isLoading, handleSend]);

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div ref={listRef} role="log" aria-live="polite" className="thin-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-2">
                {messages.length === 0 ? (
                    renderEmpty ? (
                        renderEmpty(setDraft)
                    ) : emptySlot ? (
                        emptySlot
                    ) : (
                        <p className="m-auto text-body text-muted">문서에 대해 질문해 보세요</p>
                    )
                ) : (
                    messages.map((m) => (
                        <ChatMessage
                            key={m.id}
                            role={m.role}
                            content={m.content}
                            sources={m.sources}
                            masked={m.masked}
                            streaming={m.streaming}
                        />
                    ))
                )}
            </div>

            {error && <p role="alert" className="rounded-xl bg-danger-bg px-4 py-3 text-label text-danger">{error}</p>}

            <ChatInput
                value={draft}
                onChange={setDraft}
                onSend={handleSend}
                disabled={inputDisabled || isLoading || rateLimited}
                showCount={!compact}
                placeholder={inputPlaceholder || placeholder}
            />
        </div>
    );
}

ChatInterface.propTypes = {
    active: PropTypes.bool,
    compact: PropTypes.bool, // 챗봇 패널처럼 좁은 곳: 입력창 글자 수 표시를 숨김
    emptySlot: PropTypes.node,
    renderEmpty: PropTypes.func, // 대화가 없을 때 보여 줄 화면. (setDraft) => node, 입력창을 채울 함수를 받음
    inputDisabled: PropTypes.bool,
    placeholder: PropTypes.string,
    inputPlaceholder: PropTypes.string,
};
