import { createFileRoute } from "@tanstack/react-router";
import { ChatWorkspace } from "@/components/chat";
import NeoChatHero from "@/components/chat/NeoChatHero";
import { useState } from "react";

export const Route = createFileRoute("/_app/chat")({
  head: () => ({ meta: [{ title: "Chat — Civic Bridge Flow" }] }),
  component: CitizenChat,
});

function CitizenChat() {
  const [showHero, setShowHero] = useState(true);

  const handleQuickAction = (action: string) => {
    console.log("Citizen quick action:", action);
    setShowHero(false);
  };

  return (
    <div className="flex min-h-dvh w-full flex-col overflow-x-hidden overflow-y-auto bg-[#040813] text-white">
      {showHero ? (
        <NeoChatHero
          title="What Can We Help You With Today?"
          placeholder="Describe your complaint or concern..."
          onQuickAction={handleQuickAction}
          actionButtons={[
            { id: "report", label: "Report Issue", icon: "📋" },
            { id: "message", label: "Message Officer", icon: "💬" },
            { id: "escalate", label: "Escalate", icon: "⬆️" },
            { id: "track", label: "Track Status", icon: "📍" },
            { id: "more", label: "More", icon: "⋯" },
          ]}
        />
      ) : (
        <div className="flex-1 min-h-0">
          <ChatWorkspace view="citizen" workspaceTitle="Complaint Communication Workspace" />
        </div>
      )}
    </div>
  );
}
