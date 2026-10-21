import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BarChart3, BadgeIndianRupee, MousePointerClick, PackageCheck, ShoppingBag, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAffiliateLinkReport } from "../api/affiliate-links.api";

const money = (amount: number, currency = "INR") => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency,
  maximumFractionDigits: 2,
}).format(amount);

function MetricCard({ label, value, hint, icon: Icon }: { label: string; value: string; hint: string; icon: typeof ShoppingBag }) {
  return <Card className="shadow-card"><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-2 text-xl font-bold tracking-tight">{value}</p><p className="mt-1 text-[11px] text-muted-foreground">{hint}</p></div><span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span></div></CardContent></Card>;
}

export function AffiliateLinkReportPage({ linkId }: { linkId: string }) {
  const reportQuery = useQuery({
    queryKey: ["store", "affiliate-link-report", linkId],
    queryFn: () => getAffiliateLinkReport(linkId),
  });
  const report = reportQuery.data;

  if (reportQuery.isLoading) return <div className="space-y-5 animate-pulse"><div className="h-9 w-44 rounded bg-muted" /><div className="h-32 rounded-xl bg-muted" /><div className="grid gap-4 sm:grid-cols-3"><div className="h-28 rounded-xl bg-muted" /><div className="h-28 rounded-xl bg-muted" /><div className="h-28 rounded-xl bg-muted" /></div></div>;
  if (!report) return <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center"><p className="font-semibold text-destructive">Unable to load this link report.</p><Button asChild variant="outline" size="sm" className="mt-4"><Link to="/store-admin/affiliate">Back to affiliate links</Link></Button></div>;

  const { link, metrics, orders } = report;
  const commissionLabel = link.commissionType === "FIXED_AMOUNT" ? `${money(link.commissionAmount ?? 0)} flat per order` : `${link.commissionRate}% of qualifying order value`;

  return <div className="space-y-6 pb-12">
    <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground"><Link to="/store-admin/affiliate"><ArrowLeft className="mr-1.5 h-4 w-4" />Back to affiliate links</Link></Button>

    <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/8 via-card to-teal/8 shadow-card"><CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h1 className="font-display text-2xl font-bold">Link performance report</h1><Badge variant="outline" className={link.status === "ACTIVE" ? "border-emerald-300 bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground"}>{link.status}</Badge></div><p className="mt-2 font-mono text-sm text-primary">/r/{link.slug}</p><p className="mt-1 text-sm text-muted-foreground">{link.destination} · {link.targetType.toLowerCase()} link</p></div><div className="rounded-xl border bg-background/80 p-3 text-sm"><p className="text-xs text-muted-foreground">Creator</p><p className="mt-1 font-semibold">{link.creator?.name ?? "Storewide campaign"}</p><p className="text-xs text-muted-foreground">{link.creator?.creatorCode ? `@${link.creator.creatorCode}` : commissionLabel}</p></div></CardContent></Card>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><MetricCard label="Total clicks" value={metrics.clicks.toLocaleString("en-IN")} hint={`${(metrics.conversionRate * 100).toFixed(1)}% conversion`} icon={MousePointerClick} /><MetricCard label="Attributed orders" value={metrics.totalOrders.toLocaleString("en-IN")} hint="Non-refunded orders" icon={ShoppingBag} /><MetricCard label="Total GMV" value={money(metrics.gmv)} hint="Paid order value" icon={BadgeIndianRupee} /><MetricCard label="Average order value" value={money(metrics.averageOrderAmount)} hint="GMV ÷ attributed orders" icon={BarChart3} /><MetricCard label="Creator earnings" value={money(metrics.creatorEarnings)} hint={commissionLabel} icon={Users} /></section>

    <Card className="overflow-hidden shadow-card"><div className="flex items-center justify-between border-b p-5"><div><h2 className="font-bold">Attributed orders</h2><p className="mt-1 text-xs text-muted-foreground">Every Shopify order linked to this affiliate URL, with its creator payout status.</p></div><Badge variant="outline" className="font-mono">{orders.length} total</Badge></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead className="border-b bg-muted/40 text-muted-foreground"><tr><th className="px-5 py-3">Order</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Date</th><th className="px-5 py-3 text-right">Order amount</th><th className="px-5 py-3 text-center">Payment</th><th className="px-5 py-3 text-center">Commission</th><th className="px-5 py-3 text-right">Creator earning</th></tr></thead><tbody className="divide-y">{orders.length === 0 ? <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground"><PackageCheck className="mx-auto mb-2 h-6 w-6" />No attributed orders yet.</td></tr> : orders.map((order) => <tr key={order.id} className="hover:bg-muted/20"><td className="px-5 py-3.5 font-mono font-semibold">{order.name}</td><td className="px-5 py-3.5">{order.email ?? "Guest checkout"}</td><td className="px-5 py-3.5 text-muted-foreground">{order.processedAt ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(order.processedAt)) : "—"}</td><td className="px-5 py-3.5 text-right font-mono font-semibold">{money(order.amount, order.currency)}</td><td className="px-5 py-3.5 text-center"><Badge variant="outline" className="text-[10px]">{order.financialStatus ?? "Unknown"}</Badge></td><td className="px-5 py-3.5 text-center">{order.commissionStatus ? <Badge className={order.commissionStatus === "PAID" ? "bg-teal/15 text-teal" : order.commissionStatus === "APPROVED" ? "bg-emerald-600 text-white" : order.commissionStatus === "REVERSED" ? "bg-muted text-muted-foreground" : "bg-amber-500/10 text-amber-700"}>{order.commissionStatus}</Badge> : <span className="text-muted-foreground">Reconciling</span>}</td><td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-600">{order.commissionStatus === "REVERSED" ? "—" : money(order.commissionAmount, order.currency)}</td></tr>)}</tbody></table></div></Card>
  </div>;
}
