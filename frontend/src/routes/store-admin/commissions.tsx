import { createFileRoute } from "@tanstack/react-router";
import { CommissionsPage } from "@/features/store-admin/pages/CreatorPages";
export const Route = createFileRoute("/store-admin/commissions")({ component: CommissionsPage });
