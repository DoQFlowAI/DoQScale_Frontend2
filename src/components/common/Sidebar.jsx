// 소유: WJH (공통 레이아웃 틀)
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';

const linkClass = ({ isActive }) =>
  `flex min-h-11 items-center truncate rounded-btn-sm px-3 text-body ${
    isActive ? 'bg-soft font-bold text-brand' : 'text-ink-2 hover:bg-th'
  }`;

/**
 * 최소 사이드바: 대시보드 링크와 문서 이름 목록 (화면 이동용).
 * TODO(WJH): 모바일(768px 미만) 서랍. 지금은 모바일에서 숨김 (명세 8.1)
 * TODO(WJH): KJH 의 컴포넌트가 오면 아래 단순 목록을 교체
 *   - <DocumentTabList documents={list.documents} hasMore={list.hasMore} loading={list.loading}
 *       error={list.error} onLoadMore={list.loadMore} onRetry={list.refresh} />
 *   - 팀장(rankLevel === LEADER_RANK)에게만 [문서 만들기] → <DocumentCreateModal open onClose onCreated />
 *     onCreated(documentId, flash): 모달 닫기 → list.refresh() → navigate(`/documents/${documentId}`, { state: { flash } })
 */
export default function Sidebar({ list }) {
  return (
    <aside aria-label="문서 목록" className="hidden w-70 shrink-0 flex-col gap-3 bg-white px-4 py-5 md:flex">
      <NavLink to="/" end className={linkClass}>
        대시보드
      </NavLink>
      <nav className="thin-scroll flex min-h-0 flex-col gap-1 overflow-y-auto border-t border-line pt-3">
        {list.documents.map((d) => (
          <NavLink key={d.documentId} to={`/documents/${d.documentId}`} className={linkClass}>
            {d.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

Sidebar.propTypes = {
  // useDocumentList() 결과 그대로
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
};
