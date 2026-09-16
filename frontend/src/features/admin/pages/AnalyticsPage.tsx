import { Download, Info, TrendingUp, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const trend = [42, 51, 47, 65, 59, 72, 68, 83, 76, 91, 88, 100];

const channels = [
  { name: "Instagram", value: "68.4%", revenue: "₹16.97L", color: "bg-fuchsia-500" },
  { name: "Creator storefronts", value: "21.7%", revenue: "₹5.38L", color: "bg-violet-500" },
  { name: "Direct campaigns", value: "9.9%", revenue: "₹2.45L", color: "bg-sky-500" },
];

const campaigns = [
  ["Monsoon Essentials", "Urban Threads", "156", "₹4.82L", "7.8%"],
  ["Home Refresh", "Northstar Home", "94", "₹3.76L", "6.4%"],
  ["Weekend Edit", "Kora Collective", "128", "₹3.21L", "5.9%"],
  ["Back to Campus", "Mode & Co.", "81", "₹2.68L", "5.2%"],
];

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Understand growth, conversion and performance across the platform."
        actions={
          <>
            <Select defaultValue="30d">
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4" /> Export
            </Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Revenue", "₹24.80L", "+18.6%", "Compared to ₹20.91L previously"],
          ["Orders", "12,486", "+14.2%", "Average order value ₹1,986"],
          ["Conversion rate", "5.84%", "+0.7 pts", "From store visit to order"],
        ].map(([label, value, delta, caption]) => (
          <Card key={label} className="shadow-none">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{label}</p>
              <div className="mt-2 flex items-end gap-2">
                <p className="text-2xl font-semibold tracking-tight">{value}</p>
                <Badge
                  variant="secondary"
                  className="mb-0.5 text-emerald-700 dark:text-emerald-400"
                >
                  {delta}
                </Badge>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{caption}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="shadow-none xl:col-span-2">
          <CardHeader className="p-5 pb-0">
            <CardTitle>Revenue & orders</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Daily marketplace performance</p>
          </CardHeader>
          <CardContent className="p-5 pt-8">
            <div className="flex h-56 items-end gap-1.5 sm:gap-2">
              {trend.map((height, index) => (
                <div key={index} className="group flex h-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-sm bg-primary/20 transition-colors group-hover:bg-primary"
                    style={{ height: `${height}%` }}
                    title={`Day ${index + 1}`}
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between text-xs text-muted-foreground">
              <span>1 Sep</span>
              <span>7 Sep</span>
              <span>14 Sep</span>
              <span>21 Sep</span>
              <span>30 Sep</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader className="p-5 pb-2">
            <CardTitle>Revenue by channel</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Attributed sales</p>
          </CardHeader>
          <CardContent className="space-y-5 p-5 pt-4">
            {channels.map((channel) => (
              <div key={channel.name}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{channel.name}</span>
                  <span>{channel.value}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{channel.revenue} in sales</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${channel.color}`}
                    style={{ width: channel.value }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="shadow-none xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 p-5">
            <div>
              <CardTitle>Top campaigns</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Ranked by attributed revenue</p>
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="border-y bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Campaign</th>
                  <th className="px-4 py-3 font-medium">Creators</th>
                  <th className="px-4 py-3 font-medium">Revenue</th>
                  <th className="px-5 py-3 font-medium">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(([name, brand, creators, revenue, conversion]) => (
                  <tr key={name} className="border-b last:border-0">
                    <td className="px-5 py-4">
                      <p className="font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">{brand}</p>
                    </td>
                    <td className="px-4 py-4">{creators}</td>
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
        <Card className="shadow-none">
          <CardHeader className="p-5 pb-2">
            <CardTitle>Audience growth</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Creator audience this period</p>
          </CardHeader>
          <CardContent className="p-5 pt-4">
            <div className="rounded-xl bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground">
                  <UsersRound className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-2xl font-semibold">+184K</p>
                  <p className="text-xs text-muted-foreground">new followers reached</p>
                </div>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Engagement rate</span>
                <span className="font-medium">4.6%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Content published</span>
                <span className="font-medium">1,286 posts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active creators</span>
                <span className="font-medium">2,841</span>
              </div>
            </div>
            <p className="mt-5 flex gap-1.5 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 shrink-0" /> Audience figures refresh when connected
              social accounts sync.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
