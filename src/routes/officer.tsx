import { createFileRoute, redirect } from "@tanstack/react-router";
import { OfficerLayout } from "@/components/officer/OfficerLayout";
import { ensureAuthSession } from "@/lib/auth-api";

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
		},
		component: OfficerLayout,
	});
