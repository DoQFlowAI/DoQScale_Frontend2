// 소유: WJH (채팅 UI)
import ChatInterface from '../components/chat/ChatInterface';

export default function DashboardPage() {
  return (
    <div className="flex h-full min-h-0 flex-col px-4 py-4 md:px-8 md:py-7">
      {/* Figma: 제목 아래에 구분선이 있는 흰 카드 (질의응답 화면) */}
      <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 rounded-3xl bg-white p-5 md:px-7">
        <h2 className="border-b border-line pb-4 text-heading font-bold text-ink">질의응답</h2>
        <ChatInterface />
      </section>
    </div>
  );
}
