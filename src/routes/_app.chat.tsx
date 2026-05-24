import { createFileRoute } from '@tanstack/react-router'
import { ChatWorkspace } from '@/components/chat'

export const Route = createFileRoute('/_app/chat')({
  component: ChatPage,
})

function ChatPage() {
  return (
    <div className="h-full min-h-0 w-full overflow-hidden bg-[#040813] text-white">
      <ChatWorkspace />
    </div>
  )
}
