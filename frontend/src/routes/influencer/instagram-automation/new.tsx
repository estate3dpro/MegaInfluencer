import { createFileRoute } from "@tanstack/react-router";
import { AutomationRuleSetterPage } from "@/features/influencer/pages/AutomationRuleSetterPage";

export const Route = createFileRoute("/influencer/instagram-automation/new")({
  component: AutomationRuleSetterPage,
});
