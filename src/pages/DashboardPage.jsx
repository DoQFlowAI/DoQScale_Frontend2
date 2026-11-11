// 소유: WJH
import { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Icon from '../components/common/Icon';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ChatInterface from '../components/chat/ChatInterface';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { LEADER_RANK } from '../utils/format';

const EXAMPLE_QUESTIONS = [
  {
    question: '출장비 정산 지침 핵심 내용 요약해줘',
    exampleAnswer: '출장비를 정산하려면 교통비와 숙박비 등 출장에 사용한 비용을 항목별로 정리하세요. 출장 목적과 일정을 적고 영수증을 첨부해 승인 담당자에게 제출하면 됩니다. 비용 한도와 제출 기한은 회사의 최신 출장비 정산 지침을 확인하세요.',
  },
  {
    question: '인사 규정 최신 버전에서 바뀐 부분 알려줘',
    exampleAnswer: '이 예시에서는 휴가 신청 절차와 재택근무 승인 기준이 바뀌었어요. 휴가 신청은 전자결재로 접수하고, 재택근무는 팀장에게 사전에 승인을 받도록 절차를 구체화했습니다. 실제 변경 사항과 시행일은 문서의 버전 비교에서 확인할 수 있어요.',
  },
  {
    question: '연차는 며칠 전에 신청해야 해?',
    exampleAnswer: '예시 규정에서는 연차 사용일 기준 3영업일 전까지 신청하도록 안내합니다. 갑자기 연차가 필요한 경우에는 팀장에게 먼저 알리고 신청서를 제출하는 방식이에요. 실제 신청 기한은 회사의 최신 인사 규정을 확인하세요.',
  },
  {
    question: '외부 반출이 금지된 자료는 뭐야?',
    exampleAnswer: '고객 개인정보, 미공개 재무 자료, 사내 소스 코드와 비밀로 분류된 문서가 대표적인 예시입니다. 외부 공유가 필요하면 먼저 자료의 보안 등급을 확인하고 담당자에게 승인 절차를 문의하세요.',
  },
];

export default function DashboardPage() {
  const { documents = [], loadingDocuments = false, documentsLoading = false, openCreateModal } = useOutletContext() ?? {};
  const isDocLoading = loadingDocuments || documentsLoading;
  const navigate = useNavigate();
  const [inviteGuideOpen, setInviteGuideOpen] = useState(false);

  const messages = useChatStore((s) => s.messages);
  const clearChat = useChatStore((s) => s.clear);
  const user = useAuthStore((s) => s.user);
  const isLeader = user?.rankLevel === LEADER_RANK;
  const hasMessages = messages.length > 0;
  const hasDocs = documents.length > 0;

  const handleAskChanges = (doc) => {
    useChatStore.getState().setPendingQuestion(`${doc.name} 최신 버전에서 변경된 내용을 알려줘`);
  };

  if (isDocLoading && documents.length === 0) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // 대화가 없는 초기 상태 (문서 유무별 화면)
  const emptySlotContent = !hasDocs ? (
    isLeader ? (
      /* 팀장급 문서 없을 때 (사진 1번) */
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-6">
        <div className="text-center">
          <h1 className="text-display font-bold text-ink">DoQFlow AI 시작하기</h1>
          <p className="mt-3 text-body leading-relaxed text-ink-2">
            문서를 올리면 AI가 그 문서 내용을 근거로 답해 드려요.
            <br />
            아래 순서대로 시작해 보세요.
          </p>
        </div>

        <div className="mt-10 grid w-full max-w-4xl grid-cols-1 gap-5 md:grid-cols-3">
          {/* 1 문서 만들기 */}
          <div className="flex flex-col justify-between rounded-2xl border border-line bg-white p-6 shadow-card transition hover:border-brand/40">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-caption font-bold text-white">
                  1
                </span>
                <Icon name="docPlus" className="h-6 w-6 text-brand" />
              </div>
              <h2 className="mt-4 text-title font-bold text-ink">문서 만들기</h2>
              <p className="mt-2 text-caption leading-relaxed text-ink-2">
                사내 문서를 올리면 버전별로 관리되고, AI가 질문에 답할 때 근거로 써요.
              </p>
            </div>
            <Button className="mt-6 w-fit px-5" onClick={openCreateModal}>
              문서 만들기
            </Button>
          </div>

          {/* 2 팀원 초대하기 */}
          <div className="flex flex-col justify-between rounded-2xl border border-line bg-white p-6 shadow-card transition hover:border-brand/40">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-caption font-bold text-white">
                  2
                </span>
                <Icon name="userPlus" className="h-6 w-6 text-brand" />
              </div>
              <h2 className="mt-4 text-title font-bold text-ink">팀원 초대하기</h2>
              <p className="mt-2 text-caption leading-relaxed text-ink-2">
                문서는 초대받은 사람만 볼 수 있어요. 함께 볼 팀원을 문서에 초대하세요.
              </p>
            </div>
            <Button variant="outline" className="mt-6 w-fit px-4" onClick={() => setInviteGuideOpen(true)}>
              초대 방법 보기
            </Button>
          </div>

          {/* 3 AI에게 질문하기 */}
          <div className="flex flex-col justify-between rounded-2xl border border-dashed border-line bg-[#fcfcfc] p-6 opacity-75">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-line text-caption font-bold text-muted">
                  3
                </span>
                <Icon name="chat" className="h-6 w-6 text-muted" />
              </div>
              <h2 className="mt-4 text-title font-bold text-muted">AI에게 질문하기</h2>
              <p className="mt-2 text-caption leading-relaxed text-muted">
                “이번 개정에서 뭐가 바뀌었어?”처럼 물어보면 문서 근거와 함께 답해요.
              </p>
            </div>
            <p className="mt-6 text-caption font-medium text-muted">문서를 추가하면 열려요</p>
          </div>
        </div>
      </div>
    ) : (
      /* 사원급 문서 없을 때 (첨부 이미지) */
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-6">
        <div className="text-center">
          <h1 className="text-display font-bold text-ink">DoQFlow AI 시작하기</h1>
          <p className="mt-3 text-body leading-relaxed text-ink-2">
            문서를 바탕으로 AI가 답해 드려요. 아래 순서대로 시작해 보세요.
          </p>
        </div>

        <div className="mt-10 grid w-full max-w-4xl grid-cols-1 gap-5 md:grid-cols-3">
          {/* 1 초대 수락하기 */}
          <div className="flex flex-col rounded-2xl border border-brand bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-caption font-bold text-white">
                1
              </span>
              <span className="rounded-full bg-[#E5F3EE] px-2.5 py-0.5 text-xs font-semibold text-brand">
                지금 할 일
              </span>
            </div>
            <h2 className="mt-4 text-title font-bold text-ink">초대 수락하기</h2>
            <p className="mt-2 text-caption leading-relaxed text-ink-2">
              오른쪽 위 &apos;초대 알림&apos;에서 받은 초대를 확인하고 수락하세요.
            </p>
          </div>

          {/* 2 문서 열람하기 */}
          <div className="flex flex-col rounded-2xl border border-line bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E5F3EE] text-caption font-bold text-brand">
                2
              </span>
            </div>
            <h2 className="mt-4 text-title font-bold text-ink">문서 열람하기</h2>
            <p className="mt-2 text-caption leading-relaxed text-ink-2">
              수락한 문서는 사이드바 목록에 생겨요. 버전별 변경 내역도 볼 수 있어요.
            </p>
          </div>

          {/* 3 AI에게 질문하기 */}
          <div className="flex flex-col rounded-2xl border border-line bg-white p-6 shadow-card">
            <div className="flex items-center justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E5F3EE] text-caption font-bold text-brand">
                3
              </span>
            </div>
            <h2 className="mt-4 text-title font-bold text-ink">AI에게 질문하기</h2>
            <p className="mt-2 text-caption leading-relaxed text-ink-2">
              궁금한 내용을 물어보면 문서 근거와 함께 답해 드려요.
            </p>
          </div>
        </div>
      </div>
    )
  ) : (
    /* 문서가 있을 때 (사진 3번) */
    <div className="flex min-h-0 flex-1 flex-col items-center justify-start py-6">
      <div className="text-center">
        <h1 className="text-display font-bold text-ink">무엇이 궁금하세요?</h1>
        <p className="mt-2 text-caption text-muted">아래 질문을 누르면 예시 답변을 볼 수 있어요</p>
      </div>

      <div className="mt-8 mb-10 flex w-full max-w-3xl flex-col items-center gap-3">
        <div className="flex flex-wrap justify-center gap-2.5">
          {EXAMPLE_QUESTIONS.map((example) => (
            <button
              key={example.question}
              type="button"
              onClick={() => useChatStore.getState().setPendingQuestion(example)}
              className="rounded-full border border-line bg-white px-4 py-2 text-label text-ink-2 shadow-sm transition hover:border-brand hover:text-brand"
            >
              {example.question}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full max-w-3xl rounded-2xl border border-line bg-white p-6 shadow-card">
        <h2 className="mb-4 text-title font-bold text-ink">최근 업데이트된 문서</h2>
        <div className="divide-y divide-line">
          {documents.slice(0, 5).map((doc) => (
            <div key={doc.documentId} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <span className="rounded-md bg-secondary-bg px-2 py-0.5 text-caption font-semibold text-brand">
                  v{doc.currentVersionNo || 1}
                </span>
                <button
                  type="button"
                  onClick={() => navigate(`/documents/${doc.documentId}`)}
                  className="text-body font-bold text-ink transition hover:text-brand hover:underline"
                >
                  {doc.name}
                </button>
                <span className="text-caption text-muted">새 버전 등록</span>
              </div>
              <button
                type="button"
                onClick={() => handleAskChanges(doc)}
                className="text-label font-medium text-ink-2 transition hover:text-brand hover:underline"
              >
                변경 내용 묻기
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col px-4 py-4 md:px-8 md:py-7">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col rounded-3xl bg-white p-5 md:px-7">
        {hasMessages ? (
          <div className="flex items-center justify-end border-b border-line pb-3 mb-2">
            <Button variant="outline" size="sm" onClick={clearChat}>
              새 대화
            </Button>
          </div>
        ) : null}
        <ChatInterface
          active={true}
          emptySlot={emptySlotContent}
          inputDisabled={!hasDocs}
          placeholder={!hasDocs ? '문서를 먼저 추가하면 질문할 수 있어요' : '질문을 입력하세요'}
        />
      </section>

      {/* 팀원 초대 방법 안내 모달 */}
      <Modal
        open={inviteGuideOpen}
        title="팀원 초대 방법"
        onClose={() => setInviteGuideOpen(false)}
        width="max-w-[460px]"
        footer={
          <Button className="w-full" onClick={() => setInviteGuideOpen(false)}>
            확인
          </Button>
        }
      >
        <div className="flex flex-col gap-3 py-2 text-body text-ink">
          <p className="font-semibold text-brand">문서별 팀원 초대 방법 안내</p>
          <ol className="list-decimal space-y-2 pl-5 text-label text-ink-2">
            <li>
              먼저 <strong>[문서 만들기]</strong> 버튼을 눌러 새 문서를 등록합니다.
            </li>
            <li>
              등록된 문서의 상세 페이지 우측 상단 <strong>열람자 아이콘</strong>(사람 모양)을 클릭합니다.
            </li>
            <li>
              함께 열람할 팀원의 이메일을 입력하여 초대하면 해당 문서를 함께 조회하고 AI 질문을 진행할 수 있습니다.
            </li>
          </ol>
        </div>
      </Modal>
    </div>
  );
}
