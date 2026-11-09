// 소유: JJW (분석 중 재조회)
import { useEffect, useRef } from 'react';

/**
 * enabled 일 때만 intervalMs 마다 fn 을 부릅니다 (명세 5.5).
 * 앞 요청이 끝난 뒤에 다음을 예약하므로 느린 응답이 겹쳐 쌓이지 않습니다.
 * 화면을 떠나거나 enabled 가 false 가 되면 멈춥니다. fn 이 실패해도 다음 주기에 다시 시도합니다.
 *
 * 쓰는 곳: 문서 상세 (문서나 버전 중 PROCESSING 이 있을 때 3초마다 다시 조회)
 */
export function usePolling(fn, intervalMs, enabled) {
  // 매번 새로 만들어지는 fn 때문에 타이머가 다시 시작되지 않게, 최신 fn 만 ref 에 보관합니다
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(() => {
    if (!enabled) return undefined;
    let stopped = false;
    let timer;
    const run = async () => {
      try {
        await fnRef.current();
      } catch {
        // 다음 주기에 다시 시도합니다
      }
      if (!stopped) timer = setTimeout(run, intervalMs);
    };
    timer = setTimeout(run, intervalMs);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [enabled, intervalMs]);
}
