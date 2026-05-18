import { createFileRoute, redirect } from "@tanstack/react-router";
import { OfficerLayout } from "@/components/officer/OfficerLayout";
import { ensureAuthSession } from "@/lib/auth-api";

export const Route = createFileRoute("/officer")({
	beforeLoad: async ({ location }) => {
		const token = await ensureAuthSession();

		if (!token) {
			throw redirect({
				to: "/officer/login",
				search: { returnTo: location.pathname },
				replace: true,
			});
		}
	},
	component: OfficerLayout,
});
