import { createFileRoute } from "@tanstack/react-router";
import { CitizenChatWorkspace } from "@/components/citizen/CitizenChatWorkspace";

export const Route = createFileRoute("/_app/chat")({
  head: () => ({ meta: [{ title: "Citizen Chat Center — Civic Bridge Flow" }] }),
  component: CitizenChatRoute,
});

function CitizenChatRoute() {
  const { profile } = Route.useRouteContext() as {
    profile?: { data?: { user?: { id?: string; fullName?: string; email?: string; role?: string } } } | null;
  };

  return <CitizenChatWorkspace profile={profile?.data?.user ?? null} />;
}
