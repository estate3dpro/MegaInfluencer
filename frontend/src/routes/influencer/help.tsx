import { createFileRoute } from "@tanstack/react-router";
import { HelpPanelGuide } from "@/components/app/HelpPanelGuide";

export const Route = createFileRoute("/influencer/help")({
  component: () => <HelpPanelGuide role="influencer" />,
});
