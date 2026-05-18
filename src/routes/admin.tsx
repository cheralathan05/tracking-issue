import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { getStoredToken } from "@/lib/auth-api";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const token = getStoredToken();
    if (!token) {
      throw redirect({
        to: "/admin/login",
        replace: true,
      });
    }
  },
  component: AdminLayout,
});
