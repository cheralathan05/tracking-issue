import { createFileRoute } from '@tanstack/react-router'
import { ChatWorkspace } from '@/components/chat'

export const Route = createFileRoute('/admin/chat')({
  head: () => ({ meta: [{ title: 'Admin Chat — Civic Bridge Flow' }] }),
  component: AdminChat,
})

function AdminChat() {
  return (
    <div className="-m-4 flex min-h-dvh w-[calc(100%+2rem)] flex-col overflow-x-hidden overflow-y-auto bg-[#040813] text-white md:-m-8 md:w-[calc(100%+4rem)]">
      <ChatWorkspace variant="admin" />
    </div>
  )
}
