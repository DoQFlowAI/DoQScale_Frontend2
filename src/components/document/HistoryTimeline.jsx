// 소유: JJW (이력 탭 타임라인)
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Chip from '../common/Chip';
import StatusBadge from '../common/StatusBadge';
import { changeTypeLabel } from '../../utils/changeType';
import { formatShortDate } from '../../utils/format';

// 비교할 수 있는 버전인가. 상태를 모르면(변천사 응답에는 status 가 없음, API 설계서 5.13) 막지 않고 서버 판단에 맡깁니다
// (고를 수 없는 조합이면 서버가 400 을 주고 비교 화면이 버전 선택 모달을 다시 엽니다)
const canCompare = (version) => !version.status || version.status === 'READY';

/** 두 버전 사이 구간 카드. 비교할 수 있으면(양쪽 READY 이거나 상태를 모름) 누르면 비교 결과로 갑니다 */
function SegmentCard({ documentId, segment, comparable }) {
  const { from, to, changeCount, changeType, summary, summaryStatus } = segment;
  // summaryStatus: OK 면 요약, FAILED 면 변경 건수만, SKIPPED(바뀐 블록 없음)면 "내용 변경 없음" (데이터베이스 설계서 4.3)
  const body =
    summaryStatus === 'SKIPPED' ? (
      <p className="text-sm text-muted">내용 변경 없음</p>
    ) : (
      <>
        <span className="flex flex-wrap items-center gap-2">
          {summaryStatus === 'OK' && changeTypeLabel(changeType) ? <Chip tone="soft">{changeTypeLabel(changeType)}</Chip> : null}
          <span className="text-caption text-muted">변경 {changeCount}건</span>
        </span>
        {summaryStatus === 'OK' && summary ? <p className="mt-1 break-words text-sm text-ink-2">{summary}</p> : null}
      </>
    );

  const className = 'block rounded-xl border border-line bg-white p-3';
  if (!comparable) {
    return (
      <div className={className}>
        {body}
        <p className="mt-1 text-caption text-muted">준비 완료된 버전만 비교할 수 있습니다</p>
      </div>
    );
  }
  return (
    <Link
      to={`/documents/${documentId}/compare?from=${from}&to=${to}`}
      aria-label={`v${from}에서 v${to}로 바뀐 내용 비교하기`}
      className={`${className} min-h-11 hover:bg-soft`}
    >
      {body}
    </Link>
  );
}

SegmentCard.propTypes = {
  documentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  segment: PropTypes.shape({
    from: PropTypes.number.isRequired,
    to: PropTypes.number.isRequired,
    changeCount: PropTypes.number,
    changeType: PropTypes.string,
    summary: PropTypes.string,
    summaryStatus: PropTypes.string,
  }).isRequired,
  comparable: PropTypes.bool.isRequired,
};

/**
 * 변천사 (명세 4.4 "변천사"). 버전을 오래된 순으로 세로로 잇고, 버전 사이마다 무엇이 바뀌었는지 구간 카드로 보여 줍니다.
 * 버전이 2개 미만이면 구간이 없어 안내 문구만 보입니다.
 * @param versions·segments GET /documents/{id}/history 응답의 같은 이름 필드.
 *   실제 응답의 versions 에는 status 가 없으므로, 어느 버전이 READY 인지는 페이지가 문서(GET /documents/{id})의
 *   versions[].status 로 채워서 넘깁니다. status 를 모르는 버전은 비교를 막지 않습니다.
 */
export default function HistoryTimeline({ documentId, versions, segments }) {
  const sorted = [...versions].sort((a, b) => a.versionNo - b.versionNo);
  if (sorted.length < 2) {
    return <p className="py-6 text-center text-sm text-muted">버전이 2개 이상이어야 변천사를 볼 수 있습니다</p>;
  }

  return (
    <ol className="flex flex-col">
      {sorted.map((v, index) => {
        const next = sorted[index + 1];
        const segment = next ? segments.find((s) => s.from === v.versionNo && s.to === next.versionNo) : null;
        return (
          <li key={v.versionNo}>
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full bg-brand" />
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-body font-bold text-ink">v{v.versionNo}</span>
                {v.status && v.status !== 'READY' ? <StatusBadge status={v.status} /> : null}
                <span className="min-w-0 truncate text-caption text-muted" title={v.originalFilename}>
                  {v.originalFilename}
                </span>
                <span className="text-caption text-muted">{formatShortDate(v.createdAt)}</span>
              </div>
            </div>
            {next ? (
              <div className="ml-[5px] border-l-2 border-line-soft py-2.5 pl-5">
                {segment ? (
                  <SegmentCard
                    documentId={documentId}
                    segment={segment}
                    comparable={canCompare(v) && canCompare(next)}
                  />
                ) : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

HistoryTimeline.propTypes = {
  documentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  versions: PropTypes.arrayOf(
    PropTypes.shape({
      versionNo: PropTypes.number.isRequired,
      originalFilename: PropTypes.string,
      status: PropTypes.string, // 없을 수 있음 (API 설계서 5.13). 페이지가 문서의 버전 목록에서 채워서 넘김
      createdAt: PropTypes.string,
    }),
  ).isRequired,
  segments: PropTypes.array.isRequired,
};
