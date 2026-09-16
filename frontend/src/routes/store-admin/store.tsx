import { createFileRoute } from "@tanstack/react-router";
import { StorePage } from "@/features/store-admin/pages/SetupPages";
export const Route = createFileRoute("/store-admin/store")({ component: StorePage });
