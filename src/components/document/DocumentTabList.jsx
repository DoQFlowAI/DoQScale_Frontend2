import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import Chip from '../common/Chip';

export default function DocumentTabList({ documents, onNavigate }) {
  return (
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
                <span className={`break-words text-[14px] text-ink ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {doc.name}
                </span>
                <span className="flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={doc.status} />
                  {doc.currentVersionNo > 0 ? (
                    <span className="text-[12px] text-muted">v{doc.currentVersionNo}</span>
                  ) : null}
                  {doc.owned ? <Chip tone="white">내 문서</Chip> : null}
                </span>
              </>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

DocumentTabList.propTypes = {
  documents: PropTypes.arrayOf(
    PropTypes.shape({
      documentId: PropTypes.number.isRequired,
      name: PropTypes.string,
      status: PropTypes.string,
      currentVersionNo: PropTypes.number,
      owned: PropTypes.bool,
    }),
  ).isRequired,
  onNavigate: PropTypes.func,
};
