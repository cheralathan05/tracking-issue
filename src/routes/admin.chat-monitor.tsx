import { createFileRoute } from "@tanstack/react-router";
import { ChatWorkspace } from "@/components/chat";

export const Route = createFileRoute("/admin/chat-monitor")({
  head: () => ({ meta: [{ title: "Chat Monitor — Admin" }] }),
  component: ChatMonitor,
});

function ChatMonitor() {
  return (
    <div className="flex min-h-dvh w-full flex-col overflow-x-hidden overflow-y-auto bg-[#040813] text-white">
      <div className="shrink-0 px-4 pt-6">
        <h1 className="text-2xl font-black">Chat Monitoring & Support</h1>
        <p className="text-sm text-slate-400">Monitor all complaint communications, escalations, and SLA violations. Override assignments and close complaints.</p>
      </div>
      <div className="flex-1 min-h-0">
        <ChatWorkspace variant="admin" view="monitor" workspaceTitle="Chat Monitoring & Support" />
      </div>
    </div>
  );
}
