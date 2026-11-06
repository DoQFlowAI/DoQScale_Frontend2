import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { useChatStore } from '../../store/chatStore';
import { chatService } from '../../services/chatService';
import { useStreamingText } from '../../utils/useStreamingText';
import { ApiError, getErrorMessage } from '../../utils/errors';

const RATE_LIMIT_BLOCK_MS = 15000;

/** 서버 기록 → 화면 메시지 */
function mapHistory(list) {
  if (!Array.isArray(list)) return [];
  return list.map((m) => ({
    id: m.messageId,
    role: String(m.role).toUpperCase() === 'USER' ? 'user' : 'assistant',
    content: m.content ?? '',
    sources: m.sources ?? [],
    masked: Boolean(m.masked),
  }));
}

/**
 * 메시지 목록 + 입력창. chatStore 를 구독한다.
 * visible: 챗봇 패널처럼 숨겨 둘 수 있을 때, 다시 보이는 순간 기록을 새로 받아 가림(masked) 상태를 반영한다.
 */
export default function ChatInterface({ visible = true, showTitle = true }) {
  const { sessionId, messages, isLoading } = useChatStore();
  const { start } = useStreamingText();
  const [blocked, setBlocked] = useState(false);
  const bottomRef = useRef(null);
  const blockTimer = useRef(null);

  // 이전 기록: 들어오거나 패널을 열 때 sessionId 가 있으면 다시 받는다 (답변을 받는 중에는 받지 않는다)
  useEffect(() => {
    if (!visible || !sessionId) return undefined;
    if (useChatStore.getState().isLoading) return undefined;
    let cancelled = false;
    chatService
      .messages(sessionId)
      .then((list) => {
        if (cancelled || useChatStore.getState().isLoading) return;
        useChatStore.getState().setMessages(mapHistory(list));
      })
      .catch((e) => {
        // 남의 대화·사라진 대화면 처음부터 다시 시작한다
        if (!cancelled && e instanceof ApiError && e.status === 404) useChatStore.getState().clear();
      });
    return () => {
      cancelled = true;
    };
  }, [visible, sessionId]);

  // 새 메시지·토큰이 오면 맨 아래로
  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ block: 'end' });
  }, [messages]);

  // 화면을 떠날 때: 끊긴 스트림 때문에 isLoading 이 남지 않게 정리
  useEffect(
    () => () => {
      clearTimeout(blockTimer.current);
      const s = useChatStore.getState();
      if (s.isLoading) {
        // 아직 내용이 없는 답변 자리는 지우고, 받던 중인 답변은 받은 데까지만 남긴다
        s.setMessages(
          s.messages
            .filter((m) => !(m.streaming && !m.content))
            .map((m) => (m.streaming ? { ...m, streaming: false } : m)),
        );
        s.setLoading(false);
      }
    },
    [],
  );

  const fail = useCallback((assistantId, err) => {
    const store = useChatStore.getState();
    const message = getErrorMessage(err, { chat: true });
    const current = store.messages.find((m) => m.id === assistantId);
    store.finishMessage(assistantId, {
      error: true,
      content: current?.content ? `${current.content}\n\n${message}` : message,
    });
    if (err instanceof ApiError && err.status === 429) {
      // 입력을 잠시 막는다
      setBlocked(true);
      clearTimeout(blockTimer.current);
      blockTimer.current = setTimeout(() => setBlocked(false), RATE_LIMIT_BLOCK_MS);
    }
  }, []);

  const send = useCallback(
    async (question) => {
      const store = useChatStore.getState();
      if (store.isLoading) return;
      store.setLoading(true);
      store.addMessage({ role: 'user', content: question });
      const assistantId = store.addMessage({ role: 'assistant', content: '', streaming: true, sources: [] });

      let sid = store.sessionId;
      if (!sid) {
        try {
          const session = await chatService.createSession();
          sid = session.sessionId;
          useChatStore.getState().setSession(sid);
        } catch (e) {
          fail(assistantId, e);
          return;
        }
      }

      await start({
        sessionId: sid,
        question,
        onToken: (t) => useChatStore.getState().appendToken(assistantId, t),
        onSources: (s) => useChatStore.getState().setSources(assistantId, s),
        onDone: () => useChatStore.getState().finishMessage(assistantId),
        onError: (err) => fail(assistantId, err),
      });
    },
    [start, fail],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      {showTitle ? (
        <div className="shrink-0 border-b border-line pb-4">
          <h2 className="text-[24px] font-bold text-ink">질의응답</h2>
        </div>
      ) : null}
      <div
        className="thin-scroll flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto py-4"
        role="log"
        aria-live="polite"
        aria-label="대화 내용"
      >
        {messages.length === 0 ? (
          <p className="m-auto text-center text-[15px] text-muted">문서에 대해 질문해 보세요</p>
        ) : (
          messages.map((m) => (
            <ChatMessage
              key={m.id}
              role={m.role}
              content={m.content}
              sources={m.sources}
              masked={m.masked}
              streaming={m.streaming}
              error={m.error}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <div className="shrink-0">
        <ChatInput onSend={send} disabled={isLoading || blocked} focusKey={visible && !showTitle} />
      </div>
    </div>
  );
}

ChatInterface.propTypes = {
  visible: PropTypes.bool,
  showTitle: PropTypes.bool,
};
