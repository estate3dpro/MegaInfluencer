import { createFileRoute } from "@tanstack/react-router";
import { EarningsPage } from "@/features/influencer/pages/CommercePages";
export const Route = createFileRoute("/influencer/earnings")({ component: EarningsPage });
