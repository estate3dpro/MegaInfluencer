import {
  CheckCircle2,
  Clock3,
  Database,
  Globe2,
  HardDrive,
  ServerCog,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const services: Array<{
  name: string;
  uptime: string;
  response: string;
  status: string;
  icon: LucideIcon;
}> = [
  { name: "Public API", uptime: "99.98%", response: "42 ms", status: "Operational", icon: Globe2 },
  {
    name: "Authentication",
    uptime: "100%",
    response: "64 ms",
    status: "Operational",
    icon: ShieldCheck,
  },
  { name: "Database", uptime: "99.99%", response: "18 ms", status: "Operational", icon: Database },
  {
    name: "Instagram sync",
    uptime: "98.4%",
    response: "1.8 s",
    status: "Degraded",
    icon: ServerCog,
  },
];
const events: Array<{
  title: string;
  status: string;
  timestamp: string;
  tone: "warning" | "success";
}> = [
  {
    title: "Instagram sync latency elevated",
    status: "Monitoring",
    timestamp: "Today, 10:42 AM",
    tone: "warning",
  },
  {
    title: "Scheduled database backup completed",
    status: "Completed",
    timestamp: "Today, 02:00 AM",
    tone: "success",
  },
  {
    title: "API deployment v1.12.0",
    status: "Completed",
    timestamp: "Yesterday, 06:18 PM",
    tone: "success",
  },
  {
    title: "Creator payout batch #284",
    status: "Completed",
    timestamp: "Yesterday, 11:30 AM",
    tone: "success",
  },
];
const systemMetrics: Array<{
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
}> = [
  { label: "API requests", value: "1.28M", description: "Last 24 hours", icon: Globe2 },
  { label: "Background jobs", value: "18,492", description: "98.7% completed", icon: ServerCog },
  { label: "Storage used", value: "184 GB", description: "of 500 GB", icon: HardDrive },
];

export function SystemPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="System status"
        description="Monitor platform services, reliability and operational activity."
        actions={
          <Button variant="outline">
            <Clock3 className="h-4 w-4" /> Status history
          </Button>
        }
      />
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-200">
        <CheckCircle2 className="h-4 w-4" /> Core platform services are operational. One integration
        needs attention.
      </div>
      <section className="grid gap-4 md:grid-cols-3">
        {systemMetrics.map(({ label, value, description, icon: MetricIcon }) => {
          return (
            <Card key={label} className="shadow-none">
              <CardContent className="flex items-start justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-2 text-2xl font-semibold">{value}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{description}</p>
                </div>
                <MetricIcon className="h-5 w-5 text-primary" />
              </CardContent>
            </Card>
          );
        })}
      </section>
      <Card className="shadow-none">
        <CardHeader className="p-5">
          <CardTitle>Service health</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Current availability and response time by service
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="border-y bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Uptime (30d)</th>
                <th className="px-4 py-3 font-medium">Response time</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {services.map(({ name, uptime, response, status, icon: ServiceIcon }) => {
                const degraded = status === "Degraded";
                return (
                  <tr key={name} className="border-b last:border-0">
                    <td className="flex items-center gap-3 px-5 py-4 font-medium">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-muted">
                        <ServiceIcon className="h-4 w-4" />
                      </span>
                      {name}
                    </td>
                    <td className="px-4 py-4">{uptime}</td>
                    <td className="px-4 py-4">{response}</td>
                    <td className="px-5 py-4">
                      <Badge
                        variant={degraded ? "secondary" : "default"}
                        className={degraded ? "text-amber-700 dark:text-amber-400" : ""}
                      >
                        {degraded ? (
                          <TriangleAlert className="mr-1 h-3 w-3" />
                        ) : (
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                        )}
                        {status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="shadow-none xl:col-span-2">
          <CardHeader className="p-5">
            <CardTitle>Operational events</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Recent deployments, incidents and automated tasks
            </p>
          </CardHeader>
          <CardContent className="space-y-5 p-5 pt-1">
            {events.map(({ title, status, timestamp, tone }) => (
              <div key={title} className="flex gap-3">
                <span
                  className={`mt-1.5 h-2.5 w-2.5 rounded-full ${tone === "warning" ? "bg-amber-500" : "bg-emerald-500"}`}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{timestamp}</p>
                </div>
                <Badge variant="secondary">{status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="p-5">
            <CardTitle>System actions</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Quick operational tools</p>
          </CardHeader>
          <CardContent className="space-y-3 p-5 pt-1">
            <Button variant="outline" className="w-full justify-start">
              View application logs
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Run health checks
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Manage maintenance
            </Button>
            <p className="pt-2 text-xs text-muted-foreground">
              Actions are audited and require platform-admin permission.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
