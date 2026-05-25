import { createFileRoute } from '@tanstack/react-router'
import { ChatWorkspace } from '@/components/chat'

export const Route = createFileRoute('/_app/chat')({
  component: ChatPage,
})

function ChatPage() {
  return (
    <div className="flex min-h-dvh w-full flex-col overflow-x-hidden overflow-y-auto bg-[#040813] text-white">
      <ChatWorkspace />
    </div>
  )
}
