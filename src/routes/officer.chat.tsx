import { createFileRoute } from '@tanstack/react-router'
import { ChatWorkspace } from '@/components/chat'

export const Route = createFileRoute('/officer/chat')({
  head: () => ({ meta: [{ title: 'Officer Chat — Field Operations' }] }),
  component: OfficerChat,
})

function OfficerChat() {
  return (
    <div className="flex min-h-dvh w-full flex-col overflow-x-hidden overflow-y-auto bg-[#040813] text-white">
      <div className="shrink-0 px-4 pt-6">
        <h1 className="text-2xl font-black">Field Operations Communication Workspace</h1>
        <p className="text-sm text-slate-400">Officer realtime workspace for assigned complaints, escalations, and AI assistance.</p>
      </div>
      <div className="flex-1 min-h-0">
        <ChatWorkspace view="assigned" workspaceTitle="Field Operations Communication Workspace" />
      </div>
    </div>
  )
}
