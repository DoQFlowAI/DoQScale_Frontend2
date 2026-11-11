// 소유: JJW (문서 상세 - 버전 목록)
import { useId, useState } from 'react';
import PropTypes from 'prop-types';
import Chip from '../common/Chip';
import StatusBadge from '../common/StatusBadge';
import { formatShortDate } from '../../utils/format';

const FILTERS = [
  ['ALL', '전체'],
  ['READY', '준비 완료'],
  ['PROCESSING', '분석 중'],
  ['FAILED', '실패'],
];

// 표 열 너비 (Figma: 버전 | 파일명 | 상태 | 등록일). 모바일(768px 미만)에서는 열 대신 줄바꿈으로 쌓습니다
const COLUMNS = 'md:grid md:grid-cols-[6.5rem_minmax(0,1fr)_5.5rem_4.5rem] md:items-center';

/**
 * 버전 목록 (명세 4.4 "버전 목록"). 최신 버전이 위에 오고, 상태로 걸러 볼 수 있습니다.
 * 줄을 누르면 onSelect(version) → 페이지가 버전 본문 패널을 엽니다.
 * [삭제]는 등록자(owned)에게만 보이고, 버전이 하나뿐이면 비활성입니다(서버도 400).
 * children 자리에는 페이지가 업로드 영역을 넣습니다.
 */
export default function VersionTable({ versions, currentVersionNo, owned = false, onDelete, onSelect, selectedVersionNo = null, children, title = '버전 목록' }) {
  const filterId = useId();
  const [filter, setFilter] = useState('ALL');
  // 원본 배열을 바꾸지 않도록 복사한 뒤 버전 번호 내림차순
  const sorted = [...versions].sort((a, b) => b.versionNo - a.versionNo);
  const shown = filter === 'ALL' ? sorted : sorted.filter((v) => v.status === filter);

  return (
    <div className="flex flex-col gap-3">
      {/* Figma: 제목은 왼쪽, 상태 거르기는 오른쪽 */}
      <div className="flex items-center gap-2">
        <h2 className="flex-1 text-title font-bold text-ink">{title}</h2>
        {versions.length > 0 ? (
          <label
            htmlFor={filterId}
            className="inline-flex min-h-11 items-center gap-2 rounded-btn-sm border border-line bg-white px-3 text-caption text-muted md:min-h-0 md:py-1.5"
          >
            상태
            <select
              id={filterId}
              aria-label="상태로 거르기"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-transparent text-label font-bold text-ink outline-none"
            >
              {FILTERS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {versions.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">아직 올라간 버전이 없습니다</p>
      ) : shown.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">해당하는 버전이 없습니다</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-white">
          {/* 표 머리줄은 화면에서만 보이는 장식입니다 (각 줄의 버튼이 이미 전체 내용을 읽어 줌) */}
          <div aria-hidden="true" className="hidden border-b border-line bg-th md:flex">
            <div className={`flex-1 px-3 py-2.5 text-caption text-muted ${COLUMNS}`}>
              <span>버전</span>
              <span>파일명</span>
              <span>상태</span>
              <span>등록일</span>
            </div>
            {owned ? <span className="w-12 shrink-0" /> : null}
          </div>
          <ul className="flex flex-col divide-y divide-line">
            {shown.map((v) => {
              const selected = v.versionNo === selectedVersionNo;
              const onlyOne = versions.length <= 1;
              return (
                <li
                  key={v.versionNo}
                  className={`flex items-center transition-colors ${selected ? 'bg-soft' : 'hover:bg-th/50'}`}
                >
                  {/* 줄 전체가 하나의 버튼이라 Enter·Space 로도 열립니다. 삭제 버튼은 형제 요소라 서로 이벤트가 섞이지 않습니다 */}
                  <button
                    type="button"
                    data-version-no={v.versionNo}
                    aria-label={`v${v.versionNo} 본문 보기`}
                    aria-current={selected ? 'true' : undefined}
                    onClick={() => onSelect?.(v)}
                    className={`flex min-h-11 min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5 px-3 py-2.5 text-left md:flex-nowrap ${COLUMNS}`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-body font-bold text-ink">v{v.versionNo}</span>
                      {v.versionNo === currentVersionNo ? <Chip tone="green">최신</Chip> : null}
                    </span>
                    <span className="order-last min-w-0 basis-full truncate text-label text-ink-2 md:order-none md:basis-auto" title={v.originalFilename}>
                      {v.originalFilename}
                    </span>
                    <StatusBadge status={v.status} />
                    <span className="shrink-0 text-caption text-muted">{formatShortDate(v.createdAt)}</span>
                  </button>
                  {owned ? (
                    <button
                      type="button"
                      aria-label={`v${v.versionNo} 삭제`}
                      title={onlyOne ? '마지막 버전은 삭제할 수 없습니다' : undefined}
                      disabled={onlyOne}
                      onClick={() => onDelete?.(v)}
                      className="min-h-11 w-12 shrink-0 rounded-btn-sm text-label font-medium text-danger hover:bg-danger-bg disabled:text-danger-disabled disabled:hover:bg-transparent md:min-h-0 md:py-2"
                    >
                      삭제
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {children}
    </div>
  );
}

VersionTable.propTypes = {
  versions: PropTypes.arrayOf(
    PropTypes.shape({
      versionNo: PropTypes.number.isRequired,
      originalFilename: PropTypes.string,
      status: PropTypes.string.isRequired,
      createdAt: PropTypes.string,
    }),
  ).isRequired,
  currentVersionNo: PropTypes.number,
  owned: PropTypes.bool,
  onDelete: PropTypes.func,
  onSelect: PropTypes.func,
  selectedVersionNo: PropTypes.number,
  children: PropTypes.node,
  title: PropTypes.string, // 카드 제목 (Figma: "버전 목록")
};
