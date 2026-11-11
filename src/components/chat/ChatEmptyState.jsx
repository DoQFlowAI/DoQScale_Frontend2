// 소유: WJH (채팅 첫 화면, 작성: 세진)
import PropTypes from 'prop-types';

const LEADER_STEPS = [
    { title: '문서 만들기', text: "사이드바 아래 '+ 문서 만들기'로 사내 문서를 올리세요. 버전별로 관리되고 AI 답변의 근거가 돼요." },
    { title: '팀원 초대하기', text: '문서는 초대받은 사람만 볼 수 있어요. 문서 화면에서 함께 볼 팀원을 초대하세요.' },
    { title: 'AI에게 질문하기', text: '문서가 준비되면 여기서 질문하세요. 문서 근거와 함께 답해 드려요.' },
];

const MEMBER_STEPS = [
    { title: '초대 수락하기', text: "오른쪽 위 '초대 알림'에서 받은 초대를 확인하고 수락하세요." },
    { title: '문서 열람하기', text: '수락한 문서는 사이드바 목록에 생겨요. 버전별 변경 내역도 볼 수 있어요.' },
    { title: 'AI에게 질문하기', text: '궁금한 내용을 물어보면 문서 근거와 함께 답해 드려요.' },
];

function exampleQuestions(documentName) {
    if (!documentName) {
        return ['이 문서의 핵심 내용을 요약해줘', '최신 버전에서 바뀐 부분 알려줘'];
    }
    return [
        `${documentName} 핵심 내용 요약해줘`,
        `${documentName} 최신 버전에서 바뀐 부분 알려줘`,
        `${documentName}에서 꼭 지켜야 할 내용이 뭐야?`,
    ];
}

/** 질의응답 첫 화면: 문서가 없으면 직급별 시작 가이드, 있으면 예시 질문 */
export default function ChatEmptyState({ hasDocuments, isLeader = false, documentName = '', onPickQuestion }) {
    if (hasDocuments) {
        return (
            <div className="m-auto flex w-full max-w-3xl flex-col items-center gap-6 px-2 py-6 text-center">
                <div className="flex flex-col gap-2">
                    <h3 className="text-display font-bold text-ink">무엇이 궁금하세요?</h3>
                    <p className="text-body text-muted">아래 예시를 누르면 입력창에 바로 들어가요</p>
                </div>
                <ul className="flex flex-wrap justify-center gap-2.5">
                    {exampleQuestions(documentName).map((q) => (
                        <li key={q}>
                            <button
                                type="button"
                                onClick={() => onPickQuestion(q)}
                                className="min-h-11 rounded-full border border-line-soft bg-th px-4 text-label text-ink transition-colors hover:border-brand hover:bg-soft"
                            >
                                {q}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    const steps = isLeader ? LEADER_STEPS : MEMBER_STEPS;

    return (
        <div className="m-auto flex w-full max-w-4xl flex-col items-center gap-6 px-2 py-6">
            <div className="flex flex-col gap-2 text-center">
                <h3 className="text-display font-bold text-ink">DoQFlow AI 시작하기</h3>
                <p className="text-body text-muted">문서를 바탕으로 AI가 답해 드려요. 아래 순서대로 시작해 보세요.</p>
            </div>
            <ol className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
                {steps.map((step, i) => {
                    const current = i === 0;
                    return (
                        <li
                            key={step.title}
                            className={`flex flex-col gap-3 rounded-btn border p-5 ${
                                current ? 'border-brand bg-white' : 'border-line bg-white'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span
                                    aria-hidden="true"
                                    className={`flex h-8 w-8 items-center justify-center rounded-full text-label font-bold ${
                                        current ? 'bg-brand text-white' : 'bg-chip text-chip-ink'
                                    }`}
                                >
                                    {i + 1}
                                </span>
                                {current ? (
                                    <span className="rounded-full bg-chip px-2.5 py-0.5 text-caption font-medium text-chip-ink">지금 할 일</span>
                                ) : null}
                            </div>
                            <h4 className="text-body font-bold text-ink">
                                <span className="sr-only">{i + 1}단계: </span>
                                {step.title}
                            </h4>
                            <p className="text-label leading-6 text-muted">{step.text}</p>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

ChatEmptyState.propTypes = {
    hasDocuments: PropTypes.bool.isRequired,
    isLeader: PropTypes.bool,
    documentName: PropTypes.string,
    onPickQuestion: PropTypes.func.isRequired,
};
