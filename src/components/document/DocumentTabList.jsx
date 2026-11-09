// 소유: KJH (문서 목록)
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import Button from '../common/Button';
import Chip from '../common/Chip';
import ErrorMessage from '../common/ErrorMessage';
import LoadingSpinner from '../common/LoadingSpinner';
import StatusBadge from '../common/StatusBadge';

/**
 * 사이드바 문서 목록 탭.
 * 약속 props: documents(필수), hasMore, loading, error, onLoadMore, onRetry
 * 빈 목록이면 별도 문구를 표시하지 않습니다 (명세 4.3).
 */
export default function DocumentTabList({
  documents,
  hasMore = false,
  loading = false,
  error = '',
  onLoadMore,
  onRetry,
  onNavigate,
}) {
  if (loading && documents.length === 0) {
    return <LoadingSpinner />;
  }

  if (error && documents.length === 0) {
    return <ErrorMessage message={error} onRetry={onRetry} />;
  }

  return (
    <div className="flex flex-col gap-2">
      {documents.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {documents.map((doc) => (
            <li key={doc.documentId}>
              <NavLink
                to={`/documents/${doc.documentId}`}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex min-h-11 flex-col gap-1 rounded-xl border px-3.5 py-2.5 ${
                    isActive ? 'border-soft-line bg-soft' : 'border-transparent hover:bg-th'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`break-words text-sm text-ink ${isActive ? 'font-bold' : 'font-medium'}`}>
                      {doc.name}
                    </span>
                    <span className="flex flex-wrap items-center gap-1.5">
                      {doc.status ? <StatusBadge status={doc.status} /> : null}
                      {doc.currentVersionNo > 0 ? (
                        <span className="text-caption text-muted">v{doc.currentVersionNo}</span>
                      ) : null}
                      {doc.owned ? <Chip tone="white">내 문서</Chip> : null}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? (
        <div role="alert" className="flex flex-col items-start gap-1.5 pt-1">
          <p className="text-caption text-danger">{error}</p>
          {onRetry ? (
            <Button variant="outline" size="sm" onClick={onRetry}>
              다시 시도
            </Button>
          ) : null}
        </div>
      ) : null}
      {hasMore ? (
        <Button variant="outline" size="sm" className="w-full" onClick={onLoadMore} disabled={loading}>
          {loading ? '불러오는 중…' : '더 보기'}
        </Button>
      ) : null}
    </div>
  );
}

DocumentTabList.propTypes = {
  documents: PropTypes.arrayOf(
    PropTypes.shape({
      documentId: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      status: PropTypes.string,
      currentVersionNo: PropTypes.number,
      owned: PropTypes.bool,
    }),
  ).isRequired,
  hasMore: PropTypes.bool,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onLoadMore: PropTypes.func,
  onRetry: PropTypes.func,
  onNavigate: PropTypes.func,
};
