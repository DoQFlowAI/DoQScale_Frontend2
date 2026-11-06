import { useState } from 'react';
import PropTypes from 'prop-types';
import StatusBadge from '../common/StatusBadge';
import Chip from '../common/Chip';
import { formatShortDate } from '../../utils/format';

const FILTERS = [
  ['ALL', '전체'],
  ['READY', '준비 완료'],
  ['PROCESSING', '분석 중'],
  ['FAILED', '실패'],
];

/** 버전 목록. 삭제는 등록자만, 버전이 하나뿐이면 삭제 버튼을 비활성화한다 */
export default function VersionTable({ versions, currentVersionNo, owned, onDelete, children }) {
  const [filter, setFilter] = useState('ALL');
  const sorted = [...versions].sort((a, b) => b.versionNo - a.versionNo);
  const shown = filter === 'ALL' ? sorted : sorted.filter((v) => v.status === filter);
  const onlyOne = versions.length <= 1;

  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-3xl bg-white px-5 py-5 md:px-6 md:py-[22px]">
      <div className="flex items-center gap-2">
        <h2 className="flex-1 text-[20px] font-bold text-ink">버전 목록</h2>
        <label className="flex min-h-11 items-center gap-1.5 rounded-[10px] border border-line px-3 py-1.5 text-[12px] font-medium text-muted md:min-h-0">
          상태
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="상태 필터"
            className="bg-transparent text-[13px] text-ink-2 outline-none"
          >
            {FILTERS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {versions.length === 0 ? (
        <p className="py-6 text-center text-[14px] text-muted">아직 올라간 버전이 없습니다</p>
      ) : (
        <>
          <div
            aria-hidden="true"
            className="hidden items-center gap-2 rounded-[10px] bg-th px-3 py-2 text-[12px] font-medium text-muted sm:flex"
          >
            <span className="w-24 shrink-0">버전</span>
            <span className="min-w-0 flex-1">파일명</span>
            <span className="w-20 shrink-0">상태</span>
            <span className="w-[84px] shrink-0">등록일</span>
            {owned ? <span className="w-9 shrink-0" /> : null}
          </div>
          {shown.length === 0 ? (
            <p className="py-4 text-center text-[13px] text-muted">조건에 맞는 버전이 없습니다</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {shown.map((v) => (
                <li
                  key={v.versionNo}
                  className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-line px-3 py-2.5 sm:flex-nowrap"
                >
                  <span className="flex w-24 shrink-0 items-center gap-1.5">
                    <span className="text-[15px] font-bold text-ink">v{v.versionNo}</span>
                    {v.versionNo === currentVersionNo ? <Chip>최신</Chip> : null}
                  </span>
                  <span
                    className="min-w-0 flex-1 truncate text-[13px] text-ink-2"
                    title={v.originalFilename}
                  >
                    {v.originalFilename}
                  </span>
                  <span className="flex w-20 shrink-0 items-center">
                    <StatusBadge status={v.status} />
                  </span>
                  <span className="w-[84px] shrink-0 text-[12px] text-muted">{formatShortDate(v.createdAt)}</span>
                  {owned ? (
                    <button
                      type="button"
                      onClick={() => onDelete(v)}
                      disabled={onlyOne}
                      title={onlyOne ? '버전이 하나뿐이면 삭제할 수 없습니다' : undefined}
                      aria-label={`v${v.versionNo} 삭제`}
                      className="flex min-h-11 w-9 shrink-0 items-center justify-center text-[12px] font-medium text-danger hover:underline disabled:cursor-not-allowed disabled:text-[#c9a0a0] disabled:no-underline md:min-h-0"
                    >
                      삭제
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {children}
    </section>
  );
}

VersionTable.propTypes = {
  versions: PropTypes.arrayOf(
    PropTypes.shape({
      versionNo: PropTypes.number.isRequired,
      originalFilename: PropTypes.string,
      status: PropTypes.string,
      createdAt: PropTypes.string,
    }),
  ).isRequired,
  currentVersionNo: PropTypes.number,
  owned: PropTypes.bool,
  onDelete: PropTypes.func,
  children: PropTypes.node,
};
