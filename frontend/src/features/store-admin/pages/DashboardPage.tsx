import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  BadgeIndianRupee,
  ChevronRight,
  CircleCheck,
  Package,
  Plus,
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

const metrics: Array<{
  label: string;
  value: string;
  change: string;
  detail: string;
  icon: LucideIcon;
  iconClass: string;
}> = [
  {
    label: "Total sales",
    value: "₹1,84,250",
    change: "+18.2%",
    detail: "vs. last month",
    icon: BadgeIndianRupee,
    iconClass: "bg-primary/10 text-primary",
  },
  {
    label: "Orders",
    value: "248",
    change: "+12.5%",
    detail: "vs. last month",
    icon: ShoppingBag,
    iconClass: "bg-teal/10 text-teal",
  },
  {
    label: "Creator sales",
    value: "₹52,680",
    change: "+24.8%",
    detail: "from affiliate links",
    icon: Sparkles,
    iconClass: "bg-coral/10 text-coral",
  },
  {
    label: "Active creators",
    value: "36",
    change: "+6",
    detail: "joined this month",
    icon: UsersRound,
    iconClass: "bg-indigo/10 text-indigo",
  },
];

const performanceData = [
  { day: "01", sales: 8600 },
  { day: "04", sales: 10200 },
  { day: "07", sales: 9400 },
  { day: "10", sales: 12600 },
  { day: "13", sales: 11700 },
  { day: "16", sales: 14900 },
  { day: "19", sales: 13800 },
  { day: "22", sales: 16800 },
  { day: "25", sales: 15500 },
  { day: "28", sales: 19200 },
];

const compactCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 2,
});

const orders = [
  { id: "#UT-10482", customer: "Priya Sharma", items: "2 items", total: "₹3,498", status: "Paid" },
  {
    id: "#UT-10481",
    customer: "Vikram Rao",
    items: "1 item",
    total: "₹1,899",
    status: "Processing",
  },
  { id: "#UT-10480", customer: "Ananya Iyer", items: "3 items", total: "₹5,247", status: "Paid" },
  {
    id: "#UT-10479",
    customer: "Rahul Mehta",
    items: "1 item",
    total: "₹2,199",
    status: "Fulfilled",
  },
];

const creators = [
  {
    name: "Meera Kapoor",
    handle: "@meerastyles",
    initials: "MK",
    sales: "₹18,420",
    orders: 28,
    color: "bg-coral/15 text-coral",
  },
  {
    name: "Aditi Nair",
    handle: "@aditiedits",
    initials: "AN",
    sales: "₹12,840",
    orders: 19,
    color: "bg-primary/15 text-primary",
  },
  {
    name: "Kabir Singh",
    handle: "@kabirwears",
    initials: "KS",
    sales: "₹9,760",
    orders: 14,
    color: "bg-teal/15 text-teal",
  },
];

const channelData = [
  { label: "Direct store", amount: "₹1,31,570", percentage: 71, className: "bg-primary" },
  { label: "Creator links", amount: "₹52,680", percentage: 29, className: "bg-coral" },
];

function MetricCard({ metric }: { metric: (typeof metrics)[number] }) {
  const Icon = metric.icon;
  return (
    <Card className="shadow-card">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
          <span className={`grid h-9 w-9 place-items-center rounded-lg ${metric.iconClass}`}>
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-3 font-display text-2xl font-semibold tracking-tight">{metric.value}</p>
        <p className="mt-2 flex items-center gap-1 text-xs">
          <span className="inline-flex items-center gap-0.5 font-medium text-teal">
            <ArrowUpRight className="h-3.5 w-3.5" />
            {metric.change}
          </span>
          <span className="text-muted-foreground">{metric.detail}</span>
        </p>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Good morning, Aarav"
        description="Here’s how Urban Threads is performing today."
        actions={
          <Button asChild>
            <Link to="/store-admin/products">
              <Plus className="h-4 w-4" /> Add product
            </Link>
          </Button>
        }
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>
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
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={performanceData}
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
          </CardContent>
        </Card>
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
                  background: "conic-gradient(var(--primary) 0 71%, var(--coral) 71% 100%)",
                }}
              >
                <div className="grid h-24 w-24 place-items-center rounded-full bg-card text-center">
                  <span className="font-display text-xl font-semibold">₹1.84L</span>
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
      <section className="grid gap-6 xl:grid-cols-2">
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
            {orders.map((order) => (
              <div key={order.id} className="flex items-center gap-3 border-t px-5 py-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <Package className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {order.customer}{" "}
                    <span className="font-normal text-muted-foreground">{order.id}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{order.items}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{order.total}</p>
                  <Badge
                    variant={order.status === "Processing" ? "secondary" : "outline"}
                    className="mt-1 text-[10px]"
                  >
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
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
            {creators.map((creator, index) => (
              <div key={creator.handle} className="flex items-center gap-3 border-t px-5 py-3.5">
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
                    {creator.handle} · {creator.orders} orders
                  </p>
                </div>
                <p className="text-sm font-semibold">{creator.sales}</p>
              </div>
            ))}
            <div className="flex items-center gap-2 border-t bg-teal/5 px-5 py-3 text-sm text-teal">
              <CircleCheck className="h-4 w-4" /> Creator sales are up 24.8% this month.
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
