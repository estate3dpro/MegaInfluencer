import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "@/features/shared/components/WorkspacePage";

export const Route = createFileRoute("/admin/$page")({
  component: AdminPage,
});

function AdminPage() {
  const { page } = Route.useParams();
  return <WorkspacePage role="admin" page={page} />;
}
