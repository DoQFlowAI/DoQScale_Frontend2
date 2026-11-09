// 소유: JJW (비교 탭 diff 뷰어)
/**
 * 비교 화면의 줄 맞춤 로직 (명세 4.4 "문서 비교 결과").
 *
 * 차이는 화면에서 계산하지 않습니다. 서버(java-diff-utils)가 준 diffJson 의 위치대로
 * 두 본문을 "좌우 한 쌍씩의 행" 으로 엮기만 합니다. 순수 함수라 화면 없이 확인할 수 있습니다.
 *
 * diffJson 한 블록: { type: 'DELETE'|'INSERT'|'CHANGE', fromLine, fromCount, toLine, toCount }
 *  - 줄 번호는 fromText·toText 를 줄바꿈으로 나눈 순서(0부터)
 *  - 바뀌지 않은 부분은 블록에 없음
 */

/** 줄 칸의 색 구분. same 은 강조 없음, filler 는 줄 높이를 맞추려고 넣은 빈 줄 */
export const TONE = { SAME: 'same', DEL: 'del', ADD: 'add', CHG: 'chg', FILLER: 'filler' };

/**
 * 본문을 줄 배열로. \r\n 은 \n 으로 정리합니다. 빈 본문은 서버(Java split)와 같이 빈 줄 한 개로 셉니다
 * (줄 수가 서버와 다르면 diffJson 의 줄 번호가 어긋납니다). 문자열이 아니면 줄이 없는 것으로 봅니다
 */
export function splitLines(text) {
  if (typeof text !== 'string') return [];
  return text.replace(/\r\n?/g, '\n').split('\n');
}

const filler = () => ({ no: null, text: '', tone: TONE.FILLER });
const cell = (index, lines, tone) => ({ no: index + 1, text: lines[index], tone });

/**
 * @param {string} fromText 이전 버전 본문
 * @param {string} toText 이후 버전 본문
 * @param {Array} diffJson 서버가 준 변경 블록
 * @returns {Array<{ key: string, blockIndex: number, type: string, left: object, right: object }>}
 *   blockIndex: 바뀐 블록 번호(0부터), 바뀌지 않은 줄은 -1. left/right: { no, text, tone }
 */
export function buildDiffRows(fromText, toText, diffJson) {
  const from = splitLines(fromText);
  const to = splitLines(toText);
  const blocks = (Array.isArray(diffJson) ? [...diffJson] : []).sort(
    (a, b) => a.fromLine - b.fromLine || a.toLine - b.toLine,
  );

  const rows = [];
  let i = 0; // 왼쪽(이전) 다음에 그릴 줄
  let j = 0; // 오른쪽(이후) 다음에 그릴 줄

  const pushSame = (count) => {
    for (let k = 0; k < count; k += 1) {
      rows.push({
        key: `s${i}-${j}`,
        blockIndex: -1,
        type: 'SAME',
        left: cell(i, from, TONE.SAME),
        right: cell(j, to, TONE.SAME),
      });
      i += 1;
      j += 1;
    }
  };

  blocks.forEach((block, blockIndex) => {
    // 정상 데이터에서는 아래 보정이 아무 일도 하지 않습니다. 서버가 겹치는 블록이나 본문 길이를 넘는 블록을
    // 주더라도 이미 그린 줄을 되돌려 다시 그리거나(줄 번호 중복) 없는 줄을 그리지 않게 시작 위치와 줄 수를 맞춥니다.
    const fromLine = Math.max(i, Math.min(block.fromLine, from.length));
    const toLine = Math.max(j, Math.min(block.toLine, to.length));
    const fromCount = Math.max(0, Math.min(block.fromCount, from.length - fromLine));
    const toCount = Math.max(0, Math.min(block.toCount, to.length - toLine));

    // 블록이 시작하기 전까지는 바뀌지 않은 줄이 좌우 같은 수만큼 이어집니다
    pushSame(Math.max(0, Math.min(fromLine - i, toLine - j)));
    i = fromLine;
    j = toLine;

    const leftTone = block.type === 'DELETE' ? TONE.DEL : TONE.CHG;
    const rightTone = block.type === 'INSERT' ? TONE.ADD : TONE.CHG;
    const height = Math.max(fromCount, toCount); // 짧은 쪽은 빈 줄로 채워 높이를 맞춥니다
    for (let k = 0; k < height; k += 1) {
      rows.push({
        key: `b${blockIndex}-${k}`,
        blockIndex,
        type: block.type,
        left: k < fromCount ? cell(i + k, from, leftTone) : filler(),
        right: k < toCount ? cell(j + k, to, rightTone) : filler(),
      });
    }
    i += fromCount;
    j += toCount;
  });

  // 마지막 블록 뒤에 남은 줄
  pushSame(Math.min(from.length - i, to.length - j));
  return rows;
}

/** 블록마다 처음 나오는 행의 위치 (이전 변경·다음 변경 이동에 씁니다) */
export function firstRowOfBlocks(rows) {
  const firsts = [];
  rows.forEach((row, index) => {
    if (row.blockIndex >= 0 && firsts[row.blockIndex] === undefined) firsts[row.blockIndex] = index;
  });
  return firsts;
}
