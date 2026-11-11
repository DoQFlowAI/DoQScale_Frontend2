// 소유: KJH (문서 목록)
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import Button from '../common/Button';
import Chip from '../common/Chip';
import Icon from '../common/Icon';
import ErrorMessage from '../common/ErrorMessage';
import LoadingSpinner from '../common/LoadingSpinner';
import StatusBadge from '../common/StatusBadge';

export default function DocumentTabList({
  documents,
  hasMore = false,
  loading = false,
  error = '',
  onLoadMore,
  onRetry,
  onNavigate,
  onEdit,
  onDelete,
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
        <ul className="flex flex-col divide-y divide-line">
          {documents.map((doc) => (
            <li key={doc.documentId} className="py-1.5 first:pt-0 last:pb-0">
              <NavLink
                to={`/documents/${doc.documentId}`}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex min-h-11 min-w-0 items-start justify-between gap-2 rounded-xl border px-3.5 py-2.5 ${
                    isActive ? 'border-soft-line bg-soft' : 'border-transparent hover:bg-th'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className={`break-words text-body text-ink ${isActive ? 'font-bold' : 'font-medium'}`}>
                        {doc.name}
                      </span>
                      <span className="flex flex-wrap items-center gap-1.5">
                        {doc.status ? <StatusBadge status={doc.status} /> : null}
                        {doc.currentVersionNo > 0 ? (
                          <span className="text-caption text-muted">v{doc.currentVersionNo}</span>
                        ) : null}
                        {/* Figma: 보고 있는 문서는 흰 칩, 나머지는 초록 글자 */}
                        {doc.owned ? (
                          isActive ? (
                            <Chip tone="white">내 문서</Chip>
                          ) : (
                            <span className="text-caption font-medium text-brand">내 문서</span>
                          )
                        ) : null}
                      </span>
                    </div>
                    {(onEdit || onDelete) && doc.owned ? (
                      <div className="-my-1 -mr-1 flex shrink-0 items-center">
                        {onEdit ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onEdit(doc);
                            }}
                            aria-label={`${doc.name} 수정`}
                            className="group shrink-0 !px-1 !py-1 hover:!bg-transparent"
                          >
                            <Icon
                              name="edit"
                              className="h-4 w-4 text-muted transition-all duration-150 group-hover:scale-115 group-hover:text-ink-2"
                            />
                          </Button>
                        ) : null}
                        {onDelete ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onDelete(doc);
                            }}
                            aria-label={`${doc.name} 삭제`}
                            className="group shrink-0 !px-1 !py-1 hover:!bg-transparent"
                          >
                            <Icon
                              name="trash"
                              className="h-4 w-4 text-[#C27D70] transition-all duration-150 group-hover:scale-115 group-hover:text-[#A85D60]"
                            />
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-body font-bold text-ink">아직 문서가 없어요</p>
          <p className="mt-1.5 text-caption text-muted leading-relaxed">
            직접 만든 문서와 초대받은 문서가<br />여기에 표시돼요
          </p>
        </div>
      )}
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
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
};
