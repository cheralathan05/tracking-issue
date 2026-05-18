import { createFileRoute, redirect } from "@tanstack/react-router";
import { CitizenLayout } from "@/components/citizen/CitizenLayout";
import { ensureAuthSession } from "@/lib/auth-api";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ location }) => {
    const token = await ensureAuthSession();

    if (!token) {
      throw redirect({
        to: "/login",
        search: { returnTo: location.pathname },
        replace: true,
      });
    }
  },
  component: CitizenLayout,
});
