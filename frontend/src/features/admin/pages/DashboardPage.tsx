import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  MoreHorizontal,
  ShieldAlert,
  Sparkles,
  Store,
  UsersRound,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const metrics = [
  { label: "Active influencers", value: "2,841", change: "+12.4%", icon: Sparkles, positive: true },
  { label: "Active stores", value: "186", change: "+8.2%", icon: Store, positive: true },
  {
    label: "Platform GMV",
    value: "₹24.8L",
    change: "+18.6%",
    icon: CircleDollarSign,
    positive: true,
  },
  { label: "Pending reviews", value: "24", change: "6 urgent", icon: ShieldAlert, positive: false },
];

const activities = [
  {
    title: "Campaign approved",
    detail: "Summer Launch by Urban Threads",
    time: "8 min ago",
    tone: "bg-emerald-500",
  },
  {
    title: "New store application",
    detail: "Northstar Home submitted verification",
    time: "24 min ago",
    tone: "bg-blue-500",
  },
  {
    title: "Payout batch completed",
    detail: "₹3,42,800 sent to 48 creators",
    time: "1 hr ago",
    tone: "bg-violet-500",
  },
  {
    title: "Instagram account flagged",
    detail: "Connection token needs attention",
    time: "2 hrs ago",
    tone: "bg-amber-500",
  },
];

const reviewQueue = [
  {
    name: "Riya Malhotra",
    type: "Influencer verification",
    requested: "12 min ago",
    status: "New",
  },
  { name: "Kora Collective", type: "Store onboarding", requested: "38 min ago", status: "New" },
  { name: "Monsoon Edit", type: "Campaign approval", requested: "1 hr ago", status: "Review" },
];

const marketplacePerformance = [
  { month: "Oct", value: 418000 },
  { month: "Nov", value: 452000 },
  { month: "Dec", value: 487000 },
  { month: "Jan", value: 498000 },
  { month: "Feb", value: 536000 },
  { month: "Mar", value: 522000 },
  { month: "Apr", value: 574000 },
  { month: "May", value: 632000 },
  { month: "Jun", value: 676000 },
  { month: "Jul", value: 701000 },
  { month: "Aug", value: 694000 },
  { month: "Sep", value: 728000 },
];

const compactCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 2,
});

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform dashboard"
        description="A live view of your marketplace, revenue and operations."
        actions={
          <Button asChild>
            <Link to="/admin/reports">
              View reports <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, change, icon: Icon, positive }) => (
          <Card key={label} className="shadow-none">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
                </div>
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p
                className={`mt-4 flex items-center gap-1 text-xs font-medium ${positive ? "text-emerald-600" : "text-amber-600"}`}
              >
                {positive ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {change} <span className="font-normal text-muted-foreground">vs. last month</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="shadow-none xl:col-span-2">
          <CardHeader className="flex-row items-start justify-between space-y-0 p-5 pb-0">
            <div>
              <CardTitle>Marketplace performance</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Gross merchandise value over the last 12 months
              </p>
            </div>
            <Badge variant="secondary">+18.6%</Badge>
          </CardHeader>
          <CardContent className="h-[260px] p-2 pt-5 sm:p-5 sm:pt-5">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={marketplacePerformance}
                margin={{ top: 26, right: 8, left: 8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="marketplaceLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#fb923c" />
                    <stop offset="48%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                  <linearGradient id="marketplaceFill" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#fb923c" stopOpacity={0.16} />
                    <stop offset="48%" stopColor="#ec4899" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.22} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={12}
                  interval={1}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <Tooltip
                  content={<PerformanceTooltip />}
                  cursor={{ stroke: "var(--muted-foreground)", strokeOpacity: 0.5, strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="url(#marketplaceLine)"
                  strokeWidth={3}
                  fill="url(#marketplaceFill)"
                  dot={false}
                  activeDot={{ r: 6, fill: "#ec4899", stroke: "var(--card)", strokeWidth: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex-row items-center justify-between space-y-0 p-5 pb-2">
            <div>
              <CardTitle>Platform health</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Service availability</p>
            </div>
            <Activity className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-3">
            {[
              ["API availability", "99.98%", "bg-emerald-500"],
              ["Instagram connections", "98.4%", "bg-emerald-500"],
              ["Payment processing", "99.9%", "bg-emerald-500"],
            ].map(([label, value, color]) => (
              <div key={label}>
                <div className="flex justify-between text-sm">
                  <span>{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${color}`} style={{ width: value }} />
                </div>
              </div>
            ))}
            <Button asChild variant="outline" className="mt-1 w-full">
              <Link to="/admin/system">View system status</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader className="flex-row items-center justify-between space-y-0 p-5">
            <div>
              <CardTitle>Review queue</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Items awaiting an admin decision</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/users">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {reviewQueue.map((item) => (
              <div key={item.name} className="flex items-center gap-3 border-t px-5 py-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                  <UsersRound className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.type} · {item.requested}
                  </p>
                </div>
                <Badge variant={item.status === "New" ? "default" : "secondary"}>
                  {item.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="flex-row items-center justify-between space-y-0 p-5">
            <div>
              <CardTitle>Recent activity</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Latest events across the platform
              </p>
            </div>
            <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-5 p-5 pt-1">
            {activities.map((activity) => (
              <div key={activity.title} className="flex gap-3">
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${activity.tone}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{activity.detail}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  <Clock3 className="mr-1 inline h-3 w-3" />
                  {activity.time}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-200">
        <CheckCircle2 className="h-4 w-4 shrink-0" /> All core platform services are operating
        normally.
      </div>
    </div>
  );
}

function PerformanceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
}) {
  const value = payload?.[0]?.value;

  if (!active || typeof value !== "number") return null;

  return (
    <div className="rounded-full bg-neutral-950 px-3 py-1.5 text-sm font-semibold text-white shadow-lg">
      {compactCurrency.format(value)}
    </div>
  );
}
