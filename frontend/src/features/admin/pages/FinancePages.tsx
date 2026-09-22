import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeIndianRupee,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Download,
  ExternalLink,
  Instagram,
  ReceiptText,
  Search,
  Sparkles,
  Store,
  UsersRound,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  getAdminCommissions,
  getAdminDashboard,
  getAdminOrders,
} from "../api/overview.api";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
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

// -------------------------------------------------------------
// 1. ORDERS PAGE
// -------------------------------------------------------------
export function OrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const query = useQuery({
    queryKey: ["admin", "orders", search, statusFilter],
    queryFn: () => getAdminOrders({ search, status: statusFilter }),
  });

  const orders = query.data?.orders ?? [];
  const totalGMV = query.data?.totalGMV ?? 0;
  const totalCount = query.data?.total ?? 0;

  const exportOrders = () => {
    const headers = [
      "Order ID",
      "Order Name",
      "Store Name",
      "Customer Email",
      "Total (INR)",
      "Financial Status",
      "Fulfillment Status",
      "Creator Attribution",
      "Commission Amount",
      "Date",
    ];
    const rows = orders.map((o) => [
      o.id,
      o.name,
      o.storeName,
      o.customerEmail,
      o.total,
      o.financialStatus,
      o.fulfillmentStatus,
      o.creatorName ? `${o.creatorName} (@${o.creatorCode || ""})` : o.creatorCode ?? "Direct / Organic",
      o.commissionAmount,
      new Date(o.processedAt).toISOString(),
    ]);
    downloadCSV(`platform_orders_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    toast.success("Orders CSV exported successfully");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cross-Store Orders"
        description="Live transaction stream across all connected Shopify brand stores with creator attribution."
        actions={
          <Button onClick={exportOrders} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" /> Export Orders CSV
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">Total GMV</p>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <ReceiptText className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">{formatCurrency(totalGMV)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Across all connected brands</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">Orders Placed</p>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal/10 text-teal">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">{totalCount.toLocaleString()}</p>
            <p className="mt-1 text-xs text-muted-foreground">Processed in real-time</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">Attributed Orders</p>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-coral/10 text-coral">
                <Sparkles className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">
              {orders.filter((o) => o.creatorCode || o.creatorName).length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Driven by creator partners</p>
          </CardContent>
        </Card>
      </section>

      <Card className="shadow-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="relative min-w-64 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9 h-9"
              placeholder="Search by order name, customer email, store, or creator..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex rounded-lg border bg-muted/30 p-0.5">
            {(
              [
                { id: "ALL", label: "All" },
                { id: "paid", label: "Paid" },
                { id: "pending", label: "Pending" },
                { id: "refunded", label: "Refunded" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setStatusFilter(t.id)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                  statusFilter === t.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="border-y bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Shopify Order</th>
                <th className="px-5 py-3 font-medium">Brand Store</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Attribution</th>
                <th className="px-5 py-3 font-medium">Financial Status</th>
                <th className="px-5 py-3 text-right font-medium">Total GMV</th>
              </tr>
            </thead>
            <tbody>
              {query.isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td colSpan={6} className="px-5 py-4">
                      <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    No orders found matching criteria.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="border-b last:border-0 hover:bg-muted/15 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-semibold text-foreground">
                      {o.name}
                      <p className="text-xs font-normal text-muted-foreground">
                        {new Intl.DateTimeFormat("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(o.processedAt))}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-foreground">
                      <span className="flex items-center gap-1.5">
                        <Store className="h-3.5 w-3.5 text-primary" />
                        {o.storeName}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground text-xs">{o.customerEmail}</td>
                    <td className="px-5 py-3.5">
                      {o.creatorName || o.creatorCode ? (
                        <div className="flex items-center gap-1 font-semibold text-xs text-primary">
                          <Sparkles className="h-3 w-3" />
                          {o.creatorName ?? `@${o.creatorCode}`}
                          {o.commissionAmount > 0 ? (
                            <span className="text-xs font-normal text-muted-foreground ml-1">
                              ({formatCurrency(o.commissionAmount)})
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Direct / Organic</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={String(o.financialStatus).toLowerCase() === "paid" ? "outline" : "secondary"}
                        className={
                          String(o.financialStatus).toLowerCase() === "paid"
                            ? "border-teal/30 bg-teal/5 text-teal font-medium capitalize text-xs"
                            : "capitalize text-xs"
                        }
                      >
                        {o.financialStatus}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-foreground">
                      {formatCurrency(o.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// -------------------------------------------------------------
// 2. COMMISSIONS PAGE
// -------------------------------------------------------------
export function CommissionsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const query = useQuery({
    queryKey: ["admin", "commissions", search, statusFilter],
    queryFn: () => getAdminCommissions({ search, status: statusFilter }),
  });

  const commissions = query.data?.commissions ?? [];
  const metrics = query.data?.metrics ?? {
    pendingAmount: 0,
    approvedAmount: 0,
    paidAmount: 0,
    totalCommissionsCount: 0,
  };

  const exportCommissions = () => {
    const headers = [
      "Commission ID",
      "Influencer Name",
      "Instagram",
      "Creator Code",
      "Brand Store",
      "Shopify Order",
      "Order GMV (INR)",
      "Commission Rate (%)",
      "Earned Amount (INR)",
      "Status",
      "Date",
    ];
    const rows = commissions.map((c) => [
      c.id,
      c.creator?.name ?? "Creator",
      c.creator?.instagram ? `@${c.creator.instagram}` : "",
      c.creator?.code ? `@${c.creator.code}` : "",
      c.storeName,
      c.orderNumber,
      c.orderAmount,
      c.commissionRate,
      c.amount,
      c.status,
      new Date(c.createdAt).toISOString(),
    ]);
    downloadCSV(`platform_commissions_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    toast.success("Commissions CSV exported successfully");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Creator Commissions"
        description="Monitor commission accruals, approval workflows, and settlement eligibility across all brand stores."
        actions={
          <Button onClick={exportCommissions} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-500/10 text-amber-600">
                <CircleDollarSign className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">
              {formatCurrency(metrics.pendingAmount)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Awaiting brand confirmation</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">Approved to Settle</p>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">
              {formatCurrency(metrics.approvedAmount)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Ready for payout processing</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">Paid & Settled</p>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal/10 text-teal">
                <UsersRound className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">
              {formatCurrency(metrics.paidAmount)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Transferred to creators</p>
          </CardContent>
        </Card>
      </section>

      <Card className="shadow-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="relative min-w-64 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9 h-9"
              placeholder="Search creator name, handle, store, or order #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex rounded-lg border bg-muted/30 p-0.5">
            {(
              [
                { id: "ALL", label: "All" },
                { id: "PENDING", label: "Pending" },
                { id: "APPROVED", label: "Approved" },
                { id: "PAID", label: "Paid" },
                { id: "REVERSED", label: "Reversed" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setStatusFilter(t.id)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                  statusFilter === t.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="border-y bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Influencer Partner</th>
                <th className="px-5 py-3 font-medium">Brand Store</th>
                <th className="px-5 py-3 font-medium">Order Number</th>
                <th className="px-5 py-3 font-medium">Order GMV</th>
                <th className="px-5 py-3 font-medium">Rate</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Commission Amount</th>
              </tr>
            </thead>
            <tbody>
              {query.isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td colSpan={7} className="px-5 py-4">
                      <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                    </td>
                  </tr>
                ))
              ) : commissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                    No commissions records found.
                  </td>
                </tr>
              ) : (
                commissions.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/15 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-foreground">{c.creator?.name ?? "Creator"}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {c.creator?.instagram ? (
                          <>
                            <Instagram className="h-3 w-3 text-pink-500" />
                            @{c.creator.instagram}
                          </>
                        ) : (
                          c.creator?.code ? `@${c.creator.code}` : "No code"
                        )}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-foreground">{c.storeName}</td>
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold">{c.orderNumber}</td>
                    <td className="px-5 py-3.5 font-medium">{formatCurrency(c.orderAmount)}</td>
                    <td className="px-5 py-3.5 text-muted-foreground text-xs">{c.commissionRate}%</td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={c.status === "PAID" ? "outline" : c.status === "APPROVED" ? "default" : "secondary"}
                        className={
                          c.status === "PAID"
                            ? "border-teal/30 bg-teal/5 text-teal font-medium text-xs"
                            : c.status === "APPROVED"
                            ? "bg-primary text-primary-foreground font-medium text-xs"
                            : "text-xs"
                        }
                      >
                        {c.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(c.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// -------------------------------------------------------------
// 3. PAYOUTS PAGE
// -------------------------------------------------------------
export function PayoutsPage() {
  const query = useQuery({
    queryKey: ["admin", "commissions"],
    queryFn: () => getAdminCommissions(),
  });

  const commissions = query.data?.commissions ?? [];
  const metrics = query.data?.metrics ?? {
    pendingAmount: 0,
    approvedAmount: 0,
    paidAmount: 0,
    totalCommissionsCount: 0,
  };

  // Group by creator
  const creatorMap = new Map<string, { creator: any; pending: number; approved: number; paid: number; total: number; orderCount: number }>();

  for (const c of commissions) {
    const cid = c.creator?.id ?? "unknown";
    if (!creatorMap.has(cid)) {
      creatorMap.set(cid, {
        creator: c.creator,
        pending: 0,
        approved: 0,
        paid: 0,
        total: 0,
        orderCount: 0,
      });
    }
    const item = creatorMap.get(cid)!;
    item.orderCount += 1;
    item.total += c.amount;
    if (c.status === "PENDING") item.pending += c.amount;
    if (c.status === "APPROVED") item.approved += c.amount;
    if (c.status === "PAID") item.paid += c.amount;
  }

  const creatorRoster = Array.from(creatorMap.values());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Creator Payout Batches & Settlements"
        description="Review creator earnings balances, bank settlement readiness, and historical payout distributions."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">Ready for Payout Batch</p>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal/10 text-teal">
                <CreditCard className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">
              {formatCurrency(metrics.approvedAmount)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Approved by brand stores</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">Total Settled & Paid</p>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">
              {formatCurrency(metrics.paidAmount)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Successfully transferred</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">Active Influencer Partners</p>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo/10 text-indigo">
                <UsersRound className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">{creatorRoster.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">With commission transactions</p>
          </CardContent>
        </Card>
      </section>

      <Card className="shadow-card overflow-hidden">
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="border-y bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Influencer Name</th>
                <th className="px-5 py-3 font-medium">Instagram Handle</th>
                <th className="px-5 py-3 text-center font-medium">Attributed Orders</th>
                <th className="px-5 py-3 text-right font-medium">Pending</th>
                <th className="px-5 py-3 text-right font-medium">Ready for Payout</th>
                <th className="px-5 py-3 text-right font-medium">Total Paid</th>
              </tr>
            </thead>
            <tbody>
              {query.isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td colSpan={6} className="px-5 py-4">
                      <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                    </td>
                  </tr>
                ))
              ) : creatorRoster.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    No creator payout balances found.
                  </td>
                </tr>
              ) : (
                creatorRoster.map((item, idx) => (
                  <tr key={idx} className="border-b last:border-0 hover:bg-muted/15 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-foreground">
                      {item.creator?.name ?? "Influencer"}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-pink-600 dark:text-pink-400 font-medium">
                      {item.creator?.instagram ? `@${item.creator.instagram}` : item.creator?.code ? `@${item.creator.code}` : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-center font-medium">{item.orderCount}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-amber-600">
                      {formatCurrency(item.pending)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-primary">
                      {formatCurrency(item.approved)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(item.paid)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// -------------------------------------------------------------
// 4. FINANCE OVERVIEW PAGE
// -------------------------------------------------------------
export function FinanceOverviewPage() {
  const dashQuery = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: getAdminDashboard,
  });

  const commQuery = useQuery({
    queryKey: ["admin", "commissions"],
    queryFn: () => getAdminCommissions(),
  });

  const metrics = dashQuery.data?.metrics ?? {
    platformGMV: 0,
    totalCommissions: 0,
    totalOrdersCount: 0,
    activeStores: 0,
  };

  const storePayoutsDue = metrics.platformGMV - metrics.totalCommissions;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Financial Settlement & Overview"
        description="Comprehensive reconciliation of multi-tenant gross merchandise volume, creator earnings, and brand settlements."
      />

      <section className="grid gap-4 sm:grid-cols-4">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Gross Marketplace GMV</p>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(metrics.platformGMV)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Across {metrics.totalOrdersCount} orders</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Creator Commissions Accrued</p>
            <p className="mt-2 text-2xl font-bold text-primary">{formatCurrency(metrics.totalCommissions)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Attributed creator share</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Store Settlements Due</p>
            <p className="mt-2 text-2xl font-bold text-teal">{formatCurrency(storePayoutsDue)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Net store proceeds</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Active Merchant Brands</p>
            <p className="mt-2 text-2xl font-bold">{metrics.activeStores}</p>
            <p className="mt-1 text-xs text-muted-foreground">Connected stores</p>
          </CardContent>
        </Card>
      </section>

      <CommissionsPage />
    </div>
  );
}
