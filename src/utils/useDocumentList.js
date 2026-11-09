// 소유: KJH (문서 목록)
import { useCallback, useState } from 'react';
import { documentService } from '../services/documentService';

/**
 * 사이드바 문서 목록 요청. Layout(WJH)이 부르고 결과를 Sidebar → DocumentTabList(KJH) 로 내립니다.
 * 약속: 반환값 { documents, hasMore, loading, error, loadMore, refresh } 의 이름은 바꾸지 않습니다.
 *   refresh 는 페이지들이 Outlet context 의 refreshDocuments 로 부릅니다 (문서 생성·수정·삭제·업로드·초대 수락 뒤).
 *
 * TODO(KJH): 명세 4.4 공통 레이아웃 "문서 목록"
 *   - 20개 단위 페이징 (loadMore = 다음 페이지 이어 붙이기, hasMore = 받은 수 < totalElements)
 *   - refresh 는 지금까지 받은 페이지 전체를 다시 받아 교체, 늦게 도착한 이전 응답은 무시
 *   - loading·error 상태 (문구는 getErrorMessage)
 * 지금은 첫 페이지만 받는 최소 코드입니다.
 */
export function useDocumentList() {
  const [documents, setDocuments] = useState([]);

  const refresh = useCallback(async () => {
    try {
      const page = await documentService.list();
      setDocuments(page.content ?? []);
    } catch {
      // TODO(KJH): error 상태
    }
  }, []);

  return { documents, hasMore: false, loading: false, error: '', loadMore: () => {}, refresh };
}
