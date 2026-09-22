import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeIndianRupee,
  ChevronRight,
  CircleCheck,
  Package,
  Plus,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  UsersRound,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStoreDashboard } from "../api/dashboard.api";

function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

const compactCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 2,
});

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardPage() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["store", "dashboard"],
    queryFn: getStoreDashboard,
  });

  const greeting = getTimeGreeting();
  const ownerName = data?.store.ownerName || "Merchant";
  const storeName = data?.store.name || "Your Store";

  const metricsConfig: Array<{
    label: string;
    value: string;
    change: number;
    detail: string;
    icon: LucideIcon;
    iconClass: string;
  }> = [
    {
      label: "Total sales",
      value: formatCurrency(data?.metrics.totalSales.value ?? 0),
      change: data?.metrics.totalSales.change ?? 0,
      detail: "vs. last month",
      icon: BadgeIndianRupee,
      iconClass: "bg-primary/10 text-primary",
    },
    {
      label: "Orders",
      value: String(data?.metrics.totalOrders.value ?? 0),
      change: data?.metrics.totalOrders.change ?? 0,
      detail: "vs. last month",
      icon: ShoppingBag,
      iconClass: "bg-teal/10 text-teal",
    },
    {
      label: "Creator sales",
      value: formatCurrency(data?.metrics.creatorSales.value ?? 0),
      change: data?.metrics.creatorSales.change ?? 0,
      detail: "from affiliate links",
      icon: Sparkles,
      iconClass: "bg-coral/10 text-coral",
    },
    {
      label: "Active creators",
      value: String(data?.metrics.activeCreators.value ?? 0),
      change: data?.metrics.activeCreators.change ?? 0,
      detail: "joined this month",
      icon: UsersRound,
      iconClass: "bg-indigo/10 text-indigo",
    },
  ];

  const channelData = [
    {
      label: "Direct store",
      amount: formatCurrency(data?.channelBreakdown.directSales ?? 0),
      percentage: data?.channelBreakdown.directPercentage ?? 100,
      className: "bg-primary",
    },
    {
      label: "Creator links",
      amount: formatCurrency(data?.channelBreakdown.creatorSales ?? 0),
      percentage: data?.channelBreakdown.creatorPercentage ?? 0,
      className: "bg-coral",
    },
  ];

  const performance = data?.performance ?? [];
  const recentOrders = data?.recentOrders ?? [];
  const topCreators = data?.topCreators ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${ownerName}`}
        description={`Here’s how ${storeName} is performing today.`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              {isFetching ? "Refreshing..." : "Refresh"}
            </Button>
            <Button asChild>
              <Link to="/store-admin/products">
                <Plus className="h-4 w-4" /> View products
              </Link>
            </Button>
          </div>
        }
      />

      {/* Metric KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="shadow-card">
                <CardContent className="p-5">
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="mt-3 h-8 w-32 animate-pulse rounded bg-muted" />
                  <div className="mt-2 h-3 w-20 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))
          : metricsConfig.map((metric) => {
              const Icon = metric.icon;
              const isPositive = metric.change >= 0;
              return (
                <Card key={metric.label} className="shadow-card">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                      <span className={`grid h-9 w-9 place-items-center rounded-lg ${metric.iconClass}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-3 font-display text-2xl font-semibold tracking-tight">{metric.value}</p>
                    <p className="mt-2 flex items-center gap-1 text-xs">
                      <span
                        className={`inline-flex items-center gap-0.5 font-medium ${
                          isPositive ? "text-teal" : "text-destructive"
                        }`}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5" />
                        )}
                        {isPositive ? `+${metric.change}%` : `${metric.change}%`}
                      </span>
                      <span className="text-muted-foreground">{metric.detail}</span>
                    </p>
                  </CardContent>
                </Card>
              );
            })}
      </section>

      {/* Main Visuals: Sales Chart & Channel Breakdown */}
      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="shadow-card xl:col-span-2">
          <CardHeader className="flex-row items-start justify-between space-y-0 p-5 pb-2">
            <div>
              <CardTitle>Sales performance</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Daily sales for the last 30 days</p>
            </div>
            <Badge variant="secondary" className="font-medium">
              Last 30 days
            </Badge>
          </CardHeader>
          <CardContent className="h-[282px] p-3 pt-5 sm:p-5 sm:pt-5">
            {isLoading ? (
              <div className="grid h-full place-items-center text-muted-foreground">
                <div className="h-32 w-full animate-pulse rounded bg-muted/40" />
              </div>
            ) : performance.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                No sales recorded in the last 30 days.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={performance}
                  margin={{ top: 26, right: 8, left: 8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="storeSalesLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#fb923c" />
                      <stop offset="48%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                    <linearGradient id="storeSalesFill" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#fb923c" stopOpacity={0.16} />
                      <stop offset="48%" stopColor="#ec4899" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.22} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  />
                  <Tooltip
                    content={<SalesPerformanceTooltip />}
                    cursor={{ stroke: "var(--muted-foreground)", strokeOpacity: 0.5, strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="url(#storeSalesLine)"
                    strokeWidth={3}
                    fill="url(#storeSalesFill)"
                    dot={false}
                    activeDot={{ r: 6, fill: "#ec4899", stroke: "var(--card)", strokeWidth: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Sales by Channel Card */}
        <Card className="shadow-card">
          <CardHeader className="p-5 pb-3">
            <CardTitle>Sales by channel</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Where your revenue comes from</p>
          </CardHeader>
          <CardContent className="space-y-6 p-5 pt-3">
            <div className="grid place-items-center py-1">
              <div
                className="grid h-32 w-32 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(var(--primary) 0 ${data?.channelBreakdown.directPercentage ?? 100}%, var(--coral) ${data?.channelBreakdown.directPercentage ?? 100}% 100%)`,
                }}
              >
                <div className="grid h-24 w-24 place-items-center rounded-full bg-card text-center">
                  <span className="font-display text-xl font-semibold">
                    {compactCurrency.format(data?.metrics.totalSales.value ?? 0)}
                  </span>
                  <span className="-mt-1 text-[11px] text-muted-foreground">total sales</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {channelData.map((channel) => (
                <div key={channel.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <i className={`h-2.5 w-2.5 rounded-full ${channel.className}`} />
                      {channel.label}
                    </span>
                    <span className="font-medium">{channel.amount}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${channel.className}`}
                      style={{ width: `${channel.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Secondary Row: Recent Orders & Top Creators */}
      <section className="grid gap-6 xl:grid-cols-2">
        {/* Recent Orders */}
        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between space-y-0 p-5">
            <div>
              <CardTitle>Recent orders</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Your latest customer purchases</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="-mr-2 text-primary">
              <Link to="/store-admin/orders">
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 border-t px-5 py-3.5">
                  <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                </div>
              ))
            ) : recentOrders.length === 0 ? (
              <div className="border-t p-8 text-center text-sm text-muted-foreground">
                No orders yet. They will appear here automatically when synced.
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center gap-3 border-t px-5 py-3.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                    <Package className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {order.customer}{" "}
                      <span className="font-normal text-muted-foreground">{order.name}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {order.processedAt ? new Date(order.processedAt).toLocaleDateString() : "Recent"}
                      {order.creatorCode ? (
                        <span className="ml-1.5 font-medium text-coral">
                          · Influencer: @{order.creatorCode}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(order.total, order.currency)}</p>
                    <Badge
                      variant={
                        /refund/i.test(order.financialStatus)
                          ? "destructive"
                          : /processing|unfulfilled/i.test(order.fulfillmentStatus)
                          ? "secondary"
                          : "outline"
                      }
                      className="mt-1 text-[10px]"
                    >
                      {order.financialStatus}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top Creators */}
        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between space-y-0 p-5">
            <div>
              <CardTitle>Top creators</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Best performers this month</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="-mr-2 text-primary">
              <Link to="/store-admin/creators">
                Manage creators <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 border-t px-5 py-3.5">
                  <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                </div>
              ))
            ) : topCreators.length === 0 ? (
              <div className="border-t p-8 text-center text-sm text-muted-foreground">
                No active creator sales recorded this month yet.
              </div>
            ) : (
              topCreators.map((creator, index) => (
                <div key={creator.id || creator.handle} className="flex items-center gap-3 border-t px-5 py-3.5">
                  <span className="w-4 text-center text-sm font-semibold text-muted-foreground">
                    {index + 1}
                  </span>
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-full text-xs font-semibold ${creator.color}`}
                  >
                    {creator.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{creator.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {creator.handle} · {creator.orders} {creator.orders === 1 ? "order" : "orders"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(creator.sales)}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Comm: {formatCurrency(creator.commission)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div className="flex items-center gap-2 border-t bg-teal/5 px-5 py-3 text-sm text-teal">
              <CircleCheck className="h-4 w-4" />
              {data?.metrics.creatorSales.value ? (
                <span>
                  Creator affiliate links have generated{" "}
                  <strong>{formatCurrency(data.metrics.creatorSales.value)}</strong> this month.
                </span>
              ) : (
                <span>Share affiliate links with your creators to start driving tracked sales.</span>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function SalesPerformanceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: { day?: string; date?: string; orders?: number } }>;
}) {
  const value = payload?.[0]?.value;
  const point = payload?.[0]?.payload;

  if (!active || typeof value !== "number") return null;

  return (
    <div className="rounded-xl bg-neutral-950 px-3.5 py-2 text-xs font-semibold text-white shadow-xl">
      <p className="text-white/70 text-[10px] uppercase tracking-wider">{point?.date || `Day ${point?.day}`}</p>
      <p className="text-sm font-bold mt-0.5">{compactCurrency.format(value)}</p>
      {point?.orders !== undefined ? (
        <p className="text-[11px] font-normal text-white/80">{point.orders} {point.orders === 1 ? "order" : "orders"}</p>
      ) : null}
    </div>
  );
}
