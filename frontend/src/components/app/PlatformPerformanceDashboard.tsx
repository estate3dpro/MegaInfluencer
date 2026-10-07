import React, { useState, useMemo } from "react";
import {
  ArrowUpDown,
  ArrowUpRight,
  BarChart3,
  Check,
  Copy,
  Download,
  ExternalLink,
  Facebook,
  Globe,
  Instagram,
  Layers,
  MessageCircle,
  MousePointerClick,
  Percent,
  PieChart as PieIcon,
  RefreshCw,
  Search,
  Share2,
  ShoppingBag,
  ShoppingCart,
  Sliders,
  Sparkles,
  Store,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PlatformPerformanceItem, PlatformTimelinePoint } from "@/features/influencer/api/analytics.api";

export interface PlatformPerformanceDashboardProps {
  role: "INFLUENCER" | "STORE_OWNER";
  range: string;
  onRangeChange: (range: string) => void;
  selectedPlatform: string;
  onPlatformChange: (platform: string) => void;
  platforms: PlatformPerformanceItem[];
  timeline: PlatformTimelinePoint[];
  isLoading?: boolean;
  isFetching?: boolean;
  onRefresh?: () => void;
  // Influencer specific
  storesList?: Array<{ id: string; name: string; slug: string }>;
  selectedStore?: string;
  onStoreChange?: (storeId: string) => void;
  // Store specific
  creatorsList?: Array<{ id: string; name: string; code: string | null }>;
  selectedCreator?: string;
  onCreatorChange?: (creatorId: string) => void;
  // Open Link Hub Modal callback
  onOpenLinkHub?: (platformName?: string) => void;
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  whatsapp: <MessageCircle className="h-4 w-4 text-emerald-500" />,
  facebook: <Facebook className="h-4 w-4 text-blue-500" />,
  instagram: <Instagram className="h-4 w-4 text-pink-500" />,
  custom: <Sliders className="h-4 w-4 text-primary" />,
};

function formatInr(val: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}

export const PlatformPerformanceDashboard: React.FC<PlatformPerformanceDashboardProps> = ({
  role,
  range,
  onRangeChange,
  selectedPlatform,
  onPlatformChange,
  platforms,
  timeline,
  isLoading,
  isFetching,
  onRefresh,
  storesList,
  selectedStore,
  onStoreChange,
  creatorsList,
  selectedCreator,
  onCreatorChange,
  onOpenLinkHub,
}) => {
  const [activeMetric, setActiveMetric] = useState<"clicks" | "orders" | "sales" | "earnings">("clicks");
  const [chartType, setChartType] = useState<"bar" | "area" | "pie">("bar");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"clicks" | "orders" | "sales" | "earnings" | "conversionRate">("clicks");
  const [sortAsc, setSortAsc] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Filter down to supported platforms only (WhatsApp, Facebook, Instagram, Custom)
  const displayPlatforms = useMemo(() => {
    return platforms.filter((p) => ["whatsapp", "facebook", "instagram", "custom"].includes(p.platform.toLowerCase()));
  }, [platforms]);

  // Aggregate totals
  const totalClicks = useMemo(() => displayPlatforms.reduce((acc, p) => acc + p.clicks, 0), [displayPlatforms]);
  const totalOrders = useMemo(() => displayPlatforms.reduce((acc, p) => acc + p.orders, 0), [displayPlatforms]);
  const totalSales = useMemo(() => displayPlatforms.reduce((acc, p) => acc + p.sales, 0), [displayPlatforms]);
  const totalEarnings = useMemo(
    () => displayPlatforms.reduce((acc, p) => acc + (p.earnings || (p as any).commissions || 0), 0),
    [displayPlatforms],
  );
  const avgCR = totalClicks > 0 ? Number(((totalOrders / totalClicks) * 100).toFixed(2)) : 0;

  // Best platform highlights
  const topPlatformByClicks = useMemo(() => {
    return [...displayPlatforms].sort((a, b) => b.clicks - a.clicks)[0];
  }, [displayPlatforms]);

  const topPlatformBySales = useMemo(() => {
    return [...displayPlatforms].sort((a, b) => b.sales - a.sales)[0];
  }, [displayPlatforms]);

  const topPlatformByCR = useMemo(() => {
    return [...displayPlatforms].filter((p) => p.clicks >= 5).sort((a, b) => b.conversionRate - a.conversionRate)[0];
  }, [displayPlatforms]);

  // Filtered and sorted table data
  const filteredPlatforms = useMemo(() => {
    return displayPlatforms
      .filter((p) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.platform.toLowerCase().includes(q) ||
          (p.topMedium && p.topMedium.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;
        if (sortField === "clicks") { valA = a.clicks; valB = b.clicks; }
        else if (sortField === "orders") { valA = a.orders; valB = b.orders; }
        else if (sortField === "sales") { valA = a.sales; valB = b.sales; }
        else if (sortField === "earnings") {
          valA = a.earnings || (a as any).commissions || 0;
          valB = b.earnings || (b as any).commissions || 0;
        } else if (sortField === "conversionRate") { valA = a.conversionRate; valB = b.conversionRate; }
        return sortAsc ? valA - valB : valB - valA;
      });
  }, [displayPlatforms, searchQuery, sortField, sortAsc]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Platform", "Clicks", "Unique Visitors", "Orders", "Conversion Rate %", "Sales (INR)", "Earnings/Commissions (INR)", "Top UTM Medium"];
    const rows = displayPlatforms.map((p) => [
      p.name,
      p.clicks,
      p.uniqueVisitors,
      p.orders,
      `${p.conversionRate}%`,
      p.sales,
      p.earnings || (p as any).commissions || 0,
      p.topMedium || "direct",
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `platform-performance-${range}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Platform performance report exported as CSV");
  };

  const handleQuickCopyLink = async (pKey: string, pName: string) => {
    try {
      const sourceParam = pKey === "custom" ? "custom" : pKey;
      const url = `${window.location.origin}/r/promo?utm_source=${sourceParam}&utm_medium=${pKey === "whatsapp" ? "social_chat" : pKey === "facebook" ? "social_post" : pKey === "instagram" ? "story_bio" : "campaign"}`;
      await navigator.clipboard.writeText(url);
      setCopiedSlug(pName);
      toast.success(`${pName} campaign tracking link copied!`);
      setTimeout(() => setCopiedSlug(null), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP FILTER BAR */}
      <Card className="border-border/60 shadow-sm bg-card/80 backdrop-blur-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left: Range and Platform selectors */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Range Selector */}
              <div className="flex rounded-xl border bg-muted/40 p-1">
                {[
                  { label: "Today", val: "today" },
                  { label: "7 Days", val: "7d" },
                  { label: "30 Days", val: "30d" },
                  { label: "90 Days", val: "90d" },
                  { label: "All Time", val: "all" },
                ].map((item) => (
                  <button
                    key={item.val}
                    onClick={() => onRangeChange(item.val)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      range === item.val
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Platform Filter Dropdown (WhatsApp, Facebook, Instagram, Custom) */}
              <Select value={selectedPlatform} onValueChange={onPlatformChange}>
                <SelectTrigger className="w-44 sm:w-48 h-9 text-xs rounded-xl bg-background border">
                  <Sliders className="mr-1.5 h-3.5 w-3.5 text-primary" />
                  <SelectValue placeholder="All Available Platforms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🌐 All Available ({displayPlatforms.length})</SelectItem>
                  <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                  <SelectItem value="facebook">📘 Facebook</SelectItem>
                  <SelectItem value="instagram">📸 Instagram</SelectItem>
                  <SelectItem value="custom">⚙️ Custom UTM / Direct</SelectItem>
                </SelectContent>
              </Select>

              {/* Store Filter (For Influencer) */}
              {role === "INFLUENCER" && storesList && onStoreChange && (
                <Select value={selectedStore || "all"} onValueChange={onStoreChange}>
                  <SelectTrigger className="w-40 sm:w-48 h-9 text-xs rounded-xl bg-background border">
                    <Store className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="All Stores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🏪 All Connected Stores</SelectItem>
                    {storesList.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Creator Filter (For Store Owner) */}
              {role === "STORE_OWNER" && creatorsList && onCreatorChange && (
                <Select value={selectedCreator || "all"} onValueChange={onCreatorChange}>
                  <SelectTrigger className="w-40 sm:w-48 h-9 text-xs rounded-xl bg-background border">
                    <Users className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="All Creators" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">👥 All Creators</SelectItem>
                    {creatorsList.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.code ? `(#${c.code})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {onOpenLinkHub && (
                <Button
                  onClick={() => onOpenLinkHub()}
                  size="sm"
                  className="h-9 text-xs font-bold gap-1.5 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white shadow-sm rounded-xl"
                >
                  <Share2 className="h-3.5 w-3.5" /> Campaign Link Hub
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="h-9 text-xs font-semibold gap-1.5 rounded-xl"
              >
                <Download className="h-3.5 w-3.5 text-muted-foreground" /> Export
              </Button>

              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={isFetching}
                  className="h-9 w-9 p-0 rounded-xl"
                >
                  <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin text-primary" : ""}`} />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. PLATFORM HIGHLIGHT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Clicks */}
        <Card className="p-4 rounded-2xl border bg-gradient-to-br from-background to-muted/20 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Campaign Clicks</span>
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <MousePointerClick className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight">{totalClicks.toLocaleString()}</p>
          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>{displayPlatforms.length} active channels</span>
            <span className="text-primary font-semibold">
              Top: {topPlatformByClicks?.name || "WhatsApp"}
            </span>
          </div>
        </Card>

        {/* Total Orders */}
        <Card className="p-4 rounded-2xl border bg-gradient-to-br from-background to-muted/20 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Attributed Orders</span>
            <div className="h-8 w-8 rounded-xl bg-teal/10 text-teal flex items-center justify-center font-bold">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-teal">{totalOrders.toLocaleString()}</p>
          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Conv. Rate: <strong className="text-foreground">{avgCR}%</strong></span>
            <span className="text-teal font-semibold">
              Best CR: {topPlatformByCR?.name || "WhatsApp"} ({topPlatformByCR?.conversionRate || 0}%)
            </span>
          </div>
        </Card>

        {/* Gross Sales */}
        <Card className="p-4 rounded-2xl border bg-gradient-to-br from-background to-muted/20 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Gross Sales (GMV)</span>
            <div className="h-8 w-8 rounded-xl bg-coral/10 text-coral flex items-center justify-center font-bold">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-coral">{formatInr(totalSales)}</p>
          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>AOV: <strong className="text-foreground">{formatInr(totalOrders > 0 ? totalSales / totalOrders : 0)}</strong></span>
            <span className="text-coral font-semibold">
              Top GMV: {topPlatformBySales?.name || "WhatsApp"}
            </span>
          </div>
        </Card>

        {/* Total Commission / Earnings */}
        <Card className="p-4 rounded-2xl border bg-gradient-to-br from-background to-muted/20 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {role === "INFLUENCER" ? "Commission Earnings" : "Commissions Paid"}
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {formatInr(totalEarnings)}
          </p>
          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Effective Rate: <strong className="text-foreground">15.0%</strong></span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">100% Attributed</span>
          </div>
        </Card>
      </div>

      {/* 3. PLATFORM VISUALIZATION CHART */}
      <Card className="shadow-card border-border/70">
        <CardHeader className="p-4 sm:p-5 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Campaign Platform Performance
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Comparison across WhatsApp, Facebook, Instagram, and Custom UTM links.
              </p>
            </div>

            {/* Metric Switcher & Chart View Toggle */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border bg-muted/40 p-0.5">
                {[
                  { key: "clicks", label: "Clicks" },
                  { key: "orders", label: "Orders" },
                  { key: "sales", label: "Sales (₹)" },
                  { key: "earnings", label: role === "INFLUENCER" ? "Earnings" : "Commissions" },
                ].map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setActiveMetric(m.key as any)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                      activeMetric === m.key
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="flex rounded-lg border bg-muted/40 p-0.5">
                <button
                  onClick={() => setChartType("bar")}
                  className={`p-1.5 rounded-md text-xs transition-all ${
                    chartType === "bar" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                  title="Bar Comparison"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setChartType("area")}
                  className={`p-1.5 rounded-md text-xs transition-all ${
                    chartType === "area" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                  title="Timeline Trend"
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setChartType("pie")}
                  className={`p-1.5 rounded-md text-xs transition-all ${
                    chartType === "pie" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                  title="Share of Distribution"
                >
                  <PieIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 pt-2">
          <div className="h-[320px] w-full">
            {chartType === "bar" && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayPlatforms} margin={{ top: 15, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" opacity={0.6} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    tickFormatter={(val) => (activeMetric === "sales" || activeMetric === "earnings" ? `₹${val >= 1000 ? `${Math.round(val / 1000)}k` : val}` : String(val))}
                  />
                  <Tooltip
                    contentStyle={{
                      borderColor: "var(--border)",
                      borderRadius: 12,
                      background: "var(--card)",
                      boxShadow: "0 8px 24px -8px rgba(0,0,0,0.15)",
                    }}
                    formatter={(val, name, item) => [
                      activeMetric === "sales" || activeMetric === "earnings"
                        ? formatInr(Number(val))
                        : Number(val).toLocaleString(),
                      item.payload.name,
                    ]}
                  />
                  <Bar
                    dataKey={activeMetric === "earnings" ? (role === "INFLUENCER" ? "earnings" : "commissions") : activeMetric}
                    radius={[8, 8, 0, 0]}
                  >
                    {displayPlatforms.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || "var(--primary)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {chartType === "area" && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline} margin={{ top: 15, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="waGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="fbGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1877f2" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#1877f2" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="igGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e1306c" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#e1306c" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="customGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" opacity={0.6} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tickMargin={10} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tickMargin={8} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderColor: "var(--border)", borderRadius: 12, background: "var(--card)" }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: "8px", fontSize: "12px" }} />
                  <Area type="monotone" dataKey="whatsappClicks" name="WhatsApp" stroke="#10b981" fill="url(#waGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="facebookClicks" name="Facebook" stroke="#1877f2" fill="url(#fbGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="instagramClicks" name="Instagram" stroke="#e1306c" fill="url(#igGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="customClicks" name="Custom UTM" stroke="#6366f1" fill="url(#customGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {chartType === "pie" && (
              <div className="grid grid-cols-1 md:grid-cols-2 h-full items-center">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Tooltip
                      contentStyle={{ borderColor: "var(--border)", borderRadius: 12, background: "var(--card)" }}
                      formatter={(val, name, item) => [
                        `${Number(val).toLocaleString()} clicks (${item.payload.share}%)`,
                        item.payload.name,
                      ]}
                    />
                    <Pie
                      data={displayPlatforms}
                      dataKey="clicks"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                    >
                      {displayPlatforms.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || "#6366f1"} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Pie Legend Breakdown */}
                <div className="space-y-2.5 pr-4">
                  {displayPlatforms.map((p) => (
                    <div key={p.platform} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="font-medium text-foreground">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">{p.clicks} clicks</span>
                        <Badge variant="secondary" className="text-[10px] font-bold">
                          {p.share}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 4. PLATFORM BREAKDOWN DATA TABLE */}
      <Card className="shadow-card border-border/70 overflow-hidden">
        <CardHeader className="p-4 sm:p-5 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Platform Breakdown & Attribution Report
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Channel breakdown for WhatsApp, Facebook, Instagram, and Custom UTM links.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter platforms / mediums..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 text-xs rounded-xl"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-y border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3.5 pl-5 font-bold">Platform / Channel</th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort("clicks")}
                  >
                    <div className="flex items-center gap-1">
                      Total Clicks
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="p-3.5">Traffic Share</th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort("orders")}
                  >
                    <div className="flex items-center gap-1">
                      Orders
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort("conversionRate")}
                  >
                    <div className="flex items-center gap-1">
                      Conversion Rate
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort("sales")}
                  >
                    <div className="flex items-center gap-1">
                      Gross GMV
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th
                    className="p-3.5 cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSort("earnings")}
                  >
                    <div className="flex items-center gap-1">
                      {role === "INFLUENCER" ? "Earnings" : "Commission"}
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="p-3.5 pr-5 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredPlatforms.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      No platform data matching your filter.
                    </td>
                  </tr>
                ) : (
                  filteredPlatforms.map((row) => {
                    const earningsVal = row.earnings || (row as any).commissions || 0;
                    return (
                      <tr key={row.platform} className="hover:bg-muted/30 transition-colors">
                        {/* Platform Name & Icon */}
                        <td className="p-3.5 pl-5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-xl bg-background border flex items-center justify-center shadow-xs shrink-0">
                              {PLATFORM_ICONS[row.platform] || <Globe className="h-4 w-4 text-primary" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-foreground text-xs">{row.name}</span>
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${row.badgeClass}`}>
                                  {row.platform}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                                utm_medium={row.topMedium || "social"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Clicks */}
                        <td className="p-3.5 font-bold text-foreground font-mono">
                          {row.clicks.toLocaleString()}
                        </td>

                        {/* Share Progress Bar */}
                        <td className="p-3.5 min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${row.share}%`,
                                  backgroundColor: row.color || "var(--primary)",
                                }}
                              />
                            </div>
                            <span className="text-[11px] font-semibold text-muted-foreground w-9 text-right">
                              {row.share}%
                            </span>
                          </div>
                        </td>

                        {/* Orders */}
                        <td className="p-3.5 font-bold text-foreground">
                          {row.orders.toLocaleString()}
                        </td>

                        {/* Conversion Rate */}
                        <td className="p-3.5">
                          <Badge
                            className={`text-xs font-bold ${
                              row.conversionRate >= 4
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                : row.conversionRate >= 2
                                ? "bg-teal/15 text-teal border-teal/20"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {row.conversionRate}%
                          </Badge>
                        </td>

                        {/* Gross Sales */}
                        <td className="p-3.5 font-bold text-foreground font-mono">
                          {formatInr(row.sales)}
                        </td>

                        {/* Earnings / Commission */}
                        <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          {formatInr(earningsVal)}
                        </td>

                        {/* Quick Actions */}
                        <td className="p-3.5 pr-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleQuickCopyLink(row.platform, row.name)}
                              className="h-7 px-2 text-[11px] font-semibold hover:bg-primary/10 hover:text-primary rounded-lg"
                              title="Copy tagged UTM link"
                            >
                              {copiedSlug === row.name ? <Check className="h-3 w-3 mr-1 text-emerald-500" /> : <Copy className="h-3 w-3 mr-1" />}
                              {copiedSlug === row.name ? "Copied" : "Copy"}
                            </Button>

                            {onOpenLinkHub && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onOpenLinkHub(row.platform)}
                                className="h-7 px-2 text-[11px] font-semibold rounded-lg hover:border-primary hover:text-primary"
                                title="Open Hub Modal"
                              >
                                <Share2 className="h-3 w-3 mr-1" /> Hub
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
