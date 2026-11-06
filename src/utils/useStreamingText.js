import { useCallback, useEffect, useRef, useState } from 'react';
import { chatService } from '../services/chatService';
import { ApiError } from './errors';

/**
 * 질의응답 스트림 읽기.
 * start({ sessionId, question, onToken, onSources, onDone, onError }) / stop()
 * 화면을 떠나면(unmount) AbortController 로 연결을 끊는다.
 */
export function useStreamingText() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  const stop = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setIsStreaming(false);
  }, []);

  const start = useCallback(
    async ({ sessionId, question, onToken, onSources, onDone, onError }) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setError(null);
      setIsStreaming(true);
      try {
        await chatService.stream({
          sessionId,
          question,
          signal: controller.signal,
          onToken,
          onSources,
        });
        if (controllerRef.current === controller) onDone?.();
      } catch (e) {
        if (e?.name === 'AbortError') return;
        const apiError = e instanceof ApiError ? e : new ApiError({ status: 0 });
        setError(apiError);
        onError?.(apiError);
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
          setIsStreaming(false);
        }
      }
    },
    [],
  );

  useEffect(() => () => controllerRef.current?.abort(), []);

  return { isStreaming, error, start, stop };
}
