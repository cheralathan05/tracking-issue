import { createFileRoute, redirect } from "@tanstack/react-router";
import { CitizenLayout } from "@/components/citizen/CitizenLayout";
import { ensureAuthSession, getProfile } from "@/lib/auth-api";

export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") {
      // During server-side rendering we cannot access browser cookies.
      // Skip auth redirects here and let the client attempt session restore.
      return;
    }

    const session = await ensureAuthSession();

    if (!session) {
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

    return {
      profile,
    };
  },
  component: CitizenApp,
});

function CitizenApp() {
  const { profile } = Route.useRouteContext() as {
    profile: Awaited<ReturnType<typeof getProfile>> | null;
  };

  return <CitizenLayout initialUser={profile?.data?.user ?? null} />;
}
