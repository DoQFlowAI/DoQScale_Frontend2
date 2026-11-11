// 소유: WJH (채팅 UI)
import { useOutletContext } from 'react-router-dom';
import ChatInterface from '../components/chat/ChatInterface';
import ChatEmptyState from '../components/chat/ChatEmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuthStore } from '../store/authStore';
import { LEADER_RANK } from '../utils/format';

export default function DashboardPage() {
  const { documents = [], documentsLoading = false } = useOutletContext() ?? {};
  const user = useAuthStore((s) => s.user);
  const isLeader = user?.rankLevel === LEADER_RANK;

  const hasDocuments = documents.length > 0;
  const firstLoading = documentsLoading && !hasDocuments; // 처음 목록을 받는 중
  const exampleDoc = documents.find((d) => d.currentVersionNo) ?? documents[0];

  const renderEmpty = (fillInput) => {
    if (firstLoading) return <LoadingSpinner />;
    return (
      <ChatEmptyState
        hasDocuments={hasDocuments}
        isLeader={isLeader}
        documentName={exampleDoc?.name ?? ''}
        onPickQuestion={fillInput}
      />
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col px-4 py-4 md:px-8 md:py-7">
      {/* Figma: 제목 아래에 구분선이 있는 흰 카드 (질의응답 화면) */}
      <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 rounded-3xl bg-white p-5 md:px-7">
        <h2 className="border-b border-line pb-4 text-heading font-bold text-ink">질의응답</h2>
        <ChatInterface
          renderEmpty={renderEmpty}
          inputDisabled={!firstLoading && !hasDocuments}
          inputPlaceholder={!firstLoading && !hasDocuments ? '문서가 생기면 질문할 수 있어요' : undefined}
        />
      </section>
    </div>
  );
}
