import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeIndianRupee,
  CalendarDays,
  CheckCircle2,
  Download,
  FileBarChart,
  FileSpreadsheet,
  FileText,
  Loader2,
  Plus,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getStoreReportsSummary } from "../api/reports.api";
import { getStoreOrders } from "../api/orders.api";
import { getStoreCreators, getStoreCommissions } from "../api/creators.api";
import { getStoreProducts } from "../api/products.api";
import { getStoreCustomers } from "../api/customers.api";

function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join(
      "\n"
    );
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function ReportsPage() {
  const [downloadingType, setDownloadingType] = useState<string | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState("Weekly Sales & Creator Digest");
  const [scheduleCadence, setScheduleCadence] = useState("Weekly on Monday 9:00 AM");
  const [scheduleEmail, setScheduleEmail] = useState("");

  const summaryQuery = useQuery({
    queryKey: ["store", "reports", "summary"],
    queryFn: getStoreReportsSummary,
  });

  const summary = summaryQuery.data ?? {
    storeName: "Store",
    shopDomain: null,
    sales: {
      totalGMV: 0,
      totalOrders: 0,
      avgOrderValue: 0,
      creatorAttributedGMV: 0,
      totalCommissions: 0,
      attributedOrderCount: 0,
    },
    inventory: {
      totalProducts: 0,
      totalUnits: 0,
      lowStockCount: 0,
    },
    creators: {
      totalPartners: 0,
      activeCommissionsCount: 0,
    },
    customers: {
      uniqueCustomerCount: 0,
    },
  };

  const handleExportOrders = async () => {
    try {
      setDownloadingType("orders");
      const data = await getStoreOrders(1, { all: true });
      const headers = [
        "Shopify Order ID",
        "Order Name",
        "Date",
        "Customer Email",
        "Order Total (INR)",
        "Financial Status",
        "Fulfillment Status",
        "Attributed Creator",
        "Creator Instagram / Code",
        "Commission Status",
        "Earned Commission (INR)",
      ];
      const rows = data.orders.map((o) => [
        o.id,
        o.name,
        o.processedAt ? new Date(o.processedAt).toISOString() : "",
        o.customer?.email ?? "",
        o.total,
        o.financialStatus,
        o.fulfillmentStatus,
        o.attribution?.creatorName ?? (o.creatorCode ? `@${o.creatorCode}` : "Direct / Organic"),
        o.attribution?.creator?.instagram ? `@${o.attribution.creator.instagram}` : (o.creatorCode ? `@${o.creatorCode}` : "—"),
        o.attribution?.status ?? "None",
        o.attribution?.amount ?? 0,
      ]);
      downloadCSV(`attributed_orders_report_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
      toast.success("Attributed orders report exported successfully");
    } catch {
      toast.error("Failed to export orders report");
    } finally {
      setDownloadingType(null);
    }
  };

  const handleExportCreators = async () => {
    try {
      setDownloadingType("creators");
      const creators = await getStoreCreators();
      const headers = [
        "Creator Name",
        "Email",
        "Instagram Handle",
        "Creator Code",
        "Attributed Sales (INR)",
        "Attributed Orders",
        "Commissions Earned (INR)",
        "Active Tracking Links",
        "Status",
      ];
      const rows = creators.map((c) => [
        c.displayName,
        c.email ?? "",
        c.instagramUsername ? `@${c.instagramUsername}` : "",
        c.creatorCode ? `@${c.creatorCode}` : "",
        c.totalSales ?? 0,
        c.totalOrders ?? 0,
        c.totalCommissions ?? 0,
        c.activeLinks ?? 0,
        c.status,
      ]);
      downloadCSV(`creator_performance_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
      toast.success("Creator performance report exported successfully");
    } catch {
      toast.error("Failed to export creator report");
    } finally {
      setDownloadingType(null);
    }
  };

  const handleExportCommissions = async () => {
    try {
      setDownloadingType("commissions");
      const res = await getStoreCommissions();
      const headers = [
        "Commission ID",
        "Shopify Order",
        "Influencer Name",
        "Instagram",
        "Order GMV (INR)",
        "Commission Rate (%)",
        "Commission Amount (INR)",
        "Status",
        "Date",
      ];
      const rows = res.commissions.map((c) => [
        c.id,
        c.orderNumber,
        c.creator?.name ?? "Store Partner",
        c.creator?.instagram ? `@${c.creator.instagram}` : "",
        c.orderAmount,
        c.commissionRate,
        c.amount,
        c.status,
        new Date(c.createdAt).toISOString(),
      ]);
      downloadCSV(`commissions_payout_report_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
      toast.success("Commissions payout report exported successfully");
    } catch {
      toast.error("Failed to export commissions report");
    } finally {
      setDownloadingType(null);
    }
  };

  const handleExportProducts = async () => {
    try {
      setDownloadingType("products");
      const res = await getStoreProducts(1, { all: true });
      const headers = [
        "Product Title",
        "SKU",
        "Vendor",
        "Price (INR)",
        "Inventory Stock",
        "Total Orders",
        "Units Sold",
        "Revenue (INR)",
      ];
      const rows = res.products.map((p) => [
        p.name,
        p.sku,
        p.vendor ?? "",
        p.price,
        p.inventory,
        p.ordersCount,
        p.unitsSold,
        p.sales,
      ]);
      downloadCSV(`products_inventory_report_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
      toast.success("Products report exported successfully");
    } catch {
      toast.error("Failed to export products report");
    } finally {
      setDownloadingType(null);
    }
  };

  const handleExportCustomers = async () => {
    try {
      setDownloadingType("customers");
      const res = await getStoreCustomers(1, { all: true });
      const headers = [
        "Customer Name",
        "Email",
        "City",
        "Country",
        "Total Orders",
        "Total Spent (INR)",
        "Average Order Value (INR)",
        "Referring Creator",
      ];
      const rows = res.customers.map((c) => [
        c.name,
        c.email,
        c.city ?? "",
        c.country ?? "",
        c.ordersCount,
        c.totalSpent,
        c.avgOrderValue,
        c.referredByCreator?.name ?? "Direct / Organic",
      ]);
      downloadCSV(`customers_acquisition_report_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
      toast.success("Customers report exported successfully");
    } catch {
      toast.error("Failed to export customers report");
    } finally {
      setDownloadingType(null);
    }
  };

  const reportItems = [
    {
      id: "orders",
      title: "Creator Attributed Orders & Performance",
      description: "Itemized transaction ledger of creator promo codes, tracking link referrals, commissions, and customer purchases.",
      category: "Attribution",
      stats: `${summary.sales.attributedOrderCount} creator orders (${formatCurrency(summary.sales.creatorAttributedGMV)} Influencer GMV)`,
      icon: Sparkles,
      color: "bg-coral/10 text-coral",
      onExport: handleExportOrders,
    },
    {
      id: "creators",
      title: "Creator Performance & ROI",
      description: "Attributed sales, referral conversions, and commission earnings breakdown by creator.",
      category: "Influencers",
      stats: `${summary.creators.totalPartners} creator partners (${formatCurrency(summary.sales.creatorAttributedGMV)} GMV driven)`,
      icon: UsersRound,
      color: "bg-primary/10 text-primary",
      onExport: handleExportCreators,
    },
    {
      id: "commissions",
      title: "Commission Settlements & Payouts",
      description: "Detailed ledger of pending, approved, and settled creator commission balances.",
      category: "Finance",
      stats: `${formatCurrency(summary.sales.totalCommissions)} total commissions`,
      icon: BadgeIndianRupee,
      color: "bg-amber-500/10 text-amber-600",
      onExport: handleExportCommissions,
    },
    {
      id: "products",
      title: "Product Inventory & Movement",
      description: "Catalog sales volume, inventory counts, and stock alert levels.",
      category: "Products",
      stats: `${summary.inventory.totalProducts} products (${summary.inventory.totalUnits} units on hand)`,
      icon: FileText,
      color: "bg-teal/10 text-teal",
      onExport: handleExportProducts,
    },
    {
      id: "customers",
      title: "Customer Acquisition & LTV",
      description: "Customer roster, repeat purchase rates, lifetime spend, and creator source channels.",
      category: "Audience",
      stats: `${summary.customers.uniqueCustomerCount} unique buyers`,
      icon: FileBarChart,
      color: "bg-indigo/10 text-indigo",
      onExport: handleExportCustomers,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & CSV Exports"
        description="View platform attribution summaries, generate instant CSV spreadsheets, and schedule automated team digests."
        actions={
          <Button onClick={() => setScheduleDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4" /> Schedule Automated Digest
          </Button>
        }
      />

      {/* Top Banner with live stats */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20 bg-primary text-primary-foreground shadow-card md:col-span-2">
          <CardContent className="flex min-h-44 flex-col justify-between p-6">
            <div>
              <Badge className="border-0 bg-white/15 text-white hover:bg-white/15">
                MegaInfluencer Platform Report
              </Badge>
              <h2 className="mt-4 font-display text-xl font-semibold">
                {summary.storeName} Influencer Performance & Attribution Report
              </h2>
              <p className="mt-1 text-sm text-white/80">
                {formatCurrency(summary.sales.creatorAttributedGMV)} Influencer GMV across {summary.sales.attributedOrderCount} creator-driven orders ·{" "}
                {formatCurrency(summary.sales.totalCommissions)} commissions accrued.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                className="w-fit"
                disabled={Boolean(downloadingType)}
                onClick={handleExportOrders}
              >
                {downloadingType === "orders" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Download className="h-4 w-4 mr-1" />
                )}
                Export Attributed Orders CSV
              </Button>
              <Button
                variant="outline"
                className="w-fit bg-white/10 hover:bg-white/20 text-white border-white/20"
                disabled={Boolean(downloadingType)}
                onClick={handleExportCreators}
              >
                {downloadingType === "creators" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                )}
                Export Creator ROI CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="flex h-full flex-col justify-center p-6">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-teal/10 text-teal">
              <CalendarDays className="h-5 w-5" />
            </span>
            <p className="mt-4 font-display text-lg font-semibold">Automated Deliveries</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Weekly sales & creator performance digest sent every Monday at 9:00 AM.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-teal font-medium">
              <CheckCircle2 className="h-4 w-4" /> Active Delivery Pipeline
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Report Library Grid */}
      <section className="space-y-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Report Library & On-Demand Exports</h2>
          <p className="text-sm text-muted-foreground">
            Download filtered CSV files directly populated from your live database.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reportItems.map((report) => {
            const Icon = report.icon;
            const isDownloading = downloadingType === report.id;
            return (
              <Card
                key={report.id}
                className="shadow-card transition-shadow hover:shadow-elevated flex flex-col justify-between"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${report.color}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display font-semibold text-sm">{report.title}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {report.category}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground leading-5">{report.description}</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg bg-muted/40 p-2.5 text-xs font-medium text-foreground">
                    {report.stats}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t pt-3">
                    <span className="text-xs text-muted-foreground">Real-time sync</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1"
                      disabled={Boolean(downloadingType)}
                      onClick={report.onExport}
                    >
                      {isDownloading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      Export CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Scheduled Digests */}
      <Card className="shadow-card">
        <CardHeader className="flex-row items-center justify-between space-y-0 p-5">
          <div>
            <CardTitle className="text-base">Configured Scheduled Digests</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Automated analytical exports delivered via email to your marketing and operations team.
            </p>
          </div>
          <Button onClick={() => setScheduleDialogOpen(true)} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" /> New Schedule
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium">Weekly Store & Influencer Digest</p>
                  <p className="text-xs text-muted-foreground">Every Monday · 9:00 AM IST</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">marketing@brand.in</span>
                <Badge variant="outline" className="border-teal/30 bg-teal/5 text-teal text-xs">
                  Active
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium">Monthly Creator Commission Settlement Statement</p>
                  <p className="text-xs text-muted-foreground">1st of every month · 10:00 AM IST</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">accounts@brand.in</span>
                <Badge variant="outline" className="border-teal/30 bg-teal/5 text-teal text-xs">
                  Active
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Digest Modal */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Schedule Automated Report Digest</DialogTitle>
            <DialogDescription>
              Configure recurring email delivery of CSV attachments and executive summaries for your team.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-3">
            <div className="grid gap-2">
              <Label htmlFor="sched-title">Report Name</Label>
              <Input
                id="sched-title"
                value={scheduleTitle}
                onChange={(e) => setScheduleTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Frequency / Cadence</Label>
              <Select value={scheduleCadence} onValueChange={setScheduleCadence}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Daily at 8:00 AM">Daily at 8:00 AM</SelectItem>
                  <SelectItem value="Weekly on Monday 9:00 AM">Weekly on Monday 9:00 AM</SelectItem>
                  <SelectItem value="Monthly on 1st at 10:00 AM">Monthly on 1st at 10:00 AM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sched-email">Recipient Email(s)</Label>
              <Input
                id="sched-email"
                placeholder="team@brand.com"
                value={scheduleEmail}
                onChange={(e) => setScheduleEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!scheduleEmail) {
                  toast.error("Please provide at least one recipient email");
                  return;
                }
                setScheduleDialogOpen(false);
                toast.success("Automated report digest schedule created successfully!");
              }}
            >
              Save Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
