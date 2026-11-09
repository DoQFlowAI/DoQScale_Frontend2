// 소유: JJW (문서 상세 - 버전 목록)
import { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../common/Button';
import Chip from '../common/Chip';
import StatusBadge from '../common/StatusBadge';
import { formatShortDate } from '../../utils/format';

const FILTERS = [
  ['ALL', '전체'],
  ['READY', '준비 완료'],
  ['PROCESSING', '분석 중'],
  ['FAILED', '실패'],
];

/**
 * 버전 목록 (명세 4.4 "버전 목록"). 최신 버전이 위에 오고, 상태로 걸러 볼 수 있습니다.
 * 줄을 누르면 onSelect(version) → 페이지가 버전 본문 패널을 엽니다.
 * [삭제]는 등록자(owned)에게만 보이고, 버전이 하나뿐이면 비활성입니다(서버도 400).
 * children 자리에는 페이지가 업로드 영역을 넣습니다.
 */
export default function VersionTable({ versions, currentVersionNo, owned = false, onDelete, onSelect, selectedVersionNo = null, children }) {
  const [filter, setFilter] = useState('ALL');
  // 원본 배열을 바꾸지 않도록 복사한 뒤 버전 번호 내림차순
  const sorted = [...versions].sort((a, b) => b.versionNo - a.versionNo);
  const shown = filter === 'ALL' ? sorted : sorted.filter((v) => v.status === filter);

  return (
    <div className="flex flex-col gap-3">
      {versions.length > 0 ? (
        <div role="group" aria-label="상태로 거르기" className="flex flex-wrap gap-1.5">
          {FILTERS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={`min-h-11 rounded-full border px-3.5 py-1 text-label font-medium md:min-h-0 ${
                filter === value ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink-2 hover:bg-soft'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      {versions.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">아직 올라간 버전이 없습니다</p>
      ) : shown.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">해당하는 버전이 없습니다</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {shown.map((v) => {
            const selected = v.versionNo === selectedVersionNo;
            return (
              <li
                key={v.versionNo}
                className={`flex items-center gap-1 rounded-xl border ${selected ? 'border-soft-line bg-soft' : 'border-line bg-white'}`}
              >
                {/* 줄 전체가 하나의 버튼이라 Enter·Space 로도 열립니다. 삭제 버튼은 형제 요소라 서로 이벤트가 섞이지 않습니다 */}
                <button
                  type="button"
                  data-version-no={v.versionNo}
                  aria-label={`v${v.versionNo} 본문 보기`}
                  aria-current={selected ? 'true' : undefined}
                  onClick={() => onSelect?.(v)}
                  className="flex min-h-11 min-w-0 flex-1 flex-col items-start gap-0.5 rounded-xl px-3.5 py-2 text-left"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-body font-bold text-ink">v{v.versionNo}</span>
                    {v.versionNo === currentVersionNo ? <Chip tone="green">최신</Chip> : null}
                    <StatusBadge status={v.status} />
                  </span>
                  <span className="flex w-full min-w-0 items-center gap-2 text-caption text-muted">
                    <span className="min-w-0 truncate" title={v.originalFilename}>
                      {v.originalFilename}
                    </span>
                    <span className="shrink-0">{formatShortDate(v.createdAt)}</span>
                  </span>
                </button>
                {owned ? (
                  <Button
                    variant="danger"
                    size="sm"
                    aria-label={`v${v.versionNo} 삭제`}
                    title={versions.length <= 1 ? '마지막 버전은 삭제할 수 없습니다' : undefined}
                    disabled={versions.length <= 1}
                    onClick={() => onDelete?.(v)}
                    className="mr-2 shrink-0"
                  >
                    삭제
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
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
};
