import { createFileRoute } from "@tanstack/react-router";
import { CreatorDirectoryPage } from "@/features/store-admin/pages/CreatorDirectoryPage";

export const Route = createFileRoute("/store-admin/creator-directory")({ component: CreatorDirectoryPage });
