import { createFileRoute } from "@tanstack/react-router";
import { InquiriesPage } from "@/features/admin/pages/InquiriesPage";

export const Route = createFileRoute("/admin/support")({
  component: InquiriesPage,
});
