import { createFileRoute } from "@tanstack/react-router";
import { OfficerLayout } from "@/components/officer/OfficerLayout";
export const Route = createFileRoute("/officer")({ component: OfficerLayout });
