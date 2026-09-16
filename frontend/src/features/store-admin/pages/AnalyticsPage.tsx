import { Download, MousePointerClick, ShoppingCart, UsersRound } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const traffic = [
  { date: "Sep 1", visitors: 860, orders: 23 },
  { date: "Sep 4", visitors: 1120, orders: 31 },
  { date: "Sep 7", visitors: 980, orders: 27 },
  { date: "Sep 10", visitors: 1460, orders: 42 },
  { date: "Sep 13", visitors: 1280, orders: 35 },
  { date: "Sep 16", visitors: 1710, orders: 49 },
  { date: "Sep 19", visitors: 1530, orders: 44 },
  { date: "Sep 22", visitors: 1930, orders: 56 },
  { date: "Sep 25", visitors: 1780, orders: 51 },
  { date: "Sep 28", visitors: 2140, orders: 63 },
];

const sources = [
  { name: "Instagram", visitors: "8,264", rate: "3.8%", share: 72, color: "bg-coral" },
  { name: "Direct", visitors: "1,948", rate: "4.6%", share: 17, color: "bg-primary" },
  { name: "Google", visitors: "846", rate: "2.9%", share: 7, color: "bg-teal" },
  { name: "Other", visitors: "424", rate: "2.1%", share: 4, color: "bg-muted-foreground" },
];

const products = [
  { name: "Linen Co-ord Set", views: "2,845", conversion: "5.2%", sales: "₹42,780" },
  { name: "Everyday Oversized Shirt", views: "2,372", conversion: "4.8%", sales: "₹31,483" },
  { name: "Classic Wide-leg Trousers", views: "1,968", conversion: "3.9%", sales: "₹27,288" },
  { name: "Canvas Carry-all Tote", views: "1,426", conversion: "3.4%", sales: "₹16,782" },
];

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Understand your store traffic, conversion and product performance."
        actions={
          <Button variant="outline">
            <Download className="h-4 w-4" /> Export
          </Button>
        }
      />
      <div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-primary">
        Showing performance for <strong>September 1–30, 2026</strong> compared with the previous 30
        days.
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Store visitors"
          value="11,482"
          delta={16.3}
          hint="vs. previous period"
          icon={UsersRound}
        />
        <StatCard
          label="Conversion rate"
          value="3.68%"
          delta={0.4}
          hint="vs. previous period"
          icon={MousePointerClick}
          accent="teal"
        />
        <StatCard
          label="Orders placed"
          value="423"
          delta={12.5}
          hint="vs. previous period"
          icon={ShoppingCart}
          accent="coral"
        />
        <StatCard
          label="Average order value"
          value="₹1,742"
          delta={5.8}
          hint="vs. previous period"
          icon={ShoppingCart}
          accent="indigo"
        />
      </section>
      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="shadow-card xl:col-span-2">
          <CardHeader className="p-5 pb-2">
            <CardTitle>Traffic & orders</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Visitor activity alongside completed orders
            </p>
          </CardHeader>
          <CardContent className="h-80 p-3 pt-4 sm:p-5 sm:pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={traffic} margin={{ top: 8, right: 6, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="visitorFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderColor: "var(--border)",
                    borderRadius: 10,
                    background: "var(--card)",
                  }}
                />
                <Legend iconType="circle" />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="visitors"
                  name="Visitors"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  fill="url(#visitorFill)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  name="Orders"
                  stroke="var(--teal)"
                  strokeWidth={2.5}
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="p-5 pb-3">
            <CardTitle>Traffic sources</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Visitors and conversion by source</p>
          </CardHeader>
          <CardContent className="space-y-5 p-5 pt-3">
            {sources.map((source) => (
              <div key={source.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <i className={`h-2.5 w-2.5 rounded-full ${source.color}`} />
                    {source.name}
                  </span>
                  <span className="text-muted-foreground">{source.visitors}</span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <Progress value={source.share} className="h-1.5" />
                  <span className="w-9 text-right text-xs text-muted-foreground">
                    {source.rate}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
      <Card className="shadow-card">
        <CardHeader className="p-5">
          <CardTitle>Top products</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Products driving the most interest and sales
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-y bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Product views</th>
                <th className="px-5 py-3 font-medium">Conversion</th>
                <th className="px-5 py-3 text-right font-medium">Sales</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.name} className="border-b last:border-0">
                  <td className="px-5 py-4 font-medium">{product.name}</td>
                  <td className="px-5 py-4 text-muted-foreground">{product.views}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-md bg-teal/10 px-2 py-1 text-xs font-medium text-teal">
                      {product.conversion}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-semibold">{product.sales}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
