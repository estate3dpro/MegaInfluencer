import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, BadgeIndianRupee, BarChart3, Eye, Heart, MessageCircle, MousePointerClick, Send, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const overview: Array<{ label: string; value: string; change: string; icon: LucideIcon; tone: string }> = [
  { label: "Accounts reached", value: "126.4K", change: "+22.6%", icon: Eye, tone: "bg-primary/10 text-primary" },
  { label: "Content engagement", value: "7,318", change: "+14.2%", icon: Heart, tone: "bg-coral/10 text-coral" },
  { label: "Profile visits", value: "8,946", change: "+8.7%", icon: Users, tone: "bg-teal/10 text-teal" },
  { label: "Link clicks", value: "3,842", change: "+9.2%", icon: MousePointerClick, tone: "bg-indigo/10 text-indigo" },
];

const audienceTrend = [
  { day: "01", followers: 81200, reached: 4800 }, { day: "04", followers: 81640, reached: 6900 },
  { day: "07", followers: 81980, reached: 5900 }, { day: "10", followers: 82440, reached: 8200 },
  { day: "13", followers: 82810, reached: 7500 }, { day: "16", followers: 83270, reached: 9400 },
  { day: "19", followers: 83680, reached: 8700 }, { day: "22", followers: 83920, reached: 10200 }, { day: "25", followers: 84100, reached: 9400 }, { day: "28", followers: 84240, reached: 11200 },
];

const contentPerformance = [
  { label: "Reels", reach: 68200, engagement: 4860 },
  { label: "Posts", reach: 32400, engagement: 1790 },
  { label: "Stories", reach: 25800, engagement: 668 },
];

const topContent = [
  { title: "Festive wardrobe essentials", type: "Reel", reach: "38.4K", engagement: "3,142", rate: "8.2%", tone: "from-fuchsia-500 to-orange-400" },
  { title: "A slow Sunday skincare ritual", type: "Carousel", reach: "24.1K", engagement: "1,508", rate: "6.3%", tone: "from-teal-500 to-cyan-400" },
  { title: "My everyday workwear edit", type: "Reel", reach: "19.6K", engagement: "1,126", rate: "5.7%", tone: "from-violet-500 to-indigo-400" },
];

export function AnalyticsPage() {
  return <div className="space-y-6">
    <PageHeader title="Analytics" description="Understand your audience, content performance and conversion impact." actions={<Button variant="outline">Last 30 days</Button>} />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{overview.map((item) => <OverviewCard key={item.label} item={item} />)}</section>
    <section className="grid gap-6 xl:grid-cols-3">
      <Card className="shadow-card xl:col-span-2"><CardHeader className="flex-row items-start justify-between space-y-0 p-5 pb-2"><div><CardTitle>Audience growth</CardTitle><p className="mt-1 text-sm text-muted-foreground">Followers gained throughout September</p></div><Badge variant="secondary">+3,040 followers</Badge></CardHeader><CardContent className="h-[300px] p-3 pt-5 sm:p-5 sm:pt-5"><ResponsiveContainer width="100%" height="100%"><LineChart data={audienceTrend} margin={{ top: 10, right: 8, left: -15, bottom: 0 }}><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="day" axisLine={false} tickLine={false} tickMargin={10} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} /><YAxis axisLine={false} tickLine={false} tickMargin={8} domain={[80000, 85000]} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickFormatter={(value) => `${value / 1000}K`} /><Tooltip contentStyle={{ borderColor: "var(--border)", borderRadius: 10, background: "var(--card)" }} formatter={(value) => [Number(value).toLocaleString("en-IN"), "Followers"]} labelFormatter={(label) => `September ${label}`} /><Line type="monotone" dataKey="followers" stroke="var(--primary)" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer></CardContent></Card>
      <Card className="shadow-card"><CardHeader className="p-5 pb-3"><CardTitle>Audience quality</CardTitle><p className="mt-1 text-sm text-muted-foreground">Based on your recent content</p></CardHeader><CardContent className="space-y-5 p-5 pt-3"><QualityRow label="Engagement rate" value="5.8%" comparison="Industry avg. 3.9%" percentage={74} tone="bg-primary" /><QualityRow label="Returning viewers" value="41.2%" comparison="Strong community signal" percentage={58} tone="bg-teal" /><QualityRow label="Saves per reach" value="4.6%" comparison="High intent content" percentage={68} tone="bg-coral" /><div className="rounded-xl bg-muted/50 p-3 text-sm"><p className="font-medium">Audience insight</p><p className="mt-1 leading-5 text-muted-foreground">Reels published between 6–8 PM are driving your strongest reach this month.</p></div></CardContent></Card>
    </section>
    <section className="grid gap-6 xl:grid-cols-3">
      <Card className="shadow-card xl:col-span-2"><CardHeader className="p-5 pb-2"><CardTitle>Content format performance</CardTitle><p className="mt-1 text-sm text-muted-foreground">Reach and engagements by format</p></CardHeader><CardContent className="h-[275px] p-3 pt-5 sm:p-5 sm:pt-5"><ResponsiveContainer width="100%" height="100%"><BarChart data={contentPerformance} margin={{ top: 10, right: 8, left: -15, bottom: 0 }}><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={10} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} /><YAxis axisLine={false} tickLine={false} tickMargin={8} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickFormatter={(value) => `${value / 1000}K`} /><Tooltip contentStyle={{ borderColor: "var(--border)", borderRadius: 10, background: "var(--card)" }} formatter={(value) => [Number(value).toLocaleString("en-IN"), ""]} /><Legend iconType="circle" /><Bar dataKey="reach" name="Reach" fill="var(--primary)" radius={[5, 5, 0, 0]} /><Bar dataKey="engagement" name="Engagements" fill="var(--coral)" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
      <Card className="shadow-card"><CardHeader className="p-5 pb-3"><CardTitle>Conversion impact</CardTitle><p className="mt-1 text-sm text-muted-foreground">Commerce generated by your content</p></CardHeader><CardContent className="space-y-4 p-5 pt-2"><Conversion icon={MousePointerClick} label="Product link clicks" value="3,842" detail="3.0% click-through rate" /><Conversion icon={BadgeIndianRupee} label="Attributed sales" value="₹1.12L" detail="+12.8% vs. last month" /><Conversion icon={Send} label="Orders generated" value="68" detail="₹1,654 average order value" /></CardContent></Card>
    </section>
    <Card className="shadow-card"><CardHeader className="flex-row items-center justify-between space-y-0 p-5 pb-3"><div><CardTitle>Top performing content</CardTitle><p className="mt-1 text-sm text-muted-foreground">Your best posts from the last 30 days</p></div><Button variant="ghost" size="sm">View content</Button></CardHeader><CardContent className="grid gap-3 p-5 pt-1 md:grid-cols-3">{topContent.map((post) => <div key={post.title} className="overflow-hidden rounded-xl border"><div className={`h-24 bg-gradient-to-br ${post.tone} p-3`}><Badge className="bg-black/20 text-white hover:bg-black/20">{post.type}</Badge></div><div className="p-4"><p className="font-medium">{post.title}</p><div className="mt-3 grid grid-cols-3 text-center"><SmallMetric label="Reach" value={post.reach} /><SmallMetric label="Engagement" value={post.engagement} /><SmallMetric label="Rate" value={post.rate} /></div></div></div>)}</CardContent></Card>
  </div>;
}

function OverviewCard({ item }: { item: (typeof overview)[number] }) { const Icon = item.icon; return <Card className="shadow-card"><CardContent className="p-5"><div className="flex items-start justify-between"><p className="text-sm font-medium text-muted-foreground">{item.label}</p><span className={`grid h-9 w-9 place-items-center rounded-lg ${item.tone}`}><Icon className="h-4 w-4" /></span></div><p className="mt-3 font-display text-2xl font-semibold">{item.value}</p><p className="mt-2 flex items-center gap-1 text-xs text-success"><ArrowUpRight className="h-3.5 w-3.5" />{item.change} <span className="text-muted-foreground">vs. last month</span></p></CardContent></Card>; }
function QualityRow({ label, value, comparison, percentage, tone }: { label: string; value: string; comparison: string; percentage: number; tone: string }) { return <div><div className="flex items-baseline justify-between"><p className="text-sm font-medium">{label}</p><p className="font-semibold">{value}</p></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${tone}`} style={{ width: `${percentage}%` }} /></div><p className="mt-1.5 text-xs text-muted-foreground">{comparison}</p></div>; }
function Conversion({ icon: Icon, label, value, detail }: { icon: LucideIcon; label: string; value: string; detail: string }) { return <div className="flex items-center gap-3 rounded-xl border p-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span><div><p className="text-sm text-muted-foreground">{label}</p><p className="font-semibold">{value}</p><p className="text-xs text-muted-foreground">{detail}</p></div></div>; }
function SmallMetric({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-semibold">{value}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p></div>; }
