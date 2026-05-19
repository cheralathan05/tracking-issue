import { createFileRoute, redirect } from "@tanstack/react-router";
import { CitizenLayout } from "@/components/citizen/CitizenLayout";
import { ensureAuthSession, getProfile } from "@/lib/auth-api";

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

    const profile = await getProfile().catch(() => null);
    const role = String(profile?.data?.user?.role ?? "");

    if (role && role !== "citizen") {
      throw redirect({
        to: "/admin/dashboard",
        replace: true,
      });
    }
  },
  component: CitizenLayout,
});
