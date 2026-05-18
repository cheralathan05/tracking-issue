import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/components/site/PublicStubs";
export const Route = createFileRoute("/about")({ component: AboutPage });
