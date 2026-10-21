import { createFileRoute } from "@tanstack/react-router";
import { AffiliateLinkReportPage } from "@/features/store-admin/pages/AffiliateLinkReportPage";

export const Route = createFileRoute("/store-admin/affiliate/$linkId")({
  component: () => <AffiliateLinkReportPage linkId={Route.useParams().linkId} />,
});
