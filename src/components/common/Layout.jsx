import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { documentService } from '../../services/documentService';
import { userService } from '../../services/userService';
import { useAuthStore } from '../../store/authStore';
import { getErrorMessage } from '../../utils/errors';

const PAGE_SIZE = 20;

export default function Layout() {
  const { pathname } = useLocation();
  const setUser = useAuthStore((s) => s.setUser);
  const clearSkipReturn = useAuthStore((s) => s.clearSkipReturn);

  // 로그인 후 화면에 도착했으므로 "원래 화면 복귀" 억제 플래그를 해제한다
  useEffect(() => {
    clearSkipReturn();
  }, [clearSkipReturn]);

  const [documents, setDocuments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pagesRef = useRef(1); // 지금까지 받은 페이지 수
  const seq = useRef(0);

  /** 0 ~ pages-1 페이지를 다시 받아 목록 전체를 교체한다 */
  const refreshDocuments = useCallback(async () => {
    const mine = ++seq.current;
    const pages = Math.max(1, pagesRef.current);
    try {
      const results = await Promise.all(
        Array.from({ length: pages }, (_, p) => documentService.list({ page: p, size: PAGE_SIZE })),
      );
      if (mine !== seq.current) return;
      const content = results.flatMap((r) => r.content || []);
      setDocuments(content);
      setTotal(results[0]?.totalElements ?? content.length);
      setError('');
    } catch (e) {
      if (mine !== seq.current) return;
      setError(getErrorMessage(e));
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    const mine = ++seq.current;
    try {
      const next = pagesRef.current;
      const res = await documentService.list({ page: next, size: PAGE_SIZE });
      if (mine !== seq.current) return;
      pagesRef.current = next + 1;
      setDocuments((prev) => [...prev, ...(res.content || [])]);
      setTotal(res.totalElements ?? 0);
      setError('');
    } catch (e) {
      if (mine === seq.current) setError(getErrorMessage(e));
    } finally {
      setLoadingMore(false);
    }
  }, []);

  // 화면 진입 때마다 내 정보·문서 목록을 다시 받는다 (초대·수락·회수는 재로그인 없이 반영되므로)
  useEffect(() => {
    refreshDocuments();
    userService
      .me()
      .then((me) => setUser(me))
      .catch(() => {});
    setSidebarOpen(false);
  }, [pathname, refreshDocuments, setUser]);

  const hasMore = documents.length < total;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Header
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        sidebarOpen={sidebarOpen}
        onInvitationAccepted={refreshDocuments}
      />
      <div className="relative flex min-h-0 flex-1">
        <Sidebar
          documents={documents}
          loading={loading}
          error={error}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={loadMore}
          onRetry={() => {
            setLoading(true);
            refreshDocuments();
          }}
          onDocumentChanged={refreshDocuments}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="thin-scroll min-w-0 flex-1 overflow-y-auto">
          <Outlet context={{ refreshDocuments }} />
        </main>
      </div>
    </div>
  );
}
