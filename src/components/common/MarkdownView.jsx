// 소유: JJW (마크다운 뷰어)
import { useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * 인라인 마크다운(코드, 링크, 볼드, 이탤릭, 취소선)을 React 엘리먼트로 변환합니다.
 */
function renderInline(text, keyPrefix = 'inline') {
  if (!text) return null;

  // 정규식 매칭: code, link, bold, italic, del
  // 1: `code`
  // 2, 3: [linkText](url)
  // 4: **bold** or __bold__
  // 5: *italic* or _italic_
  // 6: ~~del~~
  const tokenRegex = /(`([^`]+)`) blueprint|(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*|__([^_]+)__/g;
  // 더 안전하고 정밀하게 순차 파서 작성
  const elements = [];
  let remaining = text;
  let idx = 0;

  // 종합 정규식
  const inlineRegex =
    /(`(?<inlineCode>[^`]+)`)|(\[(?<linkText>[^\]]+)\]\((?<linkUrl>[^)]+)\))|(\*\*(?<boldText>[^*]+)\*\*|__(?<boldTextAlt>[^_]+)__)|(~~(?<delText>[^~]+)~~)|(\*(?<italicText>[^*]+)\*|_(?<italicTextAlt>[^_]+)_)/g;

  let lastIndex = 0;
  let match;

  while ((match = inlineRegex.exec(text)) !== null) {
    // 매치 이전의 일반 텍스트
    if (match.index > lastIndex) {
      elements.push(
        <span key={`${keyPrefix}-txt-${idx++}`}>
          {text.slice(lastIndex, match.index)}
        </span>
      );
    }

    const {
      inlineCode,
      linkText,
      linkUrl,
      boldText,
      boldTextAlt,
      delText,
      italicText,
      italicTextAlt,
    } = match.groups || {};

    if (inlineCode !== undefined) {
      elements.push(
        <code
          key={`${keyPrefix}-code-${idx++}`}
          className="rounded bg-th px-1.5 py-0.5 font-mono text-xs font-semibold text-brand"
        >
          {inlineCode}
        </code>
      );
    } else if (linkText !== undefined && linkUrl !== undefined) {
      elements.push(
        <a
          key={`${keyPrefix}-a-${idx++}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-brand underline decoration-brand/50 underline-offset-2 transition-colors hover:text-brand-hover hover:decoration-brand"
        >
          {linkText}
        </a>
      );
    } else if (boldText !== undefined || boldTextAlt !== undefined) {
      elements.push(
        <strong key={`${keyPrefix}-b-${idx++}`} className="font-bold text-ink">
          {boldText ?? boldTextAlt}
        </strong>
      );
    } else if (delText !== undefined) {
      elements.push(
        <del key={`${keyPrefix}-del-${idx++}`} className="text-muted line-through">
          {delText}
        </del>
      );
    } else if (italicText !== undefined || italicTextAlt !== undefined) {
      elements.push(
        <em key={`${keyPrefix}-em-${idx++}`} className="italic">
          {italicText ?? italicTextAlt}
        </em>
      );
    }

    lastIndex = inlineRegex.lastIndex;
  }

  // 남은 텍스트
  if (lastIndex < text.length) {
    elements.push(
      <span key={`${keyPrefix}-tail-${idx++}`}>
        {text.slice(lastIndex)}
      </span>
    );
  }

  return elements.length > 0 ? elements : text;
}

/**
 * 텍스트를 마크다운 블록 배열로 파싱합니다.
 */
function parseMarkdownToBlocks(content) {
  if (typeof content !== 'string') return [];
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 1. 코드 블록: ```lang
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const codeLines = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1; // 닫는 ``` 건너뜀
      blocks.push({
        type: 'code',
        lang,
        content: codeLines.join('\n'),
      });
      continue;
    }

    // 2. 구분선: --- or *** or ___
    if (/^(\s*[-*_]\s*){3,}$/.test(line)) {
      blocks.push({ type: 'hr' });
      i += 1;
      continue;
    }

    // 3. 헤딩: # ~ ######
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2],
      });
      i += 1;
      continue;
    }

    // 4. 표 (Table): | a | b |
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i += 1;
      }
      if (tableLines.length >= 2 && /^\|(\s*:?-+:?\s*\|)+$/.test(tableLines[1])) {
        const headerCols = tableLines[0]
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim());
        const bodyRows = tableLines.slice(2).map((r) =>
          r
            .slice(1, -1)
            .split('|')
            .map((c) => c.trim())
        );
        blocks.push({
          type: 'table',
          headers: headerCols,
          rows: bodyRows,
        });
        continue;
      }
      // 표 형식이 아니면 아래 일반 로직으로 진행
      i -= tableLines.length; // 롤백
    }

    // 5. 인용구: > quote
    if (line.trim().startsWith('>')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i += 1;
      }
      blocks.push({
        type: 'blockquote',
        text: quoteLines.join('\n'),
      });
      continue;
    }

    // 6. 목록 (ul / ol)
    const ulMatch = line.match(/^(\s*)([-*+])\s+(.*)$/);
    const olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (ulMatch || olMatch) {
      const listType = ulMatch ? 'ul' : 'ol';
      const items = [];
      while (i < lines.length) {
        const currentLine = lines[i];
        const currentUl = currentLine.match(/^(\s*)([-*+])\s+(.*)$/);
        const currentOl = currentLine.match(/^(\s*)(\d+)\.\s+(.*)$/);
        if (listType === 'ul' && currentUl) {
          items.push({ indent: currentUl[1].length, text: currentUl[3] });
          i += 1;
        } else if (listType === 'ol' && currentOl) {
          items.push({ indent: currentOl[1].length, text: currentOl[3] });
          i += 1;
        } else {
          break;
        }
      }
      blocks.push({
        type: listType,
        items,
      });
      continue;
    }

    // 7. 빈 줄
    if (!line.trim()) {
      i += 1;
      continue;
    }

    // 8. 일반 문단 (Paragraph)
    const paraLines = [];
    while (i < lines.length && lines[i].trim() && !lines[i].trim().startsWith('```') && !lines[i].trim().startsWith('#') && !lines[i].trim().startsWith('>') && !/^(\s*[-*_]\s*){3,}$/.test(lines[i])) {
      paraLines.push(lines[i]);
      i += 1;
    }
    blocks.push({
      type: 'paragraph',
      text: paraLines.join('\n'),
    });
  }

  return blocks;
}

/**
 * 마크다운 렌더러 컴포넌트
 */
export default function MarkdownView({ content, className = '' }) {
  const blocks = useMemo(() => parseMarkdownToBlocks(content), [content]);

  if (!content) return null;

  return (
    <div className={`markdown-view flex flex-col gap-2.5 break-words text-body leading-7 text-ink-2 ${className}`}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'heading': {
            const Tag = `h${block.level}`;
            const styles = {
              1: 'mt-6 mb-2 border-b border-line pb-2 text-2xl font-bold text-ink',
              2: 'mt-5 mb-2 border-b border-line/60 pb-1.5 text-xl font-bold text-ink',
              3: 'mt-4 mb-1.5 text-lg font-bold text-ink',
              4: 'mt-3 mb-1 text-base font-bold text-ink',
              5: 'mt-2.5 mb-1 text-sm font-bold text-ink',
              6: 'mt-2 mb-0.5 text-sm font-bold text-muted uppercase tracking-wider',
            }[block.level] || 'text-base font-bold text-ink';

            return (
              <Tag key={idx} className={styles}>
                {renderInline(block.text, `h-${idx}`)}
              </Tag>
            );
          }

          case 'paragraph': {
            // 줄바꿈 보존: \n을 <br />로 렌더링
            const lines = block.text.split('\n');
            return (
              <p key={idx} className="my-1 leading-7">
                {lines.map((l, lineIdx) => (
                  <span key={lineIdx}>
                    {renderInline(l, `p-${idx}-${lineIdx}`)}
                    {lineIdx < lines.length - 1 ? <br /> : null}
                  </span>
                ))}
              </p>
            );
          }

          case 'code':
            return (
              <div key={idx} className="my-2.5 overflow-hidden rounded-xl border border-line bg-th">
                {block.lang ? (
                  <div className="border-b border-line/60 bg-soft px-3.5 py-1 text-xs font-mono font-medium text-muted">
                    {block.lang}
                  </div>
                ) : null}
                <pre className="thin-scroll overflow-x-auto p-4 font-mono text-xs leading-relaxed text-ink">
                  <code>{block.content}</code>
                </pre>
              </div>
            );

          case 'blockquote':
            return (
              <blockquote
                key={idx}
                className="my-2 rounded-r-xl border-l-4 border-brand bg-soft/50 py-2.5 pl-4 pr-3 text-body italic text-ink-2"
              >
                {block.text.split('\n').map((l, qIdx) => (
                  <p key={qIdx} className="leading-6">
                    {renderInline(l, `q-${idx}-${qIdx}`)}
                  </p>
                ))}
              </blockquote>
            );

          case 'ul':
            return (
              <ul key={idx} className="my-1.5 list-disc space-y-1 pl-6">
                {block.items.map((item, itemIdx) => {
                  // 체크박스 마크다운 지원: [ ] or [x]
                  const checkMatch = item.text.match(/^\[([ xX])\]\s*(.*)$/);
                  if (checkMatch) {
                    const checked = checkMatch[1].toLowerCase() === 'x';
                    return (
                      <li key={itemIdx} className="list-none -ml-4 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          readOnly
                          className="h-4 w-4 rounded border-line text-brand accent-brand"
                        />
                        <span>{renderInline(checkMatch[2], `ul-chk-${idx}-${itemIdx}`)}</span>
                      </li>
                    );
                  }
                  return (
                    <li key={itemIdx} style={{ marginLeft: `${item.indent * 8}px` }}>
                      {renderInline(item.text, `ul-${idx}-${itemIdx}`)}
                    </li>
                  );
                })}
              </ul>
            );

          case 'ol':
            return (
              <ol key={idx} className="my-1.5 list-decimal space-y-1 pl-6">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} style={{ marginLeft: `${item.indent * 8}px` }}>
                    {renderInline(item.text, `ol-${idx}-${itemIdx}`)}
                  </li>
                ))}
              </ol>
            );

          case 'table':
            return (
              <div key={idx} className="my-3 overflow-x-auto rounded-xl border border-line">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-line bg-th">
                      {block.headers.map((h, hIdx) => (
                        <th key={hIdx} className="px-3.5 py-2.5 font-bold text-ink">
                          {renderInline(h, `th-${idx}-${hIdx}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line bg-white">
                    {block.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="transition-colors hover:bg-soft/40">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3.5 py-2 text-ink-2">
                            {renderInline(cell, `td-${idx}-${rIdx}-${cIdx}`)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case 'hr':
            return <hr key={idx} className="my-4 border-t border-line" />;

          default:
            return null;
        }
      })}
    </div>
  );
}

MarkdownView.propTypes = {
  content: PropTypes.string,
  className: PropTypes.string,
};
