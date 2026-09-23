import { createFileRoute } from "@tanstack/react-router";
import { CreatorDirectoryPage } from "@/features/admin/pages/CreatorDirectoryPage";

export const Route = createFileRoute("/admin/creators")({ component: CreatorDirectoryPage });
