import { createFileRoute } from '@tanstack/react-router'
import { ChatWorkspace } from '@/components/chat'
import NeoChatHero from '@/components/chat/NeoChatHero'
import { useState } from 'react'

export const Route = createFileRoute('/officer/chat')({
  head: () => ({ meta: [{ title: 'Officer Chat — Field Operations' }] }),
  component: OfficerChat,
})

function OfficerChat() {
  const [showHero, setShowHero] = useState(true)

  const handleQuickAction = (action: string) => {
    console.log('Officer quick action:', action)
    setShowHero(false)
  }

  return (
    <div className="flex min-h-dvh w-full flex-col overflow-x-hidden overflow-y-auto bg-[#040813] text-white">
      {showHero ? (
        <NeoChatHero
          title="Field Operations Communication"
          placeholder="Check assignments, updates, and escalations..."
          onQuickAction={handleQuickAction}
          actionButtons={[
            { id: 'assignments', label: 'View Assignments', icon: '📋' },
            { id: 'message', label: 'Send Update', icon: '💬' },
            { id: 'escalate', label: 'Escalate Issue', icon: '⬆️' },
            { id: 'tracking', label: 'Track Progress', icon: '📍' },
            { id: 'more', label: 'More Options', icon: '⋯' },
          ]}
        />
      ) : (
        <div className="flex-1 min-h-0">
          <ChatWorkspace view="assigned" workspaceTitle="Field Operations Communication Workspace" />
        </div>
      )}
    </div>
  )
}
