// 소유: WJH (채팅 UI)
import Card from '../components/common/Card';
import ChatInterface from '../components/chat/ChatInterface';

export default function DashboardPage() {
  return (
    <div className="flex h-full min-h-0 flex-col p-4 md:p-8">
      <Card title="질의응답" className="min-h-0 flex-1">
        <ChatInterface />
      </Card>
    </div>
  );
}
