import { createFileRoute } from "@tanstack/react-router";
import { ChatWorkspace } from "@/components/chat";

export const Route = createFileRoute("/_app/chat")({
  head: () => ({ meta: [{ title: "Chat — Civic Bridge Flow" }] }),
  component: CitizenChat,
});

function CitizenChat() {
  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-[#040813] text-white">
      <div className="flex-1 min-h-0">
        <ChatWorkspace view="citizen" workspaceTitle="Complaint Communication Workspace" />
      </div>
    </div>
  );
}
