import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ensureAuthSession } from "@/lib/auth-api";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    const token = await ensureAuthSession();

    if (!token) {
      throw redirect({
        to: "/admin/login",
        search: { returnTo: location.pathname },
        replace: true,
      });
    }
  },
  component: AdminLayout,
});
