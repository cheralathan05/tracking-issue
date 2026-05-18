import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_app/chat")({
  component: () => (
    <div className="mx-auto max-w-2xl rounded-xl border border-dashed border-border bg-card p-12 text-center shadow-card">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
        <MessageSquare className="h-5 w-5" />
      </div>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Chat Support</h1>
      <p className="mt-1 text-muted-foreground">
        Open a complaint to message its assigned officer directly.
      </p>
    </div>
  ),
});
