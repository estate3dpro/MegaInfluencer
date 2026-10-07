import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  Crown,
  ExternalLink,
  Layers,
  Medal,
  MousePointerClick,
  Package,
  RefreshCw,
  Share2,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Trophy,
  UsersRound,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformPerformanceDashboard } from "@/components/app/PlatformPerformanceDashboard";
import {
  PlatformLinkGeneratorModal,
  type PlatformLinkItem,
} from "@/components/app/PlatformLinkGeneratorModal";
import { getStoreAnalytics } from "../api/analytics.api";

function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function AnalyticsPage() {
  const [range, setRange] = useState<string>("30d");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedCreator, setSelectedCreator] = useState<string>("all");
  const [isLinkHubOpen, setIsLinkHubOpen] = useState(false);
  const [activeLinkItem, setActiveLinkItem] = useState<PlatformLinkItem | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["store", "analytics", range, selectedPlatform, selectedCreator],
    queryFn: () => getStoreAnalytics(range, selectedPlatform, selectedCreator),
  });

  const platforms = data?.platformBreakdown ?? [];
  const timeline = data?.platformTimeline ?? [];
  const leaderboard = data?.leaderboard ?? [];
  const topProducts = data?.topProducts ?? [];
  const creatorsList = data?.creatorsList ?? [];

  const handleOpenLinkHub = (platformName?: string) => {
    const firstCreator = leaderboard[0];
    const defaultLink: PlatformLinkItem = {
      id: "store_campaign_link",
      baseUrl: "/r/sarah88-store",
      storeName: "Urban Threads",
      creatorName: firstCreator?.name || "Sarah Jenkins",
      creatorCode: "SARAH88_PRO",
      commissionRate: 15,
      slug: "sarah88-store",
    };
    setActiveLinkItem(defaultLink);
    setIsLinkHubOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform & Creator Analytics Hub"
        description="Monitor multi-platform acquisition channels, attribution funnels, and creator performance across WhatsApp, Instagram, Facebook, and more."
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleOpenLinkHub()}
              size="sm"
              className="gap-1.5 font-bold rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <Share2 className="h-3.5 w-3.5" /> Campaign Link Hub
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="rounded-xl"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin text-primary" : ""}`} />
            </Button>
          </div>
        }
      />

      {/* 1. Core Platform-Wise Performance Dashboard (Graph + Table + Multi-Filters) */}
      <PlatformPerformanceDashboard
        role="STORE_OWNER"
        range={range}
        onRangeChange={setRange}
        selectedPlatform={selectedPlatform}
        onPlatformChange={setSelectedPlatform}
        platforms={platforms}
        timeline={timeline}
        isLoading={isLoading}
        isFetching={isFetching}
        onRefresh={() => void refetch()}
        creatorsList={creatorsList}
        selectedCreator={selectedCreator}
        onCreatorChange={setSelectedCreator}
        onOpenLinkHub={handleOpenLinkHub}
      />

      {/* 2. Secondary Insights: Creator Leaderboard & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Creator Leaderboard */}
        <Card className="lg:col-span-2 shadow-card border-border/70">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" /> Top Performing Creators
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ranked by gross sales volume and conversion rate
                </p>
              </div>
              <Badge variant="secondary" className="text-xs font-semibold">
                {leaderboard.length} Creators
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 border-y border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3 pl-5">Rank & Creator</th>
                    <th className="p-3">Clicks</th>
                    <th className="p-3">Orders</th>
                    <th className="p-3">Conv. Rate</th>
                    <th className="p-3">Sales (GMV)</th>
                    <th className="p-3 pr-5">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-muted-foreground">
                        No creator data found.
                      </td>
                    </tr>
                  ) : (
                    leaderboard.slice(0, 5).map((c) => (
                      <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 pl-5">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                c.rank === 1
                                  ? "bg-amber-500/20 text-amber-600 border border-amber-500/30"
                                  : c.rank === 2
                                  ? "bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {c.rank}
                            </span>
                            <div>
                              <p className="font-bold text-foreground text-xs">{c.name}</p>
                              <p className="text-[11px] text-muted-foreground">{c.handle}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-semibold font-mono">{c.clicks.toLocaleString()}</td>
                        <td className="p-3 font-semibold text-foreground">{c.orders}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[11px] font-bold">
                            {c.conversionRate}%
                          </Badge>
                        </td>
                        <td className="p-3 font-bold text-foreground font-mono">
                          {formatCurrency(c.sales)}
                        </td>
                        <td className="p-3 pr-5 font-bold text-teal font-mono">
                          {formatCurrency(c.commission)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="shadow-card border-border/70">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" /> Top Converting Products
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Highest grossing products across all creator channels
            </p>
          </CardHeader>
          <CardContent className="p-5 pt-1 space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No product sales recorded yet.</p>
            ) : (
              topProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl border bg-muted/20">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-background border flex items-center justify-center shrink-0 overflow-hidden">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs truncate">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{p.orders} orders</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-xs text-foreground font-mono">{formatCurrency(p.sales)}</p>
                    <p className="text-[10px] text-teal font-semibold">Attributed</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Link Generator Modal */}
      <PlatformLinkGeneratorModal
        open={isLinkHubOpen}
        onOpenChange={setIsLinkHubOpen}
        linkItem={activeLinkItem}
      />
    </div>
  );
}
