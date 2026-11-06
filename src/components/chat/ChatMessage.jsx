import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

function Source({ source }) {
  const { documentId, documentName, versionNo, pageNumber, chunkText } = source;
  // pageNumber 가 없으면(DOCX 등) 쪽 표시를 뺀다
  const hasPage = pageNumber !== null && pageNumber !== undefined && pageNumber !== '';
  const title = [`v${versionNo}`, hasPage ? `${pageNumber}쪽` : null].filter(Boolean).join(' · ');
  return (
    <li className="rounded-xl border border-line bg-white px-3 py-2">
      <p className="text-[12px] font-bold text-brand">
        {documentId != null ? (
          <Link to={`/documents/${documentId}`} className="hover:underline">
            {documentName}
          </Link>
        ) : (
          documentName
        )}
        {title ? ` · ${title}` : ''}
      </p>
      {chunkText ? <p className="mt-0.5 break-words text-[12px] text-muted">&quot;{chunkText}&quot;</p> : null}
    </li>
  );
}

Source.propTypes = {
  source: PropTypes.shape({
    documentId: PropTypes.number,
    documentName: PropTypes.string,
    versionNo: PropTypes.number,
    pageNumber: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    chunkText: PropTypes.string,
  }).isRequired,
};

/** 텍스트로만 렌더링한다 (AI 답변·인용 조각을 HTML 로 넣지 않는다) */
export default function ChatMessage({ role, content, sources = [], masked = false, streaming = false, error = false }) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-[20px] bg-brand px-4 py-2.5 text-[15px] text-white">
          {content}
        </p>
      </div>
    );
  }

  let body;
  if (masked) {
    body = <p className="text-[15px] text-muted">이 답변은 현재 볼 수 없습니다</p>;
  } else if (streaming && !content) {
    body = (
      <p role="status" className="text-[15px] text-muted">
        답변을 찾는 중…
      </p>
    );
  } else {
    body = (
      <p className={`whitespace-pre-wrap break-words text-[15px] ${error ? 'text-danger' : 'text-ink-2'}`}>{content}</p>
    );
  }

  return (
    <div className="flex justify-start">
      <div className={`flex max-w-[92%] flex-col gap-2.5 rounded-[20px] px-4 py-3 ${error ? 'bg-danger-bg' : 'bg-soft'}`}>
        {body}
        {!masked && sources.length > 0 ? (
          <ul className="flex flex-col gap-1.5" aria-label="근거">
            {sources.map((s, i) => (
              <Source key={`${s.documentId}-${s.versionNo}-${i}`} source={s} />
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

ChatMessage.propTypes = {
  role: PropTypes.oneOf(['user', 'assistant']).isRequired,
  content: PropTypes.string.isRequired,
  sources: PropTypes.array,
  masked: PropTypes.bool,
  streaming: PropTypes.bool,
  error: PropTypes.bool,
};
