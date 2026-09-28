import { createFileRoute } from "@tanstack/react-router";
import { HelpPanelGuide } from "@/components/app/HelpPanelGuide";

export const Route = createFileRoute("/admin/help")({
  component: () => <HelpPanelGuide role="admin" />,
});
