import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/features/store-admin/pages/SetupPages";
export const Route = createFileRoute("/store-admin/settings")({ component: SettingsPage });
