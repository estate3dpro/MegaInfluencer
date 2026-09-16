import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "@/features/shared/components/WorkspacePage";

export const Route = createFileRoute("/store-admin/$page")({
  component: StoreAdminPage,
});

function StoreAdminPage() {
  const { page } = Route.useParams();
  return <WorkspacePage role="store-admin" page={page} />;
}
