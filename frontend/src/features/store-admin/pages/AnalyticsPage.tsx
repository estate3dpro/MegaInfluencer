import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowUpRight,
  Award,
  Crown,
  Download,
  ExternalLink,
  Instagram,
  Medal,
  MousePointerClick,
  Package,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Trophy,
  UsersRound,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getStoreAnalytics } from "../api/analytics.api";

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
  maximumFractionDigits: 1,
});

export function AnalyticsPage() {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["store", "analytics", range],
    queryFn: () => getStoreAnalytics(range),
  });

  const summary = data?.summary;
  const timeline = data?.timeline ?? [];
  const placements = data?.placements ?? [];
  const leaderboard = data?.leaderboard ?? [];
  const topProducts = data?.topProducts ?? [];

  // Top 3 creators for podium
  const top3 = leaderboard.slice(0, 3);
  const maxCreatorSales = leaderboard[0]?.sales || 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Instagram Commerce Analytics"
        description="Real-time traffic, conversion funnels and creator leaderboards driven by Instagram."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border bg-muted/30 p-0.5">
              {(["7d", "30d", "90d"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                    range === r
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "90 Days"}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        }
      />

      {/* Overview Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-coral/10 to-transparent p-4 text-sm text-foreground">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white shadow-md">
            <Instagram className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold">Instagram Direct Attribution Active</p>
            <p className="text-xs text-muted-foreground">
              Tracking link clicks, DM keyword automations, story stickers, and checkout conversions.
            </p>
          </div>
        </div>
        <Badge variant="outline" className="border-teal/30 bg-teal/10 font-medium text-teal">
          <Sparkles className="mr-1 h-3.5 w-3.5" /> Closed-Loop Funnel
        </Badge>
      </div>

      {/* Top 4 Funnel Stat Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Instagram Link Clicks"
          value={isLoading ? "..." : (summary?.totalInstagramClicks.value ?? 0).toLocaleString()}
          delta={summary?.totalInstagramClicks.change ?? 0}
          hint="vs. previous period"
          icon={MousePointerClick}
        />
        <StatCard
          label="Creator Sales (GMV)"
          value={isLoading ? "..." : formatCurrency(summary?.totalCreatorSales.value ?? 0)}
          delta={summary?.totalCreatorSales.change ?? 0}
          hint="vs. previous period"
          icon={ShoppingBag}
          accent="coral"
        />
        <StatCard
          label="Creator Orders"
          value={isLoading ? "..." : String(summary?.totalCreatorOrders.value ?? 0)}
          delta={summary?.totalCreatorOrders.change ?? 0}
          hint={`AOV: ${formatCurrency(summary?.avgOrderValue ?? 0)}`}
          icon={ShoppingCart}
          accent="teal"
        />
        <StatCard
          label="Conversion Rate"
          value={isLoading ? "..." : `${summary?.conversionRate.value ?? 0}%`}
          delta={summary?.conversionRate.change ?? 0}
          hint="clicks to purchases"
          icon={TrendingUp}
          accent="indigo"
        />
      </section>

      {/* Timeline Chart & Placements Share */}
      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="shadow-card xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 p-5 pb-2">
            <div>
              <CardTitle>Instagram Traffic & Sales Velocity</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Daily link clicks alongside completed customer orders
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {range === "7d" ? "Last 7 Days" : range === "90d" ? "Last 90 Days" : "Last 30 Days"}
            </Badge>
          </CardHeader>
          <CardContent className="h-80 p-3 pt-4 sm:p-5 sm:pt-4">
            {isLoading ? (
              <div className="grid h-full place-items-center">
                <div className="h-40 w-full animate-pulse rounded-lg bg-muted/40" />
              </div>
            ) : timeline.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                No traffic recorded during this timeframe.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="clicksFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderColor: "var(--border)",
                      borderRadius: 12,
                      background: "var(--card)",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Legend iconType="circle" />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="clicks"
                    name="Instagram Clicks"
                    stroke="#ec4899"
                    strokeWidth={2.5}
                    fill="url(#clicksFill)"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    name="Orders Placed"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fill="url(#salesFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Placements Breakdown */}
        <Card className="shadow-card">
          <CardHeader className="p-5 pb-3">
            <CardTitle>Instagram Placements</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Traffic sources & channel attribution</p>
          </CardHeader>
          <CardContent className="space-y-5 p-5 pt-3">
            {placements.map((source) => (
              <div key={source.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <i className={`h-2.5 w-2.5 rounded-full ${source.color}`} />
                    {source.name}
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">
                    {source.clicks} clicks
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <Progress value={source.share} className="h-1.5" />
                  <span className="w-10 text-right text-xs font-medium text-muted-foreground">
                    {source.share}%
                  </span>
                </div>
              </div>
            ))}

            <div className="mt-6 rounded-xl border border-dashed p-3.5 text-xs text-muted-foreground">
              💡 <strong>Pro Tip:</strong> DMs triggered by keyword auto-replies convert on average <strong>3.2x higher</strong> than bio links.
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 🏆 Creator Leaderboard & Performance Tracker */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight">
              🏆 Creator Performance Leaderboard
            </h2>
            <p className="text-sm text-muted-foreground">
              Top performing influencers ranked by revenue, conversion rate and community impact
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
              <UsersRound className="mr-1 h-3.5 w-3.5" /> {leaderboard.length} Active Creators
            </Badge>
          </div>
        </div>

        {/* Podium Highlight Cards for Top 3 */}
        {top3.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {top3.map((creator, i) => {
              const rankIcons = [
                <Crown key="1" className="h-5 w-5 text-amber-500" />,
                <Medal key="2" className="h-5 w-5 text-slate-400" />,
                <Award key="3" className="h-5 w-5 text-amber-700" />,
              ];
              const rankBorders = [
                "border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-card to-card shadow-md",
                "border-slate-300 bg-card",
                "border-amber-700/20 bg-card",
              ];
              return (
                <Card key={creator.id} className={`shadow-card relative overflow-hidden ${rankBorders[i]}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="relative">
                          <span
                            className={`grid h-12 w-12 place-items-center rounded-full font-bold text-sm ${creator.color}`}
                          >
                            {creator.initials}
                          </span>
                          <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-card shadow border text-[10px] font-bold">
                            #{creator.rank}
                          </span>
                        </span>
                        <div>
                          <p className="font-semibold text-base">{creator.name}</p>
                          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                            <Instagram className="h-3 w-3 text-pink-500" />
                            {creator.handle}
                          </p>
                        </div>
                      </div>
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-muted/60">
                        {rankIcons[i]}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-3 text-center">
                      <div>
                        <p className="text-[11px] text-muted-foreground">Sales (GMV)</p>
                        <p className="font-bold text-sm text-foreground">
                          {formatCurrency(creator.sales)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground">Orders</p>
                        <p className="font-bold text-sm">{creator.orders}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground">Conversion</p>
                        <p className="font-bold text-sm text-teal">{creator.conversionRate}%</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs">
                      <Badge variant="outline" className={`font-medium ${creator.tierColor}`}>
                        {creator.tier} Tier
                      </Badge>
                      <span className="text-muted-foreground text-[11px]">
                        Comm: <strong>{formatCurrency(creator.commission)}</strong>
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : null}

        {/* Full Leaderboard Table */}
        <Card className="shadow-card">
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead className="border-y bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Rank</th>
                  <th className="px-5 py-3.5 font-medium">Influencer</th>
                  <th className="px-5 py-3.5 font-medium">Tier</th>
                  <th className="px-5 py-3.5 text-center font-medium">Clicks</th>
                  <th className="px-5 py-3.5 text-center font-medium">Orders</th>
                  <th className="px-5 py-3.5 font-medium">Conversion Rate</th>
                  <th className="px-5 py-3.5 text-right font-medium">Attributed Sales</th>
                  <th className="px-5 py-3.5 text-right font-medium">Commission Earned</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td colSpan={8} className="px-5 py-4">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                      </td>
                    </tr>
                  ))
                ) : leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">
                      No creator performance data recorded yet. As creators share their affiliate links on Instagram, their live ranks will appear here.
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((creator) => {
                    const progressPercent = Math.min(100, Math.round((creator.sales / maxCreatorSales) * 100));
                    return (
                      <tr key={creator.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4 font-bold text-muted-foreground">
                          {creator.rank === 1 ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 font-bold text-xs">
                              1
                            </span>
                          ) : creator.rank === 2 ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-400/15 text-slate-600 font-bold text-xs">
                              2
                            </span>
                          ) : creator.rank === 3 ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-700/15 text-amber-800 font-bold text-xs">
                              3
                            </span>
                          ) : (
                            `#${creator.rank}`
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold ${creator.color}`}>
                              {creator.initials}
                            </span>
                            <div>
                              <p className="font-semibold text-foreground flex items-center gap-1.5">
                                {creator.name}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Instagram className="h-3 w-3 text-pink-500" />
                                {creator.handle}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant="outline" className={`text-xs ${creator.tierColor}`}>
                            {creator.tier}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-center font-medium">
                          {creator.clicks.toLocaleString()}
                        </td>
                        <td className="px-5 py-4 text-center font-medium">
                          {creator.orders}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-teal text-xs w-10">
                              {creator.conversionRate}%
                            </span>
                            <Progress value={Math.min(100, creator.conversionRate * 10)} className="h-1.5 w-16" />
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <p className="font-bold text-foreground">{formatCurrency(creator.sales)}</p>
                          <div className="mt-1 flex items-center justify-end">
                            <div className="h-1 w-20 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${progressPercent}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(creator.commission)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>

      {/* Top Products Driven by Instagram Influencers */}
      <Card className="shadow-card">
        <CardHeader className="p-5">
          <CardTitle>Top Products Converted via Instagram</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Catalogue items driving the highest volume and revenue from creator traffic
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-y bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 text-center font-medium">Units Sold</th>
                <th className="px-5 py-3 text-right font-medium">Influencer Revenue</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td colSpan={3} className="px-5 py-4">
                      <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                    </td>
                  </tr>
                ))
              ) : topProducts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-12 text-center text-muted-foreground">
                    No product-specific influencer sales recorded yet.
                  </td>
                </tr>
              ) : (
                topProducts.map((product) => (
                  <tr key={product.id} className="border-b last:border-0 hover:bg-muted/10">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt=""
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                            <Package className="h-5 w-5" />
                          </span>
                        )}
                        <div>
                          <p className="font-semibold">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.price ? `₹${product.price}` : "Catalogue Item"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center font-medium">{product.orders}</td>
                    <td className="px-5 py-4 text-right font-bold text-foreground">
                      {formatCurrency(product.sales)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
