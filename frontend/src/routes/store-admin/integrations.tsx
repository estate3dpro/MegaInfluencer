import { createFileRoute } from "@tanstack/react-router";
import { IntegrationsPage } from "@/features/store-admin/pages/SetupPages";
export const Route = createFileRoute("/store-admin/integrations")({ component: IntegrationsPage });
