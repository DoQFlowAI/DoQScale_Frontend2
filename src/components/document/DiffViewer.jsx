// 소유: JJW (비교 탭 diff 뷰어)
import { useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { TONE, buildDiffRows, firstRowOfBlocks } from '../../utils/diffAlign';

// 색 구분: DELETE 왼쪽 빨강, INSERT 오른쪽 초록, CHANGE 양쪽 노랑, 짧은 쪽은 회색 빈 줄
// 색만으로 구분하지 않도록 스크린리더용 문구도 함께 둡니다
const TONE_STYLE = {
  [TONE.SAME]: 'bg-white',
  [TONE.DEL]: 'bg-danger-bg',
  [TONE.ADD]: 'bg-diff-add',
  [TONE.CHG]: 'bg-warn',
  [TONE.FILLER]: 'bg-diff-filler',
};
const TONE_LABEL = { [TONE.DEL]: '삭제된 줄: ', [TONE.ADD]: '추가된 줄: ', [TONE.CHG]: '바뀐 줄: ' };

/**
 * 한 칸. 바깥은 카드 모양(흰 배경)을 이루고, 안쪽 띠가 색칠됩니다 (Figma: 좌우 카드 두 개).
 * 좌우 칸이 한 grid 의 같은 줄에 놓이므로 줄 맞춤은 그대로이고, 카드의 마지막 줄만 아래쪽을 둥글게 합니다.
 */
function Cell({ side, line, blockIndex, isFirst, active, isLast }) {
  // 모바일(한 열)에서는 왼쪽 칸이 모두 위, 오른쪽 칸이 모두 아래로 가도록 order 를 줍니다
  const order = side === 'left' ? 'order-1 md:order-none' : 'order-2 md:order-none';
  return (
    <div
      data-side={side}
      data-first={isFirst ? blockIndex : undefined}
      className={`bg-white px-5 ${order} ${isLast ? 'rounded-b-3xl pb-5' : ''}`}
    >
      <div
        className={`flex min-h-11 gap-3 px-3 py-2.5 text-body ${TONE_STYLE[line.tone]} ${
          active ? 'outline-2 -outline-offset-2 outline-brand' : ''
        }`}
      >
        <span aria-hidden="true" className="w-7 shrink-0 select-none text-right text-caption leading-6 text-muted">
          {line.no ?? ''}
        </span>
        <span className="min-w-0 flex-1 whitespace-pre-wrap break-words leading-6 text-ink-2">
          {/* 본문은 텍스트로만 그립니다 (XSS 방지, 명세 9.1). 강조는 이 칸의 배경색입니다 */}
          {TONE_LABEL[line.tone] ? <span className="sr-only">{TONE_LABEL[line.tone]}</span> : null}
          {line.text}
        </span>
      </div>
    </div>
  );
}

Cell.propTypes = {
  side: PropTypes.oneOf(['left', 'right']).isRequired,
  line: PropTypes.shape({ no: PropTypes.number, text: PropTypes.string, tone: PropTypes.string }).isRequired,
  blockIndex: PropTypes.number.isRequired,
  isFirst: PropTypes.bool.isRequired,
  active: PropTypes.bool.isRequired,
  isLast: PropTypes.bool,
};

/**
 * 두 버전의 전체 본문을 좌우로 보여 주고 diffJson 위치대로 색칠합니다 (명세 4.4).
 * 좌우 칸을 한 grid 안에 번갈아 넣어서 같은 내용이 같은 높이에 오고, 두 쪽이 함께 스크롤됩니다.
 * 모바일(768px 미만)은 한 열: 이전 버전 전체가 위, 이후 버전 전체가 아래입니다.
 *
 * @param activeBlock 지금 가리키는 변경 블록 번호 (없으면 null)
 * @param scrollKey 같은 블록을 다시 눌러도 그 위치로 가도록 바뀌는 값
 */
export default function DiffViewer({ fromLabel, toLabel, fromText, toText, diffJson, activeBlock = null, scrollKey = 0 }) {
  const rootRef = useRef(null);
  const rows = useMemo(() => buildDiffRows(fromText, toText, diffJson), [fromText, toText, diffJson]);
  const firsts = useMemo(() => firstRowOfBlocks(rows), [rows]);

  // 이전 변경·다음 변경을 누르면 그 블록의 첫 줄이 화면 가운데에 오게 합니다
  useEffect(() => {
    if (activeBlock === null || activeBlock === undefined) return;
    const row = rows[firsts[activeBlock]];
    if (!row) return;
    const desktop = window.matchMedia('(min-width: 768px)').matches;
    // 모바일에서 INSERT 블록은 왼쪽이 빈 줄이라 왼쪽으로 가면 엉뚱한 위쪽 빈 곳이 됩니다. 이때는 오른쪽 칸으로 갑니다
    const side = !desktop && row.left.tone === TONE.FILLER ? 'right' : 'left';
    const target = rootRef.current?.querySelector(`[data-first="${activeBlock}"][data-side="${side}"]`);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
  }, [activeBlock, scrollKey, rows, firsts]);

  return (
    <div ref={rootRef} className="grid grid-cols-1 md:grid-cols-2 md:gap-x-5">
      <h3 className="order-1 rounded-t-3xl bg-white px-5 pb-3 pt-5 text-base font-bold text-ink md:order-none">{fromLabel}</h3>
      <h3 className="order-2 mt-5 rounded-t-3xl bg-white px-5 pb-3 pt-5 text-base font-bold text-ink md:order-none md:mt-0">
        {toLabel}
      </h3>
      {rows.map((row, index) => {
        const isFirst = row.blockIndex >= 0 && firsts[row.blockIndex] === index;
        const active = row.blockIndex >= 0 && row.blockIndex === activeBlock;
        return (
          <FragmentRow key={row.key} row={row} isFirst={isFirst} active={active} isLast={index === rows.length - 1} />
        );
      })}
    </div>
  );
}

// 한 행 = 왼쪽 칸 + 오른쪽 칸 (grid 의 같은 줄에 놓임)
function FragmentRow({ row, isFirst, active, isLast }) {
  return (
    <>
      <Cell side="left" line={row.left} blockIndex={row.blockIndex} isFirst={isFirst} active={active} isLast={isLast} />
      <Cell side="right" line={row.right} blockIndex={row.blockIndex} isFirst={isFirst} active={active} isLast={isLast} />
    </>
  );
}

FragmentRow.propTypes = {
  row: PropTypes.shape({
    blockIndex: PropTypes.number.isRequired,
    left: PropTypes.object.isRequired,
    right: PropTypes.object.isRequired,
  }).isRequired,
  isFirst: PropTypes.bool.isRequired,
  active: PropTypes.bool.isRequired,
  isLast: PropTypes.bool,
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
