import { createFileRoute } from "@tanstack/react-router";
import { ServicesPage } from "@/components/site/PublicStubs";
export const Route = createFileRoute("/services")({ component: ServicesPage });
