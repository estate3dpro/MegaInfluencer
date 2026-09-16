import { createFileRoute } from "@tanstack/react-router";
import { AttributionPage } from "@/features/admin/pages/AttributionPage";

export const Route = createFileRoute("/admin/attribution")({ component: AttributionPage });
