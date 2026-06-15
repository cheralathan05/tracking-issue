import { createFileRoute } from '@tanstack/react-router'
import { ChatWorkspace } from '@/components/chat'

export const Route = createFileRoute('/officer/chat')({
  head: () => ({ meta: [{ title: 'Officer Chat — Field Operations' }] }),
  component: OfficerChat,
})

function OfficerChat() {
  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-[#040813] text-white">
      <div className="flex-1 min-h-0">
        <ChatWorkspace view="assigned" workspaceTitle="Field Operations Communication Workspace" />
      </div>
    </div>
  )
}
