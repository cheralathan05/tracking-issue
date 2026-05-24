import { createFileRoute } from '@tanstack/react-router'
import { ChatWorkspace } from '@/components/chat'

export const Route = createFileRoute('/_app/chat')({
  component: ChatPage,
})

function ChatPage() {
  return (
    <div className="w-full h-screen">
      <ChatWorkspace />
    </div>
  )
}
