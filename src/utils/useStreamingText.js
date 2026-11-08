// 소유: WJH
import { useCallback, useRef, useState } from 'react';

export function useStreamingText() {
    const [isStreaming, setIsStreaming] = useState(false);
    const controllerRef = useRef(null);
    const stop = useCallback(() => {
        controllerRef.current?.abort();
        controllerRef.current = null;
        setIsStreaming(false);
    }, []);

    return { isStreaming, stop };
}