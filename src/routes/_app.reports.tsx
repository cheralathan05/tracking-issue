import { createFileRoute } from "@tanstack/react-router";
import { CitizenReports } from "@/components/reports/CitizenReports";

export const Route = createFileRoute("/_app/reports")({
  component: CitizenReports,
});
