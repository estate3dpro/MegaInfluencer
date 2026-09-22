import { useQuery } from "@tanstack/react-query";
import {
  BadgeIndianRupee,
  CalendarDays,
  CheckCircle2,
  Download,
  ExternalLink,
  Info,
  Megaphone,
  Sparkles,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { getAdminAnalytics, getAdminCampaigns, getAdminDashboard } from "../api/overview.api";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function AnalyticsPage() {
  const analyticsQuery = useQuery({ queryKey: ["admin", "analytics"], queryFn: getAdminAnalytics });
  const dashQuery = useQuery({ queryKey: ["admin", "dashboard"], queryFn: getAdminDashboard });
  const campaignsQuery = useQuery({ queryKey: ["admin", "campaigns"], queryFn: () => getAdminCampaigns() });

  const overview = analyticsQuery.data?.overview ?? {
    totalPlatformGMV: 0,
    creatorAttributedGMV: 0,
    totalCommissionsPaid: 0,
    totalOrdersCount: 0,
    attributedOrdersCount: 0,
    totalClicksCount: 0,
    conversionRate: 0,
  };

  const placements = analyticsQuery.data?.placements ?? [];
  const monthlyPerformance = dashQuery.data?.monthlyPerformance ?? [];
  const campaigns = (campaignsQuery.data?.campaigns ?? []).slice(0, 5);

  const colors = ["bg-fuchsia-500", "bg-violet-500", "bg-sky-500", "bg-emerald-500"];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Analytics & Performance"
        description="Cross-brand growth metrics, creator revenue attribution, conversion funnels, and channel share."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.success("Analytics statement generated")}
          >
            <Download className="h-4 w-4 mr-1" /> Export Report
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Total Platform Revenue (GMV)</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-2xl font-bold tracking-tight">{formatCurrency(overview.totalPlatformGMV)}</p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {overview.totalOrdersCount} orders across all merchant brands
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Creator Attributed Sales</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-2xl font-bold tracking-tight text-primary">
                {formatCurrency(overview.creatorAttributedGMV)}
              </p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {overview.attributedOrdersCount} orders via influencer referral
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Referral Conversion Rate</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-2xl font-bold tracking-tight text-teal">
                {overview.conversionRate}%
              </p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              From {overview.totalClicksCount.toLocaleString()} tracked link visits
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="shadow-card xl:col-span-2">
          <CardHeader className="p-5 pb-0">
            <CardTitle className="text-lg">Monthly Revenue Trend</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Aggregated order volume by month</p>
          </CardHeader>
          <CardContent className="h-[270px] p-2 pt-5 sm:p-5 sm:pt-5">
            {monthlyPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyPerformance} margin={{ top: 20, right: 8, left: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="analyticsLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                    <linearGradient id="analyticsFill" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#ec4899" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(v: any) => [formatCurrency(Number(v)), "GMV"]}
                    contentStyle={{ borderRadius: "8px", border: "none", backgroundColor: "black", color: "white" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="url(#analyticsLine)"
                    strokeWidth={3}
                    fill="url(#analyticsFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No revenue history recorded yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-lg">Attributed Channels</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Social & checkout touchpoints</p>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-3">
            {placements.map((p, idx) => (
              <div key={p.channel}>
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground">{p.channel}</span>
                  <span className="font-semibold text-muted-foreground">{p.share}%</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground font-semibold">{formatCurrency(p.gmv)}</p>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${colors[idx % colors.length]}`}
                    style={{ width: `${p.share}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Top Campaigns Table */}
      <Card className="shadow-card overflow-hidden">
        <CardHeader className="p-5 pb-2">
          <CardTitle className="text-lg">Top Active Campaigns</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Highest performing partnerships</p>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-y bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Campaign</th>
                <th className="px-5 py-3 font-medium">Brand</th>
                <th className="px-5 py-3 text-center font-medium">Applications</th>
                <th className="px-5 py-3 text-center font-medium">Assigned Creators</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                    No campaigns created yet.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/15 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-foreground">{c.title}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{c.storeName}</td>
                    <td className="px-5 py-3.5 text-center font-semibold text-primary">{c.applicationsCount}</td>
                    <td className="px-5 py-3.5 text-center font-medium">{c.assignedCreatorsCount}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant="outline" className="border-teal/30 bg-teal/5 text-teal text-xs">
                        {c.status}
                      </Badge>
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
