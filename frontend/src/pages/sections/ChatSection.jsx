import { useStore } from '../../store/useStore';
import ChatPanel from '../../components/ChatPanel';

export default function ChatSection() {
  const { analysis } = useStore();
  if (!analysis) return null;

  return (
    <div className="h-full p-3 md:p-4">
      <div className="h-full max-w-3xl mx-auto">
        <ChatPanel />
      </div>
    </div>
  );
}
