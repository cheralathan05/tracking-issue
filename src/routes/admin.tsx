import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ensureAuthSession, getProfile } from "@/lib/auth-api";

const adminRoles = new Set([
  "super_admin",
  "state_admin",
  "district_officer",
  "department_officer",
  "admin",
  "officer",
]);

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

    const profile = await getProfile().catch(() => null);
    const role = String(profile?.data?.user?.role ?? "");

    if (!adminRoles.has(role)) {
      throw redirect({
        to: "/dashboard",
        replace: true,
      });
    }
  },
  component: AdminLayout,
});
