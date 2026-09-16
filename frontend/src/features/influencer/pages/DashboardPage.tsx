import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, BadgeIndianRupee, CheckCircle2, ChevronRight, CircleDollarSign, Clock3, Eye, Heart, Images, Instagram, ShoppingBag, Sparkles, Target, Users } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getInstagramProfile } from "@/features/influencer/api/instagram.api";
import { queryKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import { initials } from "@/lib/format";

const metrics: Array<{ label: string; value: string; change: string; detail: string; icon: LucideIcon; tone: string }> = [
  { label: "This month's earnings", value: "₹24,680", change: "+18.4%", detail: "vs. last month", icon: BadgeIndianRupee, tone: "bg-primary/10 text-primary" },
  { label: "Attributed sales", value: "₹1,12,450", change: "+12.8%", detail: "from your links", icon: ShoppingBag, tone: "bg-teal/10 text-teal" },
  { label: "Link clicks", value: "3,842", change: "+9.2%", detail: "this month", icon: Target, tone: "bg-coral/10 text-coral" },
  { label: "Engagement rate", value: "5.8%", change: "+0.6%", detail: "across recent posts", icon: Heart, tone: "bg-indigo/10 text-indigo" },
];
const earnings = [{ date: "01", amount: 840 }, { date: "04", amount: 1240 }, { date: "07", amount: 980 }, { date: "10", amount: 1660 }, { date: "13", amount: 1450 }, { date: "16", amount: 2160 }, { date: "19", amount: 1890 }, { date: "22", amount: 2460 }, { date: "25", amount: 2210 }, { date: "28", amount: 2980 }];
const campaigns = [
  { brand: "Urban Threads", campaign: "Festive Edit 2026", due: "Due in 2 days", progress: 75, status: "Content review", tone: "bg-primary" },
  { brand: "Glow Theory", campaign: "Everyday Radiance", due: "Due Sep 22", progress: 40, status: "Brief received", tone: "bg-coral" },
  { brand: "Kind Kitchen", campaign: "Healthy Snacking", due: "Due Sep 28", progress: 15, status: "Getting started", tone: "bg-teal" },
];
const activity = [
  { title: "Commission approved", detail: "Urban Threads · Order #UT-10482", value: "+₹1,248", icon: CheckCircle2, tone: "bg-success/10 text-success" },
  { title: "New campaign invitation", detail: "Glow Theory invited you to Everyday Radiance", value: "View brief", icon: Sparkles, tone: "bg-primary/10 text-primary" },
  { title: "Payout scheduled", detail: "Your ₹18,400 payout arrives Sep 20", value: "In 5 days", icon: CircleDollarSign, tone: "bg-teal/10 text-teal" },
];
const number = new Intl.NumberFormat("en-IN");

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const instagramQuery = useQuery({ queryKey: queryKeys.instagram.profile, queryFn: getInstagramProfile, staleTime: 60_000 });
  const instagram = instagramQuery.data;
  const creatorName = instagram?.profile.name || instagram?.connection.displayName || user?.name || "Influencer";
  const instagramName = instagram?.profile.username || instagram?.connection.username;
  return <div className="space-y-6">
    <PageHeader title={`Good morning, ${creatorName.split(" ")[0]}`} description="A quick view of your creator performance and opportunities." actions={<Button asChild><Link to="/influencer/profile"><Instagram className="h-4 w-4" /> View profile</Link></Button>} />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}</section>
    <section className="grid gap-6 xl:grid-cols-3">
      <Card className="shadow-card xl:col-span-2"><CardHeader className="flex-row items-start justify-between space-y-0 p-5 pb-2"><div><CardTitle>Earnings performance</CardTitle><p className="mt-1 text-sm text-muted-foreground">Commission earned over the last 30 days</p></div><Badge variant="secondary">Last 30 days</Badge></CardHeader><CardContent className="h-[280px] p-3 pt-5 sm:p-5 sm:pt-5"><ResponsiveContainer width="100%" height="100%"><AreaChart data={earnings} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}><defs><linearGradient id="creatorEarnings" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={0.01} /></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="date" axisLine={false} tickLine={false} tickMargin={10} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} /><YAxis axisLine={false} tickLine={false} tickMargin={8} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickFormatter={(value) => `₹${value / 1000}k`} /><Tooltip contentStyle={{ borderColor: "var(--border)", borderRadius: 10, background: "var(--card)" }} formatter={(value) => [`₹${number.format(Number(value))}`, "Earnings"]} labelFormatter={(label) => `September ${label}`} /><Area type="monotone" dataKey="amount" stroke="var(--primary)" strokeWidth={2.5} fill="url(#creatorEarnings)" /></AreaChart></ResponsiveContainer></CardContent></Card>
      <Card className="shadow-card"><CardHeader className="p-5 pb-3"><CardTitle>Instagram snapshot</CardTitle><p className="mt-1 text-sm text-muted-foreground">Your connected account at a glance</p></CardHeader><CardContent className="space-y-4 p-5 pt-3"><div className="flex items-center gap-3 rounded-xl bg-muted/45 p-3"><Avatar className="h-11 w-11"><AvatarFallback className="bg-primary text-sm font-bold text-primary-foreground">{initials(creatorName)}</AvatarFallback></Avatar><div><p className="font-semibold">{creatorName}</p><p className="text-xs text-muted-foreground">{instagramName ? `@${instagramName}` : "Instagram not connected"}</p></div><Badge className="ml-auto bg-success/15 text-success hover:bg-success/15">{instagram?.connection.status === "ACTIVE" ? "Connected" : instagramQuery.isLoading ? "Loading" : "Unavailable"}</Badge></div><div className="grid grid-cols-3 divide-x rounded-xl border py-3 text-center"><SocialStat label="Followers" value={formatInstagramNumber(instagram?.profile.followers_count)} icon={Users} /><SocialStat label="Following" value={formatInstagramNumber(instagram?.profile.follows_count)} icon={Eye} /><SocialStat label="Posts" value={formatInstagramNumber(instagram?.profile.media_count)} icon={Images} /></div><div className="rounded-xl border border-dashed p-3"><div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Connection status</span><span className="font-semibold">{instagram?.connection.status === "ACTIVE" ? "Active" : instagramQuery.isLoading ? "Checking..." : "Not connected"}</span></div><p className="mt-2 text-xs text-muted-foreground">{instagram?.connection.connectedAt ? `Connected ${new Date(instagram.connection.connectedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}` : "Connect Instagram in Profile to see live account statistics."}</p></div></CardContent></Card>
    </section>
    <section className="grid gap-6 xl:grid-cols-3">
      <Card className="shadow-card xl:col-span-2"><CardHeader className="flex-row items-center justify-between space-y-0 p-5 pb-3"><div><CardTitle>Active campaigns</CardTitle><p className="mt-1 text-sm text-muted-foreground">Keep your deliverables moving forward</p></div><Button asChild variant="ghost" size="sm"><Link to="/influencer/campaigns">View all <ChevronRight className="h-4 w-4" /></Link></Button></CardHeader><CardContent className="space-y-3 p-5 pt-1">{campaigns.map((campaign) => <div key={campaign.campaign} className="rounded-xl border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium">{campaign.campaign}</p><p className="mt-0.5 text-sm text-muted-foreground">{campaign.brand}</p></div><div className="text-right"><Badge variant="secondary">{campaign.status}</Badge><p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" />{campaign.due}</p></div></div><div className="mt-3 flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${campaign.tone}`} style={{ width: `${campaign.progress}%` }} /></div><span className="text-xs font-medium">{campaign.progress}%</span></div></div>)}</CardContent></Card>
      <Card className="shadow-card"><CardHeader className="p-5 pb-3"><CardTitle>Recent activity</CardTitle><p className="mt-1 text-sm text-muted-foreground">Updates from your workspace</p></CardHeader><CardContent className="space-y-4 p-5 pt-2">{activity.map((item) => { const Icon = item.icon; return <div key={item.title} className="flex gap-3"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${item.tone}`}><Icon className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-medium">{item.title}</p><p className="mt-0.5 text-xs leading-5 text-muted-foreground">{item.detail}</p></div><span className="shrink-0 text-xs font-medium text-primary">{item.value}</span></div>; })}</CardContent></Card>
    </section>
  </div>;
}

function MetricCard({ metric }: { metric: (typeof metrics)[number] }) { const Icon = metric.icon; return <Card className="shadow-card"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><p className="text-sm font-medium text-muted-foreground">{metric.label}</p><span className={`grid h-9 w-9 place-items-center rounded-lg ${metric.tone}`}><Icon className="h-4 w-4" /></span></div><p className="mt-3 font-display text-2xl font-semibold tracking-tight">{metric.value}</p><p className="mt-2 flex items-center gap-1 text-xs"><span className="inline-flex items-center gap-0.5 font-medium text-success"><ArrowUpRight className="h-3.5 w-3.5" />{metric.change}</span><span className="text-muted-foreground">{metric.detail}</span></p></CardContent></Card>; }
function SocialStat({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) { return <div className="px-2"><Icon className="mx-auto h-3.5 w-3.5 text-muted-foreground" /><p className="mt-1 text-sm font-semibold">{value}</p><p className="text-[11px] text-muted-foreground">{label}</p></div>; }
function formatInstagramNumber(value?: number) { return typeof value === "number" ? new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(value) : "—"; }
