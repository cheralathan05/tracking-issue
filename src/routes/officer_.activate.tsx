import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/officer_/activate")({
  head: () => ({ meta: [{ title: "Activate officer invite — Civic Bridge Flow" }] }),
  component: OfficerActivateAlias,
});

function OfficerActivateAlias() {
  const navigate = useNavigate();

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const token = search.get("token") ?? undefined;
    void navigate({ to: "/officer/invite", search: token ? { token } : {} });
  }, [navigate]);

  return null;
}
