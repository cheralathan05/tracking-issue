import { createFileRoute, redirect } from "@tanstack/react-router";
import { OfficerLayout } from "@/components/officer/OfficerLayout";
import { ensureAuthSession, getProfile } from "@/lib/auth-api";

const officerRoles = new Set(["officer"]);
const adminRoles = new Set([
	"super_admin",
	"state_admin",
	"district_officer",
	"department_officer",
	"admin",
]);

export const Route = createFileRoute("/officer")({
	beforeLoad: async ({ location }) => {
		if (typeof window === "undefined") {
			// Skip server-side redirect so client can restore session via refresh token.
			return;
		}

		const session = await ensureAuthSession();

		if (!session) {
			throw redirect({
				to: "/officer/login",
				search: { returnTo: location.pathname },
				replace: true,
			});
		}

		const profile = await getProfile().catch(() => null);
		const role = String(profile?.data?.user?.role ?? "");

		if (!officerRoles.has(role)) {
			throw redirect({
				to: adminRoles.has(role) ? "/admin/dashboard" : "/dashboard",
				replace: true,
			});
		}
	},
	component: OfficerLayout,
});
