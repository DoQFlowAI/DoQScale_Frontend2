import ChatInterface from '../components/chat/ChatInterface';

export default function DashboardPage() {
  return (
    <div className="h-full p-4 md:px-8 md:py-6">
      <section aria-label="질의응답" className="flex h-full min-h-[420px] flex-col rounded-3xl bg-white p-5 md:p-7">
        <ChatInterface />
      </section>
    </div>
  );
}
