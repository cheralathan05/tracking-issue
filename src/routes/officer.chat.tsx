import { createFileRoute } from '@tanstack/react-router'
import { ChatWorkspace } from '@/components/chat'

export const Route = createFileRoute('/officer/chat')({
  head: () => ({ meta: [{ title: 'Officer Chat — Field Operations' }] }),
  component: OfficerChat,
})

function OfficerChat() {
  return (
    <div className="h-full min-h-0 w-full overflow-hidden bg-[#040813] text-white">
      <div className="px-4 pt-6">
        <h1 className="text-2xl font-black">Field Operations Communication Workspace</h1>
        <p className="text-sm text-slate-400">Officer realtime workspace for assigned complaints, escalations, and AI assistance.</p>
      </div>
      <div className="h-[calc(100%-72px)]">
        <ChatWorkspace view="assigned" workspaceTitle="Field Operations Communication Workspace" />
      </div>
    </div>
  )
}
