import { useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { buildDiffRows } from '../../utils/diffAlign';

// DELETE 빨강(왼쪽) / INSERT 초록(오른쪽) / CHANGE 노랑(양쪽) / 맞춤용 빈 줄 회색
const TONE = {
  same: '',
  del: 'bg-danger-bg',
  add: 'bg-diff-add',
  chg: 'bg-warn',
  filler: 'bg-diff-filler',
};

function Cell({ cell, side, active, rowRef, last }) {
  return (
    <div
      ref={rowRef}
      className={`bg-white px-3 md:px-4 ${side === 'left' ? 'order-1 md:order-none' : 'order-2 md:order-none'} ${
        last ? 'rounded-b-[20px] pb-3' : ''
      }`}
    >
      <div
        className={`flex min-h-[46px] items-center gap-2.5 px-2.5 py-1.5 ${TONE[cell.tone]} ${
          active ? 'ring-2 ring-inset ring-brand/50' : ''
        }`}
      >
        <span className="w-6 shrink-0 text-[12px] text-muted">{cell.tone === 'filler' ? '' : cell.no}</span>
        {/* 텍스트로만 렌더링 (HTML 문자열로 넣지 않는다) */}
        <span className="min-w-0 flex-1 whitespace-pre-wrap break-words text-[14px] text-ink-2">
          {cell.tone === 'filler' ? '' : cell.text}
        </span>
      </div>
    </div>
  );
}

Cell.propTypes = {
  cell: PropTypes.shape({ no: PropTypes.number, text: PropTypes.string, tone: PropTypes.string.isRequired }).isRequired,
  side: PropTypes.oneOf(['left', 'right']).isRequired,
  active: PropTypes.bool,
  rowRef: PropTypes.func,
  last: PropTypes.bool,
};

function Title({ children, side }) {
  return (
    <div
      className={`rounded-t-[20px] bg-white px-5 pb-2.5 pt-[18px] md:sticky md:top-0 md:z-10 ${
        side === 'left' ? 'order-1 md:order-none' : 'order-2 md:order-none'
      }`}
    >
      <h2 className="text-[16px] font-bold text-ink">{children}</h2>
    </div>
  );
}

Title.propTypes = { children: PropTypes.node, side: PropTypes.string.isRequired };

/**
 * 두 버전 전체 본문을 좌우로 보여 주고 diffJson 위치대로 강조한다.
 * 좌우는 한 스크롤 영역 안의 같은 grid 행이라 높이가 맞고 함께 스크롤된다.
 * 모바일(<768px)에서는 이전 버전 위, 이후 버전 아래로 쌓인다.
 */
export default function DiffViewer({ fromLabel, toLabel, fromText, toText, diffJson, activeBlock = -1, scrollKey = 0 }) {
  const { rows } = useMemo(() => buildDiffRows(fromText, toText, diffJson), [fromText, toText, diffJson]);
  const firstRowOfBlock = useRef(new Map());

  // [이전 변경]·[다음 변경]을 누르면 그 블록으로 스크롤
  useEffect(() => {
    if (!scrollKey || activeBlock < 0) return;
    const el = firstRowOfBlock.current.get(activeBlock);
    el?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  }, [scrollKey, activeBlock]);

  const seen = new Set();

  return (
    <div className="thin-scroll grid min-h-0 flex-1 grid-cols-1 content-start overflow-auto md:grid-cols-2 md:gap-x-4">
      <Title side="left">{fromLabel}</Title>
      <Title side="right">{toLabel}</Title>
      {rows.map((row, idx) => {
        const last = idx === rows.length - 1;
        const isFirst = row.blockIndex >= 0 && !seen.has(row.blockIndex);
        if (isFirst) seen.add(row.blockIndex);
        const active = row.blockIndex === activeBlock;
        const refFn = isFirst
          ? (el) => {
              if (el) firstRowOfBlock.current.set(row.blockIndex, el);
              else firstRowOfBlock.current.delete(row.blockIndex);
            }
          : undefined;
        return (
          <FragmentRow key={idx} row={row} active={active} rowRef={refFn} last={last} />
        );
      })}
    </div>
  );
}

function FragmentRow({ row, active, rowRef, last }) {
  return (
    <>
      <Cell cell={row.left} side="left" active={active} rowRef={rowRef} last={last} />
      <Cell cell={row.right} side="right" active={active} last={last} />
    </>
  );
}

FragmentRow.propTypes = {
  row: PropTypes.shape({ left: PropTypes.object, right: PropTypes.object }).isRequired,
  active: PropTypes.bool,
  rowRef: PropTypes.func,
  last: PropTypes.bool,
};

DiffViewer.propTypes = {
  fromLabel: PropTypes.string.isRequired,
  toLabel: PropTypes.string.isRequired,
  fromText: PropTypes.string,
  toText: PropTypes.string,
  diffJson: PropTypes.array,
  activeBlock: PropTypes.number,
  scrollKey: PropTypes.number,
};
