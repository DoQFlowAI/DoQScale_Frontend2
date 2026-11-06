import { useState } from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import DocumentTabList from '../document/DocumentTabList';
import DocumentCreateModal from '../document/DocumentCreateModal';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import Button from './Button';
import { useAuthStore } from '../../store/authStore';
import { LEADER_RANK } from '../../utils/format';

export default function Sidebar({
  documents,
  loading = false,
  error = '',
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  onRetry,
  onDocumentChanged,
  open = false,
  onClose,
}) {
  const rankLevel = useAuthStore((s) => s.user?.rankLevel);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      {/* 모바일: 메뉴 버튼으로 여는 서랍. 데스크톱: 왼쪽 고정 */}
      {open ? (
        <div className="fixed inset-0 top-16 z-30 bg-black/40 md:hidden" onClick={onClose} aria-hidden="true" />
      ) : null}
      <aside
        aria-label="문서 목록"
        className={`fixed bottom-0 left-0 top-16 z-30 flex w-[280px] max-w-[85vw] flex-col gap-3.5 bg-white px-4 py-5 transition-transform md:static md:z-auto md:max-w-none md:translate-x-0 md:transition-none ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <NavLink
          to="/"
          end
          onClick={onClose}
          className={({ isActive }) =>
            `flex min-h-11 items-center rounded-xl px-3.5 py-2.5 text-[15px] ${
              isActive ? 'bg-soft font-bold text-brand' : 'font-medium text-ink-2 hover:bg-th'
            }`
          }
        >
          대시보드
        </NavLink>
        <div className="h-px shrink-0 bg-line" />
        <p className="shrink-0 text-[12px] font-medium text-muted">문서</p>

        <div className="thin-scroll -mr-2 min-h-0 flex-1 overflow-y-auto pr-2">
          {loading && documents.length === 0 ? (
            <LoadingSpinner />
          ) : error && documents.length === 0 ? (
            <ErrorMessage message={error} onRetry={onRetry} />
          ) : (
            <>
              <DocumentTabList documents={documents} onNavigate={onClose} />
              {error ? <p role="alert" className="mt-2 text-[12px] text-danger">{error}</p> : null}
              {hasMore ? (
                <Button variant="outline" size="sm" className="mt-2 w-full" onClick={onLoadMore} disabled={loadingMore}>
                  {loadingMore ? '불러오는 중…' : '더 보기'}
                </Button>
              ) : null}
            </>
          )}
        </div>

        {rankLevel === LEADER_RANK ? (
          <Button className="w-full shrink-0" onClick={() => setCreateOpen(true)}>
            + 문서 만들기
          </Button>
        ) : null}
      </aside>

      <DocumentCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          onClose?.();
          onDocumentChanged?.();
        }}
      />
    </>
  );
}

Sidebar.propTypes = {
  documents: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  hasMore: PropTypes.bool,
  loadingMore: PropTypes.bool,
  onLoadMore: PropTypes.func,
  onRetry: PropTypes.func,
  onDocumentChanged: PropTypes.func,
  open: PropTypes.bool,
  onClose: PropTypes.func,
};
