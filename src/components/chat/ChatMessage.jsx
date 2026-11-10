// 소유: WJH
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import chatbotIdle from '../../assets/chatbot-no-bubble.png';
import chatbotTyping from '../../assets/chatbot-typing-0-1-2-3.gif';

export default function ChatMessage({ role, content, sources = [], masked = false, streaming = false }) {
    const isUser = role === 'user';

    let body = content;
    if (masked) {
        body = '이 답변은 현재 볼 수 없습니다';
    }
    else if (streaming && !content) {
        body = '답변을 찾는 중…';
    }
    const isNotice = masked || (streaming && !content);

    return (
        <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && (
                <img
                    src={streaming ? chatbotTyping : chatbotIdle}
                    alt={streaming ? '챗봇 답변 중' : '챗봇'}
                    className="h-22 w-22 shrink-0 object-contain"
                />
            )}
            <div
                className={`max-w-[85%] rounded-btn px-4 py-3 text-body whitespace-pre-wrap break-words ${isUser ? 'bg-brand text-white' : 'mb-5 border border-line bg-white text-ink'
                    }`}
            >
                <p className={isNotice ? 'text-muted' : ''}>{body}</p>

                {!masked && sources.length > 0 && (
                    <ul className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
                        {sources.map((source, index) => (
                            <li key={`${source.documentId}-${source.versionNo}-${index}`} className="text-label">
                                <p className="text-muted">
                                    <Link to={`/documents/${source.documentId}`} className="font-medium text-brand underline">
                                        {source.documentName}
                                    </Link>
                                    {` · v${source.versionNo}`}
                                    {source.pageNumber != null && ` · ${source.pageNumber}쪽`}
                                </p>
                                <p className="mt-1 text-ink-2">{source.chunkText}</p>
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