import {
  ArrowUpRight,
  CheckCircle2,
  Link2,
  MousePointerClick,
  ShoppingCart,
  UsersRound,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const funnel = [
  ["Tracked link clicks", "248,190", "100%", "bg-primary"],
  ["Product page views", "136,482", "55.0%", "bg-violet-500"],
  ["Checkout started", "24,681", "9.9%", "bg-sky-500"],
  ["Attributed orders", "12,486", "5.0%", "bg-emerald-500"],
];

const topCreators = [
  ["Aanya Shah", "@aanyacreates", "1,842", "₹3.64L", "6.8%"],
  ["Kabir Singh", "@kabir.edits", "1,224", "₹2.81L", "5.9%"],
  ["Mira Kapoor", "@mirastylefile", "986", "₹2.23L", "5.4%"],
  ["Dev Malhotra", "@devdiscovers", "817", "₹1.94L", "4.8%"],
];

export function AttributionPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Attribution"
        description="Track the creator journeys that turn discovery into revenue."
        actions={
          <Button>
            <Link2 className="h-4 w-4" /> Manage tracking
          </Button>
        }
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Attributed revenue", "₹24.80L", "+18.6%", Link2],
          ["Attributed orders", "12,486", "+14.2%", ShoppingCart],
          ["Creator conversion", "5.03%", "+0.4 pts", MousePointerClick],
          ["Contributing creators", "2,318", "+10.8%", UsersRound],
        ].map(([label, value, change, Icon]) => {
          const MetricIcon = Icon as typeof Link2;
          return (
            <Card key={label as string} className="shadow-none">
              <CardContent className="p-5">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{label as string}</p>
                    <p className="mt-2 text-2xl font-semibold">{value as string}</p>
                  </div>
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <MetricIcon className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-4 flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  {change as string}{" "}
                  <span className="font-normal text-muted-foreground">vs. last month</span>
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>
      <section className="grid gap-6 xl:grid-cols-5">
        <Card className="shadow-none xl:col-span-2">
          <CardHeader className="p-5">
            <CardTitle>Attribution funnel</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Creator-led customer journey</p>
          </CardHeader>
          <CardContent className="space-y-5 p-5 pt-0">
            {funnel.map(([label, value, rate, color]) => (
              <div key={label}>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{value}</p>
                  </div>
                  <span className="text-sm font-semibold">{rate}</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${color}`} style={{ width: rate }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="shadow-none xl:col-span-3">
          <CardHeader className="flex-row items-center justify-between space-y-0 p-5">
            <div>
              <CardTitle>Attribution confidence</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Order matching quality in the last 30 days
              </p>
            </div>
            <Badge variant="secondary" className="text-emerald-700 dark:text-emerald-400">
              Healthy
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-4 p-5 pt-1 sm:grid-cols-3">
            {[
              ["92.8%", "Direct link match", "Click to order was linked directly"],
              ["5.6%", "Assisted conversion", "Customer returned after creator visit"],
              ["1.6%", "Unattributed", "No verified creator source"],
            ].map(([value, label, description]) => (
              <div key={label} className="rounded-lg border bg-muted/20 p-4">
                <p className="text-2xl font-semibold">{value}</p>
                <p className="mt-2 text-sm font-medium">{label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
      <Card className="shadow-none">
        <CardHeader className="flex-row items-center justify-between space-y-0 p-5">
          <div>
            <CardTitle>Top attributed creators</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Creators driving the most verified revenue
            </p>
          </div>
          <Button variant="outline" size="sm">
            Export data
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-y bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Creator</th>
                <th className="px-4 py-3 font-medium">Orders</th>
                <th className="px-4 py-3 font-medium">Revenue</th>
                <th className="px-5 py-3 font-medium">Conversion</th>
              </tr>
            </thead>
            <tbody>
              {topCreators.map(([name, handle, orders, revenue, conversion]) => (
                <tr key={name} className="border-b last:border-0">
                  <td className="px-5 py-4">
                    <p className="font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">{handle}</p>
                  </td>
                  <td className="px-4 py-4">{orders}</td>
                  <td className="px-4 py-4 font-medium">{revenue}</td>
                  <td className="px-5 py-4">
                    <Badge variant="secondary">{conversion}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
