import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  ExternalLink,
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
import { getAdminDashboard } from "../api/overview.api";

const compactCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 2,
});

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function DashboardPage() {
  const query = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: getAdminDashboard,
  });

  const data = query.data;
  const metrics = data?.metrics ?? {
    activeInfluencers: 0,
    totalInfluencers: 0,
    activeStores: 0,
    totalStores: 0,
    platformGMV: 0,
    totalOrdersCount: 0,
    totalCommissions: 0,
    pendingReviews: 0,
  };

  const monthlyPerformance = data?.monthlyPerformance ?? [];
  const activities = data?.activities ?? [];
  const reviewQueue = data?.reviewQueue ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Command Center"
        description="Real-time multi-tenant marketplace monitoring, creator revenue, and operational governance."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/analytics">
                <Sparkles className="h-4 w-4 mr-1 text-primary" /> Analytics
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/admin/reports">
                Reports <ExternalLink className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        }
      />

      {/* KPI Summary Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Influencers</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {query.isLoading ? "..." : metrics.activeInfluencers.toLocaleString()}
                </p>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>{metrics.totalInfluencers} total registered</span>
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Stores</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {query.isLoading ? "..." : metrics.activeStores.toLocaleString()}
                </p>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal/10 text-teal">
                <Store className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>{metrics.totalStores} total brand stores</span>
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Platform GMV</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {query.isLoading ? "..." : formatCurrency(metrics.platformGMV)}
                </p>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-coral/10 text-coral">
                <CircleDollarSign className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 flex items-center gap-1 text-xs font-medium text-muted-foreground">
              Across {metrics.totalOrdersCount} orders placed
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Creator Commissions</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {query.isLoading ? "..." : formatCurrency(metrics.totalCommissions)}
                </p>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo/10 text-indigo">
                <ShieldAlert className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 flex items-center gap-1 text-xs font-medium text-muted-foreground">
              {metrics.pendingReviews} items pending review
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Main Chart + Health Grid */}
      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="shadow-card xl:col-span-2">
          <CardHeader className="flex-row items-start justify-between space-y-0 p-5 pb-0">
            <div>
              <CardTitle className="text-lg">Marketplace GMV & Growth Trend</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Aggregated order volume across connected stores over the last 12 months
              </p>
            </div>
            <Badge variant="outline" className="border-teal/30 bg-teal/5 text-teal font-medium">
              Live Feed
            </Badge>
          </CardHeader>
          <CardContent className="h-[270px] p-2 pt-5 sm:p-5 sm:pt-5">
            {query.isLoading ? (
              <div className="h-full w-full animate-pulse rounded bg-muted/40" />
            ) : monthlyPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyPerformance}
                  margin={{ top: 26, right: 8, left: 8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="adminGmvLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="50%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                    <linearGradient id="adminGmvFill" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.16} />
                      <stop offset="50%" stopColor="#ec4899" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.2} />
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
                  <Tooltip content={<PerformanceTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="url(#adminGmvLine)"
                    strokeWidth={3}
                    fill="url(#adminGmvFill)"
                    dot={false}
                    activeDot={{ r: 6, fill: "#ec4899", stroke: "var(--card)", strokeWidth: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No orders recorded yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between space-y-0 p-5 pb-2">
            <div>
              <CardTitle className="text-lg">Platform Health</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Real-time service availability</p>
            </div>
            <Activity className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-3">
            {[
              ["Fastify REST API", "100%", "bg-emerald-500"],
              ["Shopify Webhook Bridge", "100%", "bg-emerald-500"],
              ["Instagram Graph API", "99.4%", "bg-emerald-500"],
              ["Prisma PostgreSQL DB", "100%", "bg-emerald-500"],
            ].map(([label, value, color]) => (
              <div key={label}>
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground">{label}</span>
                  <span className="text-muted-foreground font-semibold">{value}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${color}`} style={{ width: value }} />
                </div>
              </div>
            ))}
            <Button asChild variant="outline" size="sm" className="mt-3 w-full">
              <Link to="/admin/system">View System Logs & Diagnostics</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Review Queue & Recent Activity */}
      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between space-y-0 p-5">
            <div>
              <CardTitle className="text-lg">Governance Review Queue</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Recent onboardings & verified accounts</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/influencers">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {reviewQueue.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">No pending review items.</p>
            ) : (
              reviewQueue.map((item) => (
                <div key={item.id + item.type} className="flex items-center gap-3 border-t px-5 py-3.5 hover:bg-muted/15 transition-colors">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <UsersRound className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.type} · {item.requested}
                    </p>
                  </div>
                  <Badge
                    variant={item.status === "Active" ? "outline" : "secondary"}
                    className={item.status === "Active" ? "border-teal/30 bg-teal/5 text-teal text-xs font-medium" : "text-xs"}
                  >
                    {item.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between space-y-0 p-5">
            <div>
              <CardTitle className="text-lg">Live Marketplace Activity</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Real-time transactions, campaigns & store events
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-1">
            {activities.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">No recent events recorded.</p>
            ) : (
              activities.map((activity, idx) => (
                <div key={idx} className="flex gap-3">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${activity.tone}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{activity.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{activity.detail}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    <Clock3 className="mr-1 inline h-3 w-3" />
                    {activity.time}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-200">
        <CheckCircle2 className="h-4 w-4 shrink-0" /> All core platform services, Shopify sync webhooks, and Instagram automations are active and healthy.
      </div>
    </div>
  );
}

function PerformanceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: { month?: string; orders?: number } }>;
}) {
  const value = payload?.[0]?.value;
  const orders = payload?.[0]?.payload?.orders;
  const month = payload?.[0]?.payload?.month;

  if (!active || typeof value !== "number") return null;

  return (
    <div className="rounded-xl bg-neutral-950 p-3 text-xs text-white shadow-lg space-y-1">
      <p className="font-semibold text-neutral-300">{month}</p>
      <p className="text-base font-bold text-white">{compactCurrency.format(value)}</p>
      {orders !== undefined ? <p className="text-neutral-400">{orders} orders placed</p> : null}
    </div>
  );
}
