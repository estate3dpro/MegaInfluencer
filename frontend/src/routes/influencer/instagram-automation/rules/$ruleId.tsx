import { createFileRoute } from "@tanstack/react-router";
import { AutomationRulePage } from "@/features/influencer/pages/InstagramAutomationPage";
export const Route = createFileRoute("/influencer/instagram-automation/rules/$ruleId")({ component: () => <AutomationRulePage ruleId={Route.useParams().ruleId} /> });
