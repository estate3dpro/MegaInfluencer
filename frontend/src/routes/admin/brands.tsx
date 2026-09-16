import { createFileRoute } from "@tanstack/react-router";
import { BrandsPage } from "@/features/admin/pages/EcosystemPages";
export const Route = createFileRoute("/admin/brands")({ component: BrandsPage });
