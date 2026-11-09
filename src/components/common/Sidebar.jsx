// 소유: WJH (공통 레이아웃 틀)
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import DocumentTabList from '../document/DocumentTabList';

const linkClass = ({ isActive }) =>
  `flex min-h-11 items-center truncate rounded-btn-sm px-3 text-body ${isActive ? 'bg-soft font-bold text-brand' : 'text-ink-2 hover:bg-th'
  }`;

export default function Sidebar({ list, open = false, onClose }) {
  return (
    <>
      {open ? <div aria-hidden="true" onClick={onClose} className="fixed inset-0 z-50 bg-black/40 md:hidden" /> : null}
      <aside
        aria-label="문서 목록"
        className={`fixed inset-y-0 left-0 z-50 w-70 max-w-[85vw] shrink-0 flex-col gap-3 bg-white px-4 py-5 md:static md:z-auto md:max-w-none md:flex ${open ? 'flex' : 'hidden'}`}
      >
        <NavLink to="/" end className={linkClass}>
          대시보드
        </NavLink>
        <nav className="thin-scroll flex min-h-0 flex-col overflow-y-auto border-t border-line pt-3">
          <DocumentTabList
            documents={list.documents}
            hasMore={list.hasMore}
            loading={list.loading}
            error={list.error}
            onLoadMore={list.loadMore}
            onRetry={list.refresh}
            onNavigate={onClose}
          />
        </nav>
      </aside>
    </>
  );
}

Sidebar.propTypes = {
  list: PropTypes.shape({
    documents: PropTypes.arrayOf(
      PropTypes.shape({ documentId: PropTypes.number.isRequired, name: PropTypes.string.isRequired }),
    ).isRequired,
    hasMore: PropTypes.bool,
    loading: PropTypes.bool,
    error: PropTypes.string,
    loadMore: PropTypes.func,
    refresh: PropTypes.func.isRequired,
  }).isRequired,
  open: PropTypes.bool,
  onClose: PropTypes.func,
};
