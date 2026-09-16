import { createFileRoute } from "@tanstack/react-router";
import { UsersPage } from "@/features/admin/pages/GovernancePages";
export const Route = createFileRoute("/admin/users")({ component: UsersPage });
