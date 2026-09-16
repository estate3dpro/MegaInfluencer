import { createFileRoute } from "@tanstack/react-router";
import { SupportPage } from "@/features/admin/pages/GovernancePages";
export const Route = createFileRoute("/admin/support")({ component: SupportPage });
