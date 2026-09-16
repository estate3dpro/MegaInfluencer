import { createFileRoute } from "@tanstack/react-router";
import { CampaignsPage } from "@/features/admin/pages/EcosystemPages";
export const Route = createFileRoute("/admin/campaigns")({ component: CampaignsPage });
