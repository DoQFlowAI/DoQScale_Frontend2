import { useEffect, useRef } from 'react';

/**
 * enabled 인 동안 intervalMs 마다 fn 을 부른다. 이전 호출이 끝나기 전에는 다음 호출을 하지 않는다.
 */
export function usePolling(fn, intervalMs, enabled) {
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(() => {
    if (!enabled) return undefined;
    let stopped = false;
    let running = false;
    const id = setInterval(async () => {
      if (stopped || running) return;
      running = true;
      try {
        await fnRef.current();
      } catch {
        // 폴링 실패는 다음 주기에 다시 시도한다
      } finally {
        running = false;
      }
    }, intervalMs);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [intervalMs, enabled]);
}
