import {
  CalendarDays,
  ChevronRight,
  Download,
  FileBarChart,
  FileText,
  Plus,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const reports = [
  {
    title: "Monthly sales summary",
    description: "Revenue, orders, refunds and taxes for September.",
    category: "Sales",
    updated: "Today, 9:30 AM",
    icon: FileBarChart,
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Creator performance",
    description: "Attributed sales, commission and conversion by creator.",
    category: "Creators",
    updated: "Yesterday",
    icon: Sparkles,
    color: "bg-coral/10 text-coral",
  },
  {
    title: "Product inventory report",
    description: "Stock movement and low-inventory products.",
    category: "Products",
    updated: "Sep 14, 2026",
    icon: FileText,
    color: "bg-teal/10 text-teal",
  },
  {
    title: "Customer acquisition",
    description: "New customers, retention and purchase behaviour.",
    category: "Customers",
    updated: "Sep 12, 2026",
    icon: CalendarDays,
    color: "bg-indigo/10 text-indigo",
  },
];

const scheduled = [
  {
    title: "Weekly sales digest",
    cadence: "Every Monday · 9:00 AM",
    recipients: "aarav@urbanthreads.in",
  },
  {
    title: "Creator performance update",
    cadence: "1st of every month · 10:00 AM",
    recipients: "marketing@urbanthreads.in",
  },
];

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="View, download and schedule reports for Urban Threads."
        actions={
          <Button>
            <Plus className="h-4 w-4" /> Create report
          </Button>
        }
      />
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20 bg-primary text-primary-foreground shadow-card md:col-span-2">
          <CardContent className="flex min-h-44 flex-col justify-between p-6">
            <div>
              <Badge className="border-0 bg-white/15 text-white hover:bg-white/15">
                Recommended
              </Badge>
              <h2 className="mt-4 font-display text-xl font-semibold">
                Your September sales report is ready
              </h2>
              <p className="mt-1 text-sm text-white/75">
                A complete overview of ₹1,84,250 in sales across 248 orders.
              </p>
            </div>
            <Button variant="secondary" className="w-fit">
              <Download className="h-4 w-4" /> Download report
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="flex h-full flex-col justify-center p-6">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-teal/10 text-teal">
              <CalendarDays className="h-5 w-5" />
            </span>
            <p className="mt-4 font-display text-lg font-semibold">2 scheduled reports</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your next digest will arrive Monday at 9:00 AM.
            </p>
          </CardContent>
        </Card>
      </section>
      <section>
        <h2 className="font-display text-base font-semibold">Report library</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ready-made reports using your store data.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <Card
                key={report.title}
                className="shadow-card transition-shadow hover:shadow-elevated"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${report.color}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display font-semibold">{report.title}</h3>
                        <Badge variant="secondary">{report.category}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{report.description}</p>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t pt-4">
                    <span className="text-xs text-muted-foreground">Updated {report.updated}</span>
                    <Button variant="ghost" size="sm" className="-mr-2 text-primary">
                      Open <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
      <Card className="shadow-card">
        <CardHeader className="flex-row items-center justify-between space-y-0 p-5">
          <div>
            <CardTitle>Scheduled reports</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Reports automatically delivered to your team.
            </p>
          </div>
          <Button variant="outline" size="sm">
            Manage schedules
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {scheduled.map((report) => (
            <div
              key={report.title}
              className="flex flex-wrap items-center gap-3 border-t px-5 py-4"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
              </span>
              <div className="min-w-48 flex-1">
                <p className="text-sm font-medium">{report.title}</p>
                <p className="text-xs text-muted-foreground">{report.cadence}</p>
              </div>
              <p className="text-sm text-muted-foreground">{report.recipients}</p>
              <Badge variant="outline" className="border-teal/30 bg-teal/5 text-teal">
                Active
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
