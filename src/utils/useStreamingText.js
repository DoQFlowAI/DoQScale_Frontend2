// 소유: WJH
import { useCallback, useRef, useState, useEffect } from 'react';
import { chatService } from '../services/chatService';

export function useStreamingText() {
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState(null);
    const controllerRef = useRef(null);

    const start = useCallback(
        async ({ sessionId, question, onToken, onSources, onDone, onError }) => {
            controllerRef.current?.abort();
            const controller = new AbortController();
            controllerRef.current = controller;
            setIsStreaming(true);
            setError(null);

            try {
                await chatService.stream({ sessionId, question, signal: controller.signal, onToken, onSources });
                onDone?.();
            }

            catch (e) {
                if (e.name === 'AbortError') return;
                setError(e);
                onError?.(e);
            }

            finally {
                if (controllerRef.current === controller) {
                    controllerRef.current = null;
                    setIsStreaming(false);
                }
            }
        }, []
    );

    const stop = useCallback(() => {
        controllerRef.current?.abort();
        controllerRef.current = null;
        setIsStreaming(false);
    }, []);

    useEffect(() => {
        return stop;
    }, [stop]);

    return { isStreaming, error, start, stop };
}