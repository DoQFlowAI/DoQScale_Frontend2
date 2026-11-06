import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Chip from '../common/Chip';
import Button from '../common/Button';

const CHANGE_TYPE = { PROCEDURE: '절차', NUMERIC: '수치', WORDING: '표현' };

function SegmentCard({ documentId, segment }) {
  const { from, to, changeType, summary, changeCount, summaryStatus } = segment;
  const ok = summaryStatus === 'OK';
  const skipped = summaryStatus === 'SKIPPED';
  const label = `v${from}에서 v${to} 비교`;
  return (
    <Link
      to={`/documents/${documentId}/compare?from=${from}&to=${to}`}
      aria-label={label}
      className={`flex min-h-11 w-full flex-col justify-center gap-1 rounded-[14px] px-3.5 py-2.5 hover:brightness-95 ${
        ok ? 'bg-soft' : 'bg-th'
      }`}
    >
      {skipped ? (
        <span className="text-[12px] text-muted">내용 변경 없음</span>
      ) : (
        <>
          <span className="flex items-center gap-2">
            {ok && CHANGE_TYPE[changeType] ? <Chip>{CHANGE_TYPE[changeType]}</Chip> : null}
            <span className="text-[12px] text-muted">변경 {changeCount}건</span>
          </span>
          {/* FAILED 면 요약 없이 변경 건수만 */}
          {ok && summary ? <span className="break-words text-[14px] font-medium text-ink-2">{summary}</span> : null}
        </>
      )}
    </Link>
  );
}

SegmentCard.propTypes = {
  documentId: PropTypes.number.isRequired,
  segment: PropTypes.shape({
    from: PropTypes.number.isRequired,
    to: PropTypes.number.isRequired,
    changeType: PropTypes.string,
    summary: PropTypes.string,
    changeCount: PropTypes.number,
    summaryStatus: PropTypes.string,
  }).isRequired,
};

export default function HistoryTimeline({ documentId, versions, segments, currentVersionNo, onOpenCompare }) {
  const sorted = [...versions].sort((a, b) => a.versionNo - b.versionNo);
  const segFor = (from) => segments.find((s) => s.from === from);
  const lastNo = sorted.length ? sorted[sorted.length - 1].versionNo : currentVersionNo;

  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-3xl bg-white px-5 py-5 md:px-6 md:py-[22px]">
      <div className="flex items-center gap-2">
        <h2 className="flex-1 text-[20px] font-bold text-ink">변천사</h2>
        <Button size="sm" variant="outline" onClick={onOpenCompare}>
          버전 비교
        </Button>
      </div>

      {sorted.length < 2 ? (
        <p className="py-6 text-center text-[14px] text-muted">버전이 2개 이상이어야 변천사를 볼 수 있습니다</p>
      ) : (
        <ol className="flex flex-col">
          {sorted.map((v, i) => {
            const seg = i < sorted.length - 1 ? segFor(v.versionNo) : null;
            const latest = v.versionNo === lastNo;
            return (
              <li key={v.versionNo} className="flex flex-col">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                      latest ? 'bg-brand text-white' : 'bg-chip text-chip-ink'
                    }`}
                  >
                    v{v.versionNo}
                  </span>
                  <span className="min-w-0 truncate text-[13px] font-medium text-ink-2" title={v.originalFilename}>
                    {v.originalFilename}
                  </span>
                </div>
                {i < sorted.length - 1 ? (
                  <div className="flex gap-2.5">
                    <div className="flex w-9 shrink-0 flex-col items-center">
                      <div className="min-h-3 w-0.5 flex-1 bg-[#cfdcd7]" />
                      <span aria-hidden="true" className="-mt-1 text-[10px] leading-none text-[#cfdcd7]">
                        ▼
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 py-1.5">
                      {seg ? (
                        <SegmentCard documentId={documentId} segment={seg} />
                      ) : (
                        <div className="h-6" />
                      )}
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

HistoryTimeline.propTypes = {
  documentId: PropTypes.number.isRequired,
  versions: PropTypes.array.isRequired,
  segments: PropTypes.array.isRequired,
  currentVersionNo: PropTypes.number,
  onOpenCompare: PropTypes.func.isRequired,
};
