import { createFileRoute } from "@tanstack/react-router";
import { ContactPage } from "@/components/site/PublicStubs";
export const Route = createFileRoute("/contact")({ component: ContactPage });
