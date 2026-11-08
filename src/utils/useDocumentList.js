// 소유: KJH (문서 목록)
import { useCallback, useRef, useState } from 'react';
import { documentService } from '../services/documentService';
import { getErrorMessage } from './errors';

const PAGE_SIZE = 20;

/**
 * 사이드바 문서 목록 요청. Layout(WJH)이 부르고 결과를 Sidebar → DocumentTabList(KJH) 로 내립니다.
 * 약속: 반환값 { documents, hasMore, loading, error, loadMore, refresh } 의 이름은 바꾸지 않습니다.
 *   refresh 는 페이지들이 Outlet context 의 refreshDocuments 로 부릅니다 (문서 생성·수정·삭제·업로드·초대 수락 뒤).
 */
export function useDocumentList() {
  const [documents, setDocuments] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const pagesRef = useRef(1); // 지금까지 받은 페이지 수
  const seqRef = useRef(0);

  /** 지금까지 받은 페이지(0 ~ pages-1) 전체를 다시 받아 교체하며 늦게 도착한 이전 응답은 무시합니다 */
  const refresh = useCallback(async () => {
    const mine = ++seqRef.current;
    const pages = Math.max(1, pagesRef.current);
    setLoading(true);
    try {
      const results = await Promise.all(
        Array.from({ length: pages }, (_, p) => documentService.list({ page: p, size: PAGE_SIZE })),
      );
      if (mine !== seqRef.current) return;
      const content = results.flatMap((r) => r?.content ?? []);
      setDocuments(content);
      setTotalElements(results[0]?.totalElements ?? content.length);
      setError('');
    } catch (e) {
      if (mine !== seqRef.current) return;
      setError(getErrorMessage(e));
    } finally {
      if (mine === seqRef.current) setLoading(false);
    }
  }, []);

  /** 다음 페이지를 받아 이어 붙입니다 */
  const loadMore = useCallback(async () => {
    const mine = ++seqRef.current;
    const nextPage = pagesRef.current;
    setLoading(true);
    try {
      const res = await documentService.list({ page: nextPage, size: PAGE_SIZE });
      if (mine !== seqRef.current) return;
      pagesRef.current = nextPage + 1;
      const nextItems = res?.content ?? [];
      setDocuments((prev) => [...prev, ...nextItems]);
      setTotalElements(res?.totalElements ?? 0);
      setError('');
    } catch (e) {
      if (mine !== seqRef.current) return;
      setError(getErrorMessage(e));
    } finally {
      if (mine === seqRef.current) setLoading(false);
    }
  }, []);

  const hasMore = documents.length < totalElements;

  return { documents, hasMore, loading, error, loadMore, refresh };
}
