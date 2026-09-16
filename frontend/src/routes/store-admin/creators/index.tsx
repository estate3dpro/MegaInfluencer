import { createFileRoute } from "@tanstack/react-router";
import { CreatorsPage } from "@/features/store-admin/pages/CreatorPages";
export const Route = createFileRoute("/store-admin/creators/")({ component: CreatorsPage });
