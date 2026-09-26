import { createFileRoute } from "@tanstack/react-router";
import { HelpPanelGuide } from "@/components/app/HelpPanelGuide";

export const Route = createFileRoute("/store-admin/help")({
  component: () => <HelpPanelGuide role="store-admin" />,
});
