import {
  ArrowRight,
  ChevronRight,
  Eye,
  Heart,
  Instagram,
  MessageCircle,
  MousePointerClick,
  Play,
  Send,
  Settings2,
  Sparkles,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getInstagramAutomation,
  getInstagramAutomations,
  getInstagramConnection,
} from "../api/instagram-automations.api";

export const automationRules = [
  {
    id: "keyword-lookbook",
    name: "Festive lookbook DM",
    trigger: "Comment contains “LOOKBOOK”",
    action: "Send link and welcome message",
    sent: 428,
    rate: "87%",
    active: true,
  },
  {
    id: "keyword-glow",
    name: "Skincare routine DM",
    trigger: "Comment contains “GLOW”",
    action: "Send routine and product links",
    sent: 216,
    rate: "82%",
    active: true,
  },
  {
    id: "new-follower",
    name: "New follower welcome",
    trigger: "New account follows you",
    action: "Send a friendly welcome",
    sent: 98,
    rate: "71%",
    active: false,
  },
];

export function InstagramAutomationPage() {
  const connectionQuery = useQuery({
    queryKey: ["influencer", "instagram-connection"],
    queryFn: getInstagramConnection,
  });
  const automationsQuery = useQuery({
    queryKey: ["influencer", "instagram-automations"],
    queryFn: getInstagramAutomations,
  });
  const displayedRules =
    automationsQuery.data?.map((rule) => ({
      id: rule.id,
      name: rule.name,
      trigger: `Comment contains “${rule.keywords.join("” or “")}”`,
      action: "Send a personalized direct message",
      sent: rule.sentCount,
      rate: "—",
      active: rule.status === "ACTIVE",
    })) ?? [];
  const connection = connectionQuery.data;
  const totalSent = displayedRules.reduce((sum, rule) => sum + rule.sent, 0);
  const totalDeliveries =
    automationsQuery.data?.reduce((sum, rule) => sum + rule.deliveryCount, 0) ?? 0;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Instagram Automation"
        description="Turn conversations into meaningful connections and conversions."
        actions={
          <Button asChild>
            <Link to="/influencer/instagram-automation/new">
              <Sparkles className="h-4 w-4" /> Create automation
            </Link>
          </Button>
        }
      />
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/10 via-fuchsia-500/5 to-transparent shadow-card">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-fuchsia-500 text-primary-foreground">
            <Instagram className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-lg font-semibold">
                {connection ? `@${connection.username} is connected` : "Instagram is not connected"}
              </p>
              {connection ? (
                <Badge className="bg-success/15 text-success hover:bg-success/15">
                  {connection.status === "ACTIVE" ? "Active" : connection.status}
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {connection
                ? "Automations are responding to your audience around the clock."
                : "Connect Instagram to start responding to comments automatically."}
            </p>
            {connection ? (
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                Development: Instagram account ID {connection.instagramUserId}
              </p>
            ) : null}
          </div>
          <Button variant="outline">Manage connection</Button>
        </CardContent>
      </Card>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={MessageCircle}
          label="Messages sent"
          value={String(totalSent)}
          detail="Successfully delivered"
        />
        <Metric
          icon={Users}
          label="Delivery attempts"
          value={String(totalDeliveries)}
          detail="From your automation rules"
        />
        <Metric
          icon={MousePointerClick}
          label="Link clicks"
          value="—"
          detail="Click tracking is not available yet"
        />
        <Metric
          icon={Heart}
          label="Response rate"
          value="—"
          detail="Reply tracking is not available yet"
        />
      </section>
      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="shadow-card xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 p-5 pb-3">
            <div>
              <CardTitle>Active automations</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Rules currently listening for your audience.
              </p>
            </div>
            <Button variant="ghost" size="sm">
              Manage all <ChevronRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 p-5 pt-1">
            {displayedRules.map((rule) => (
              <div
                key={rule.id}
                className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center"
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${rule.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                >
                  <Play className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{rule.name}</p>
                    <Badge
                      variant={rule.active ? "outline" : "secondary"}
                      className={rule.active ? "border-success/20 bg-success/10 text-success" : ""}
                    >
                      {rule.active ? "Active" : "Paused"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {rule.trigger} <ArrowRight className="inline h-3.5 w-3.5" /> {rule.action}
                  </p>
                </div>
                <div className="flex items-center gap-5 text-sm">
                  <div>
                    <p className="font-semibold">{rule.sent}</p>
                    <p className="text-xs text-muted-foreground">sent</p>
                  </div>
                  <div>
                    <p className="font-semibold">{rule.rate}</p>
                    <p className="text-xs text-muted-foreground">opened</p>
                  </div>
                  <Button asChild variant="ghost" size="icon">
                    <Link
                      to="/influencer/instagram-automation/rules/$ruleId"
                      params={{ ruleId: rule.id }}
                    >
                      <Settings2 className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="p-5 pb-3">
            <CardTitle>Recent activity</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Automation performance today</p>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-2">
            {displayedRules
              .filter((rule) => rule.sent > 0)
              .map((rule) => (
                <Event
                  key={rule.id}
                  icon={MessageCircle}
                  text={`${rule.sent} message${rule.sent === 1 ? "" : "s"} sent by ${rule.name}`}
                  time="Recorded from webhook deliveries"
                />
              ))}
            {!displayedRules.some((rule) => rule.sent > 0) ? (
              <p className="text-sm text-muted-foreground">No automation deliveries yet.</p>
            ) : null}
          </CardContent>
        </Card>
      </section>
      <Card className="shadow-card">
        <CardContent className="grid gap-5 p-5 md:grid-cols-3">
          <div className="md:col-span-1">
            <p className="font-display text-lg font-semibold">How it works</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Use keywords in your posts and let automation deliver the right response instantly.
            </p>
          </div>
          <HowStep
            number="1"
            title="Choose a trigger"
            text="A comment keyword or follower action starts the flow."
          />
          <HowStep
            number="2"
            title="Craft the response"
            text="Send a personal message, link or product recommendation."
          />
        </CardContent>
      </Card>
    </div>
  );
}
export function AutomationRulePage({ ruleId }: { ruleId: string }) {
  const demoRule = automationRules.find((item) => item.id === ruleId);
  const automationQuery = useQuery({
    queryKey: ["influencer", "instagram-automations", ruleId],
    queryFn: () => getInstagramAutomation(ruleId),
    enabled: !demoRule,
  });
  const rule = automationQuery.data
    ? {
        id: automationQuery.data.id,
        name: automationQuery.data.name,
        trigger: `Comment contains “${automationQuery.data.keywords.join("” or “")}”`,
        action: "Send a personalized direct message",
        sent: 0,
        rate: "—",
        active: automationQuery.data.status === "ACTIVE",
      }
    : (demoRule ?? automationRules[0]!);
  return (
    <div className="space-y-6">
      <PageHeader
        title={rule.name}
        description="Automation rule details and performance."
        actions={
          <Button variant="outline" asChild>
            <Link to="/influencer/instagram-automation">Back to automation</Link>
          </Button>
        }
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <Metric
          icon={Send}
          label="Messages sent"
          value={String(rule.sent)}
          detail="Since activation"
        />
        <Metric icon={Eye} label="Open rate" value={rule.rate} detail="Messages opened" />
        <Metric
          icon={MousePointerClick}
          label="Link clicks"
          value="148"
          detail="34.6% click rate"
        />
      </section>
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardHeader className="p-5 pb-3">
            <CardTitle>Automation flow</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              This is what your audience experiences.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 p-5 pt-2 md:grid-cols-3">
            <FlowStep label="Trigger" value={rule.trigger} icon={MessageCircle} />
            <FlowStep label="Response" value={rule.action} icon={Send} />
            <FlowStep label="Goal" value="Start a helpful conversation" icon={Sparkles} />
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="font-display text-lg font-semibold">Rule status</p>
            <Badge className="mt-3 bg-success/15 text-success hover:bg-success/15">
              {rule.active ? "Active and running" : "Paused"}
            </Badge>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Changes to this static preview will become editable when Instagram automation is
              connected to the backend.
            </p>
            <Button className="mt-5 w-full" variant="outline">
              Pause automation
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="shadow-card">
      <CardContent className="flex items-center gap-4 p-5">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-0.5 font-display text-2xl font-semibold">{value}</p>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}
function Event({ icon: Icon, text, time }: { icon: typeof Eye; text: string; time: string }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-medium">{text}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}
function HowStep({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
        {number}
      </span>
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
function FlowStep({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Eye;
}) {
  return (
    <div className="rounded-xl border p-4">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
