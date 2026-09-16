import { createFileRoute } from "@tanstack/react-router";
import { CampaignsPage } from "@/features/store-admin/pages/CreatorPages";
export const Route = createFileRoute("/store-admin/campaigns")({ component: CampaignsPage });
