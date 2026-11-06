/**
 * 서버(java-diff-utils)가 계산한 diffJson 의 위치대로 좌우 줄 맞춤 행을 만든다.
 * 화면에서 차이를 계산하지 않는다 — 색칠과 빈 줄 맞춤만 한다 (4.4 문서 비교 결과).
 *
 * diffJson: [{ type: 'DELETE'|'INSERT'|'CHANGE', fromLine, fromCount, toLine, toCount }]
 *   줄 번호는 본문을 줄바꿈으로 나눈 순서(0부터).
 *
 * 반환 행: { left, right, blockIndex }  (blockIndex: 바뀌지 않은 줄은 -1)
 *   cell: { no, text, tone } | { tone: 'filler' }
 *   tone: 'same' | 'del'(빨강) | 'add'(초록) | 'chg'(노랑) | 'filler'(맞춤용 빈 줄)
 */
export function splitLines(text) {
  if (text === null || text === undefined || text === '') return [];
  return String(text).replace(/\r\n?/g, '\n').split('\n');
}

const FILLER = { tone: 'filler' };

export function buildDiffRows(fromText, toText, diffJson) {
  const fromLines = splitLines(fromText);
  const toLines = splitLines(toText);
  const blocks = (Array.isArray(diffJson) ? diffJson : [])
    .filter((b) => b && Number.isInteger(b.fromLine) && Number.isInteger(b.toLine))
    .map((b) => ({
      type: b.type,
      fromLine: b.fromLine,
      toLine: b.toLine,
      fromCount: Math.max(0, b.fromCount | 0),
      toCount: Math.max(0, b.toCount | 0),
    }))
    .sort((a, b) => a.fromLine - b.fromLine || a.toLine - b.toLine);

  const rows = [];
  let i = 0;
  let j = 0;

  const cell = (lines, idx, tone) => ({ no: idx + 1, text: lines[idx], tone });

  // 바뀌지 않은 줄을 좌우 한 쌍씩. 한쪽만 남으면 반대쪽은 빈 줄로 맞춘다
  const emitSame = (fromLimit, toLimit) => {
    while (i < fromLimit && j < toLimit && i < fromLines.length && j < toLines.length) {
      rows.push({ left: cell(fromLines, i++, 'same'), right: cell(toLines, j++, 'same'), blockIndex: -1 });
    }
    while (i < fromLimit && i < fromLines.length) {
      rows.push({ left: cell(fromLines, i++, 'same'), right: FILLER, blockIndex: -1 });
    }
    while (j < toLimit && j < toLines.length) {
      rows.push({ left: FILLER, right: cell(toLines, j++, 'same'), blockIndex: -1 });
    }
  };

  blocks.forEach((b, blockIndex) => {
    emitSame(b.fromLine, b.toLine);
    const n = Math.max(b.fromCount, b.toCount);
    const leftTone = b.type === 'DELETE' ? 'del' : b.type === 'INSERT' ? 'add' : 'chg';
    const rightTone = b.type === 'INSERT' ? 'add' : b.type === 'DELETE' ? 'del' : 'chg';
    for (let k = 0; k < n; k++) {
      const li = b.fromLine + k;
      const ri = b.toLine + k;
      rows.push({
        left: k < b.fromCount && li < fromLines.length ? cell(fromLines, li, leftTone) : FILLER,
        right: k < b.toCount && ri < toLines.length ? cell(toLines, ri, rightTone) : FILLER,
        blockIndex,
      });
    }
    i = Math.max(i, b.fromLine + b.fromCount);
    j = Math.max(j, b.toLine + b.toCount);
  });

  emitSame(fromLines.length, toLines.length);
  return { rows, blockCount: blocks.length };
}
