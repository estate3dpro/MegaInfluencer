import { createFileRoute } from "@tanstack/react-router";
import { SupportPage } from "@/features/influencer/pages/SupportPages";
export const Route = createFileRoute("/influencer/support")({ component: SupportPage });
