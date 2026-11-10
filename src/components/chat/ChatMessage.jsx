// 소유: WJH
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

export default function ChatMessage({ role, content, sources = [], masked = false, streaming = false }) {
    const isUser = role === 'user';

    let body = content;
    if (masked) {
        body = '이 답변은 현재 볼 수 없습니다';
    }
    else if (streaming && !content) {
        body = '답변을 찾는 중…';
    }
    const waiting = streaming && !content;

    // 말풍선 색: 질문은 초록, 답변은 연한 초록, 답변 대기는 회색, 가려진 답변은 노란색 (Figma 화면 상태 모음)
    let tone = 'bg-soft text-ink';
    if (isUser) tone = 'bg-brand text-white';
    else if (masked) tone = 'bg-warn text-warn-ink';
    else if (waiting) tone = 'bg-th text-muted';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-3xl px-4 py-3 text-body whitespace-pre-wrap break-words ${tone}`}>
                <p>{body}</p>

                {!masked && sources.length > 0 && (
                    <ul className="mt-3 flex flex-col gap-2">
                        {sources.map((source, index) => (
                            <li
                                key={`${source.documentId}-${source.versionNo}-${index}`}
                                className="max-w-full self-start rounded-xl border border-line bg-white px-3.5 py-2.5 text-label"
                            >
                                <p className="font-medium text-brand">
                                    {`[${index + 1}] `}
                                    <Link
                                        to={`/documents/${source.documentId}`}
                                        className="inline-flex min-h-11 min-w-11 items-center font-bold text-brand underline md:min-h-0 md:min-w-0"
                                    >
                                        {source.documentName}
                                    </Link>
                                    {` · v${source.versionNo}`}
                                    {source.pageNumber != null && ` · ${source.pageNumber}쪽`}
                                </p>
                                {/* 인용 조각은 따옴표를 CSS 로 붙여 글자 내용(DOM)은 그대로 둡니다 */}
                                <p className={`mt-1 text-muted before:content-['"'] after:content-['"']`}>{source.chunkText}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

ChatMessage.propTypes = {
    role: PropTypes.oneOf(['user', 'assistant']).isRequired,
    content: PropTypes.string.isRequired,
    sources: PropTypes.arrayOf(
        PropTypes.shape({
            documentId: PropTypes.number.isRequired,
            documentName: PropTypes.string.isRequired,
            versionNo: PropTypes.number.isRequired,
            pageNumber: PropTypes.number,
            chunkText: PropTypes.string.isRequired,
        })
    ),
    masked: PropTypes.bool,
    streaming: PropTypes.bool,
};