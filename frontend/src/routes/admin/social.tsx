import { createFileRoute } from "@tanstack/react-router";
import { SocialPage } from "@/features/admin/pages/EcosystemPages";
export const Route = createFileRoute("/admin/social")({ component: SocialPage });
