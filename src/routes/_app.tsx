import { createFileRoute } from "@tanstack/react-router";
import { CitizenLayout } from "@/components/citizen/CitizenLayout";

export const Route = createFileRoute("/_app")({
  component: CitizenLayout,
});
