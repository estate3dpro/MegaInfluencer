import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CheckCircle2,
  Instagram,
  Link2,
  MousePointerClick,
  ShoppingCart,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminAnalytics, getAdminCommissions } from "../api/overview.api";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function AttributionPage() {
  const analyticsQuery = useQuery({ queryKey: ["admin", "analytics"], queryFn: getAdminAnalytics });
  const commQuery = useQuery({ queryKey: ["admin", "commissions"], queryFn: () => getAdminCommissions() });

  const overview = analyticsQuery.data?.overview ?? {
    totalPlatformGMV: 0,
    creatorAttributedGMV: 0,
    totalCommissionsPaid: 0,
    totalOrdersCount: 0,
    attributedOrdersCount: 0,
    totalClicksCount: 0,
    conversionRate: 0,
  };

  const commissions = commQuery.data?.commissions ?? [];

  // Group top creators by revenue
  const creatorMap = new Map<string, { name: string; handle: string | null; orders: number; revenue: number }>();
  for (const c of commissions) {
    const key = c.creator?.id ?? "unknown";
    if (!creatorMap.has(key)) {
      creatorMap.set(key, {
        name: c.creator?.name ?? "Creator",
        handle: c.creator?.instagram ? `@${c.creator.instagram}` : c.creator?.code ? `@${c.creator.code}` : null,
        orders: 0,
        revenue: 0,
      });
    }
    const item = creatorMap.get(key)!;
    item.orders += 1;
    item.revenue += c.orderAmount;
  }

  const topCreators = Array.from(creatorMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const clicks = overview.totalClicksCount || 1;
  const orders = overview.attributedOrdersCount;
  const funnel = [
    ["Tracked UTM Link Clicks", `${overview.totalClicksCount.toLocaleString()} visits`, "100%", "bg-primary"],
    ["Attributed Checkouts & Orders", `${orders.toLocaleString()} orders placed`, `${overview.conversionRate}%`, "bg-teal"],
    ["Creator Commissions Accrued", formatCurrency(overview.totalCommissionsPaid), "100%", "bg-coral"],
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Creator Attribution & Tracking Engine"
        description="Monitor end-to-end attribution pipelines, UTM parameter resolution, and conversion tracking."
        actions={
          <Button asChild size="sm">
            <Link to="/admin/commissions">
              <Sparkles className="h-4 w-4 mr-1" /> View Commissions
            </Link>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Attributed GMV</p>
                <p className="mt-2 text-2xl font-bold">{formatCurrency(overview.creatorAttributedGMV)}</p>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <Link2 className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Driven by influencer referrals</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Attributed Orders</p>
                <p className="mt-2 text-2xl font-bold">{orders.toLocaleString()}</p>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal/10 text-teal">
                <ShoppingCart className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Of {overview.totalOrdersCount} total platform orders</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Conversion Rate</p>
                <p className="mt-2 text-2xl font-bold">{overview.conversionRate}%</p>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-coral/10 text-coral">
                <MousePointerClick className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Clicks to verified purchases</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Active Partner Roster</p>
                <p className="mt-2 text-2xl font-bold">{creatorMap.size}</p>
              </div>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo/10 text-indigo">
                <UsersRound className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Creators with attributed sales</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-5">
        <Card className="shadow-card xl:col-span-2">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-base">Attribution Funnel</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Creator-led conversion funnel</p>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-2">
            {funnel.map(([label, value, rate, color]) => (
              <div key={label}>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs font-semibold text-foreground">{label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{value}</p>
                  </div>
                  <span className="text-xs font-bold text-primary">{rate}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${color}`} style={{ width: rate }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-card xl:col-span-3">
          <CardHeader className="flex-row items-center justify-between space-y-0 p-5 pb-2">
            <div>
              <CardTitle className="text-base">Attribution Engine Health</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Order matching accuracy & webhook attribution pipeline
              </p>
            </div>
            <Badge variant="outline" className="border-teal/30 bg-teal/5 text-teal text-xs font-medium">
              Active Sync
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-4 p-5 pt-2 sm:grid-cols-3">
            {[
              ["Direct Link Match", "Automatic referral tracking via /r/:slug redirect cookies and UTM tags."],
              ["Promo Code Attribution", "Checkout matching for influencer creator discount codes."],
              ["Shopify Webhook Bridge", "Instant real-time attribution on order creation and payment confirmation."],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-lg border bg-muted/20 p-4">
                <p className="font-semibold text-xs text-foreground">{title}</p>
                <p className="mt-1 text-xs text-muted-foreground leading-5">{desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Top Attributed Creators */}
      <Card className="shadow-card overflow-hidden">
        <CardHeader className="p-5 pb-2">
          <CardTitle className="text-base">Top Performing Attributed Influencers</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">Ranked by total verified sales generated</p>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-y bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Creator</th>
                <th className="px-4 py-3 font-medium">Handle / Code</th>
                <th className="px-4 py-3 text-center font-medium">Attributed Orders</th>
                <th className="px-5 py-3 text-right font-medium">Total GMV Driven</th>
              </tr>
            </thead>
            <tbody>
              {topCreators.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                    No attributed orders recorded yet.
                  </td>
                </tr>
              ) : (
                topCreators.map((c, idx) => (
                  <tr key={idx} className="border-b last:border-0 hover:bg-muted/15 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-foreground">{c.name}</td>
                    <td className="px-4 py-3.5 text-xs text-pink-600 dark:text-pink-400 font-medium">
                      {c.handle || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-center font-semibold text-primary">{c.orders}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-foreground">
                      {formatCurrency(c.revenue)}
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
