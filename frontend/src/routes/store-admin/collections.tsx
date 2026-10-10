import { createFileRoute } from "@tanstack/react-router";
import { CollectionsPage } from "@/features/store-admin/pages/CreatorPages";

export const Route = createFileRoute("/store-admin/collections")({ component: CollectionsPage });
