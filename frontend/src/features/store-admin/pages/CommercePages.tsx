  import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  BadgeIndianRupee,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  Filter,
  Instagram,
  Mail,
  MapPin,
  Package,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  Tag,
  User,
  UsersRound,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getStoreProducts, getStoreProductSyncStatus, syncStoreProducts } from "../api/products.api";
import { getStoreOrders, syncStoreOrders } from "../api/orders.api";
import { getStoreCustomers, getStoreCustomerDetails } from "../api/customers.api";
import {
  getStoreDiscounts,
  createStoreDiscount,
  updateStoreDiscount,
  deleteStoreDiscount,
} from "../api/discounts.api";

function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatProductPrice(price: string, currency: string) {
  const value = Number(price);
  if (!Number.isFinite(value)) return "Price unavailable";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function SummaryCard({
  label,
  value,
  hint,
  icon: Icon,
  iconClass = "bg-primary/10 text-primary",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  iconClass?: string;
}) {
  return (
    <Card className="shadow-card">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <span className={`grid h-9 w-9 place-items-center rounded-lg ${iconClass}`}>
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-3 font-display text-2xl font-semibold tracking-tight">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function PageTable({ children }: { children: React.ReactNode }) {
  return (
    <Card className="shadow-card overflow-hidden">
      <CardContent className="overflow-x-auto p-0">{children}</CardContent>
    </Card>
  );
}

function CustomerAvatar({ name }: { name: string }) {
  const clean = name.replace(/@.*/, "").replace(/[^a-zA-Z0-9 ]/g, " ").trim();
  const initials = (clean || "User")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
      {initials || "U"}
    </span>
  );
}

// -------------------------------------------------------------
// 1. PRODUCTS PAGE
// -------------------------------------------------------------
export function ProductsPage() {
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<"ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK">("ALL");
  const [page, setPage] = useState(1);

  const normalizedSearch = search.trim();
  const query = useQuery({
    queryKey: ["store", "products", page, normalizedSearch],
    queryFn: () => getStoreProducts(page, { search: normalizedSearch || undefined }),
  });

  const sync = useQuery({
    queryKey: ["store", "products", "sync"],
    queryFn: syncStoreProducts,
    enabled: false,
  });

  const syncStatus = useQuery({
    queryKey: ["store", "products", "sync-status"],
    queryFn: getStoreProductSyncStatus,
    refetchInterval: (q) => (q.state.data?.sync.status === "RUNNING" ? 2000 : false),
  });

  const isSyncing = sync.isFetching || syncStatus.data?.sync.status === "RUNNING";

  useEffect(() => {
    if (syncStatus.data?.sync.status !== "RUNNING") {
      if (syncStatus.data?.sync.status === "COMPLETED") void query.refetch();
      return;
    }
    void query.refetch();
    const interval = window.setInterval(() => void query.refetch(), 2000);
    return () => window.clearInterval(interval);
  }, [syncStatus.data?.sync.status]);

  const allProducts = query.data?.products ?? [];
  const summary = query.data?.summary;
  const shopDomain = query.data?.shopDomain?.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const lowStockCount = summary?.lowStockCount ?? allProducts.filter((p) => p.stock > 0 && p.stock < 10).length;
  const outOfStockCount = summary?.outOfStockCount ?? allProducts.filter((p) => p.stock === 0).length;
  const totalSales = summary?.totalSales ?? allProducts.reduce((sum, p) => sum + (p.salesTotal || 0), 0);
  const creatorSales = allProducts.reduce((sum, p) => sum + (p.creatorSales || 0), 0);

  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      if (stockFilter === "IN_STOCK") return p.stock >= 10;
      if (stockFilter === "LOW_STOCK") return p.stock > 0 && p.stock < 10;
      if (stockFilter === "OUT_OF_STOCK") return p.stock === 0;
      return true;
    });
  }, [allProducts, stockFilter]);

  const tones = [
    "bg-coral/15 text-coral",
    "bg-primary/15 text-primary",
    "bg-teal/15 text-teal",
    "bg-indigo/15 text-indigo",
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalogue & Products"
        description="Live Shopify sync, stock availability, product sales, and creator affiliate assignments."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void sync.refetch().then(() => void syncStatus.refetch())}
              disabled={isSyncing}
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing
                ? `Syncing${syncStatus.data?.sync.synced ? ` (${syncStatus.data.sync.synced})` : ""}...`
                : "Sync from Shopify"}
            </Button>
            {shopDomain ? (
              <Button variant="outline" size="sm" asChild>
                <a href={`https://${shopDomain}/admin/products`} target="_blank" rel="noreferrer">
                  <ArrowUpRight className="h-4 w-4" /> Manage in Shopify
                </a>
              </Button>
            ) : null}
            <Button asChild size="sm">
              <Link to="/store-admin/affiliate-links">
                <Sparkles className="h-4 w-4" /> Link to Creators
              </Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total Products"
          value={query.isLoading ? "..." : String(query.data?.pagination.total ?? 0)}
          hint={summary?.totalCatalogValue ? `Catalogue value: ${formatCurrency(summary.totalCatalogValue)}` : "Catalogue items"}
          icon={Package}
          iconClass="bg-primary/10 text-primary"
        />
        <SummaryCard
          label="Total Product Sales"
          value={query.isLoading ? "..." : formatCurrency(totalSales)}
          hint="From customer orders"
          icon={ShoppingBag}
          iconClass="bg-emerald-500/10 text-emerald-600"
        />
        <SummaryCard
          label="Creator Attributed"
          value={query.isLoading ? "..." : formatCurrency(creatorSales)}
          hint="Affiliate GMV driven"
          icon={Sparkles}
          iconClass="bg-indigo-500/10 text-indigo-600"
        />
        <SummaryCard
          label="Inventory Alerts"
          value={query.isLoading ? "..." : `${lowStockCount + outOfStockCount} items`}
          hint={`${lowStockCount} low stock · ${outOfStockCount} out of stock`}
          icon={Clock}
          iconClass="bg-amber-500/10 text-amber-600"
        />
      </section>

      {/* Filter Tabs & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 h-9"
            placeholder="Search products by title, SKU, or category..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex rounded-lg border bg-muted/30 p-0.5">
          {(
            [
              { id: "ALL", label: "All Items" },
              { id: "IN_STOCK", label: "In Stock" },
              { id: "LOW_STOCK", label: "Low Stock" },
              { id: "OUT_OF_STOCK", label: "Out of Stock" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setStockFilter(t.id)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                stockFilter === t.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <PageTable>
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="border-y bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">Product Item</th>
              <th className="px-5 py-3 font-medium">Stock Status</th>
              <th className="px-5 py-3 font-medium">Catalogue Price</th>
              <th className="px-5 py-3 font-medium">Total Sales</th>
              <th className="px-5 py-3 font-medium">Creator Impact</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {query.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td colSpan={6} className="px-5 py-4">
                    <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                  </td>
                </tr>
              ))
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                  No products found matching your filters.
                </td>
              </tr>
            ) : (
              filteredProducts.map((product, index) => {
                const numericShopifyId = product.shopifyId?.split("/").pop() || "";
                const directShopifyUrl =
                  shopDomain && numericShopifyId
                    ? `https://${shopDomain}/admin/products/${numericShopifyId}`
                    : null;

                return (
                  <tr key={product.id} className="border-b last:border-0 hover:bg-muted/15 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt=""
                            className="h-10 w-10 rounded-lg object-cover border"
                          />
                        ) : (
                          <span
                            className={`grid h-10 w-10 place-items-center rounded-lg ${
                              tones[index % tones.length]
                            }`}
                          >
                            <Package className="h-5 w-5" />
                          </span>
                        )}
                        <div>
                          <p className="font-semibold text-foreground">{product.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground font-mono">
                              {product.sku || "No SKU"}
                            </span>
                            {product.productType ? (
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                                {product.productType}
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={
                          product.stock === 0
                            ? "destructive"
                            : product.stock < 10
                            ? "secondary"
                            : "outline"
                        }
                        className={
                          product.stock >= 10
                            ? "border-teal/30 bg-teal/5 text-teal"
                            : product.stock < 10 && product.stock > 0
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-700"
                            : ""
                        }
                      >
                        {product.stock === 0
                          ? "Out of Stock"
                          : `${product.stock.toLocaleString("en-IN")} in stock`}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-foreground">
                      {formatProductPrice(product.price, product.currency)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div>
                        <span className="font-semibold text-foreground">
                          {formatCurrency(product.salesTotal || 0, product.currency)}
                        </span>
                        <span className="text-xs text-muted-foreground block">
                          {product.ordersCount || 0} {product.ordersCount === 1 ? "order" : "orders"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div>
                        <span className="font-semibold text-indigo-600">
                          {formatCurrency(product.creatorSales || 0, product.currency)}
                        </span>
                        <span className="text-xs text-muted-foreground block">
                          {product.assignedCreatorsCount || 0} {product.assignedCreatorsCount === 1 ? "creator" : "creators"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        {directShopifyUrl ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Open in Shopify Admin"
                          >
                            <a href={directShopifyUrl} target="_blank" rel="noreferrer">
                              <ArrowUpRight className="h-4 w-4" />
                            </a>
                          </Button>
                        ) : null}
                        <Button asChild variant="ghost" size="sm" className="text-primary">
                          <Link to="/store-admin/products/$productId" params={{ productId: product.id }}>
                            Details <ChevronRight className="h-4 w-4 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </PageTable>

      {query.data && query.data.pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} of {query.data.pagination.totalPages} · {query.data.pagination.total} products
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= query.data.pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// -------------------------------------------------------------
// 2. ORDERS PAGE
// -------------------------------------------------------------
export function OrdersPage() {
  const [orderSearch, setOrderSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PAID" | "UNFULFILLED" | "CREATOR_ONLY" | "REFUNDED">("ALL");
  const [orderPage, setOrderPage] = useState(1);

  const normalizedOrderSearch = orderSearch.trim();
  const ordersQuery = useQuery({
    queryKey: ["store", "orders", orderPage, normalizedOrderSearch, statusFilter],
    queryFn: () =>
      getStoreOrders(orderPage, {
        search: normalizedOrderSearch || undefined,
        financialStatus: statusFilter === "PAID" ? "PAID" : statusFilter === "REFUNDED" ? "REFUNDED" : undefined,
        fulfillmentStatus: statusFilter === "UNFULFILLED" ? "UNFULFILLED" : undefined,
        creatorOnly: statusFilter === "CREATOR_ONLY",
      }),
  });

  const ordersSync = useQuery({
    queryKey: ["store", "orders", "sync"],
    queryFn: syncStoreOrders,
    enabled: false,
  });

  const allOrders = ordersQuery.data?.orders ?? [];
  const summary = ordersQuery.data?.summary;
  const shopDomain = ordersQuery.data?.shopDomain?.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const totalOrdersCount = summary?.totalOrders ?? (ordersQuery.data?.pagination.total ?? 0);
  const totalSalesAmount = summary?.totalSales ?? allOrders.reduce((sum, o) => sum + Number(o.total ?? 0), 0);
  const creatorSalesAmount = summary?.creatorSales ?? allOrders.filter((o) => o.creatorCode).reduce((sum, o) => sum + Number(o.total ?? 0), 0);
  const unfulfilledCount = summary?.unfulfilledCount ?? allOrders.filter((o) => !o.fulfillmentStatus || /processing|unfulfilled/i.test(o.fulfillmentStatus)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Store Orders & Attribution"
        description="All live Shopify customer orders with instant creator tracking tags, commission status, and fulfillment state."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void ordersSync.refetch().then(() => ordersQuery.refetch())}
              disabled={ordersSync.isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${ordersSync.isFetching ? "animate-spin" : ""}`} />
              {ordersSync.isFetching ? "Syncing orders..." : "Sync from Shopify"}
            </Button>
            {shopDomain ? (
              <Button variant="outline" size="sm" asChild>
                <a href={`https://${shopDomain}/admin/orders`} target="_blank" rel="noreferrer">
                  <ArrowUpRight className="h-4 w-4" /> Manage in Shopify
                </a>
              </Button>
            ) : null}
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total Orders"
          value={ordersQuery.isLoading ? "..." : String(totalOrdersCount)}
          hint="Across all channels"
          icon={ShoppingBag}
          iconClass="bg-primary/10 text-primary"
        />
        <SummaryCard
          label="Total Sales Volume"
          value={ordersQuery.isLoading ? "..." : formatCurrency(totalSalesAmount, allOrders[0]?.currency ?? "INR")}
          hint="Total order revenue"
          icon={BadgeIndianRupee}
          iconClass="bg-emerald-500/10 text-emerald-600"
        />
        <SummaryCard
          label="Creator Attributed"
          value={ordersQuery.isLoading ? "..." : formatCurrency(creatorSalesAmount, allOrders[0]?.currency ?? "INR")}
          hint={`${summary?.creatorOrdersCount ?? 0} influencer orders`}
          icon={Sparkles}
          iconClass="bg-indigo-500/10 text-indigo-600"
        />
        <SummaryCard
          label="Needs Fulfillment"
          value={ordersQuery.isLoading ? "..." : String(unfulfilledCount)}
          hint="Awaiting dispatch"
          icon={Package}
          iconClass="bg-amber-500/10 text-amber-600"
        />
      </section>

      {/* Filter Tabs & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 h-9"
            placeholder="Search order number (#1001), customer email, or creator..."
            value={orderSearch}
            onChange={(e) => {
              setOrderSearch(e.target.value);
              setOrderPage(1);
            }}
          />
        </div>
        <div className="flex rounded-lg border bg-muted/30 p-0.5">
          {(
            [
              { id: "ALL", label: "All Orders" },
              { id: "PAID", label: "Paid" },
              { id: "CREATOR_ONLY", label: "Creator Orders" },
              { id: "UNFULFILLED", label: "To Fulfill" },
              { id: "REFUNDED", label: "Refunded" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setStatusFilter(t.id);
                setOrderPage(1);
              }}
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

      <PageTable>
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="border-y bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">Order & Customer</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Attribution & Commission</th>
              <th className="px-5 py-3 font-medium">Payment</th>
              <th className="px-5 py-3 font-medium">Fulfillment</th>
              <th className="px-5 py-3 text-right font-medium">Total Amount</th>
              <th className="px-5 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {ordersQuery.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td colSpan={7} className="px-5 py-4">
                    <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                  </td>
                </tr>
              ))
            ) : allOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                  No orders found matching your filters.
                </td>
              </tr>
            ) : (
              allOrders.map((order) => {
                const numericShopifyId = order.shopifyId?.split("/").pop() || "";
                const directShopifyUrl =
                  shopDomain && numericShopifyId
                    ? `https://${shopDomain}/admin/orders/${numericShopifyId}`
                    : null;

                return (
                  <tr key={order.id} className="border-b last:border-0 hover:bg-muted/15 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <CustomerAvatar name={order.email || order.name} />
                        <div>
                          <Link
                            to="/store-admin/orders/$orderId"
                            params={{ orderId: order.id }}
                            className="font-semibold text-foreground hover:text-primary transition-colors"
                          >
                            {order.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">{order.email ?? "Guest Checkout"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {order.processedAt
                        ? new Date(order.processedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      {order.creatorCode || order.creator ? (
                        <div className="space-y-0.5">
                          <Badge variant="outline" className="border-coral/30 bg-coral/10 font-medium text-coral text-xs">
                            <Instagram className="mr-1 h-3 w-3" /> {order.creator?.handle ?? `@${order.creatorCode}`}
                          </Badge>
                          {order.commission ? (
                            <span className="text-[11px] text-muted-foreground block">
                              Commission: {formatCurrency(order.commission.amount, order.currency)} ({order.commission.status})
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Direct Store</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={/refund/i.test(order.financialStatus ?? "") ? "destructive" : "outline"}
                        className={
                          /paid/i.test(order.financialStatus ?? "")
                            ? "border-teal/30 bg-teal/5 text-teal"
                            : ""
                        }
                      >
                        {order.financialStatus || "Paid"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={
                          /processing|unfulfilled/i.test(order.fulfillmentStatus ?? "")
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {order.fulfillmentStatus || "Unfulfilled"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-foreground">
                      {formatCurrency(Number(order.total ?? 0), order.currency ?? "INR")}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        {directShopifyUrl ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            title="Open in Shopify Admin"
                          >
                            <a href={directShopifyUrl} target="_blank" rel="noreferrer">
                              <ArrowUpRight className="h-4 w-4" />
                            </a>
                          </Button>
                        ) : null}
                        <Button asChild variant="ghost" size="sm" className="text-primary">
                          <Link to="/store-admin/orders/$orderId" params={{ orderId: order.id }}>
                            Details <ChevronRight className="h-4 w-4 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </PageTable>

      {ordersQuery.data && ordersQuery.data.pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {orderPage} of {ordersQuery.data.pagination.totalPages} · {ordersQuery.data.pagination.total} orders
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={orderPage === 1}
              onClick={() => setOrderPage(orderPage - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={orderPage >= ordersQuery.data.pagination.totalPages}
              onClick={() => setOrderPage(orderPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// -------------------------------------------------------------
// 3. CUSTOMERS PAGE
// -------------------------------------------------------------
export function CustomersPage() {
  const [customerPage, setCustomerPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "REPEAT" | "SINGLE" | "CREATOR_ATTRIBUTED">("ALL");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["store", "customers", customerPage, search.trim(), filter],
    queryFn: () =>
      getStoreCustomers(customerPage, {
        search: search.trim() || undefined,
        filter: filter !== "ALL" ? filter : undefined,
      }),
  });

  const customerDetailsQuery = useQuery({
    queryKey: ["store", "customer", selectedCustomerId],
    queryFn: () => getStoreCustomerDetails(selectedCustomerId!),
    enabled: Boolean(selectedCustomerId),
  });

  const customerRows = query.data?.customers ?? [];
  const summary = query.data?.summary;
  const shopDomain = query.data?.shopDomain?.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const totalCustomers = summary?.totalCustomers ?? (query.data?.pagination.total ?? 0);
  const totalLifetimeSpend = summary?.totalLifetimeRevenue ?? customerRows.reduce((sum, c) => sum + c.lifetimeSpend, 0);
  const repeatRate = summary?.repeatCustomerRate ?? (totalCustomers > 0 ? Math.round((customerRows.filter(c => c.isRepeatBuyer).length / totalCustomers) * 100) : 0);
  const creatorAcquiredCount = summary?.creatorAcquiredCustomers ?? customerRows.filter(c => c.attributedCreatorCode).length;

  const selectedCustomer = customerDetailsQuery.data?.customer;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Store Customers"
        description="Profiles, order frequencies, lifetime spending, and creator attribution derived from synced customer purchases."
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total Customers"
          value={query.isLoading ? "..." : String(totalCustomers)}
          hint="Unique buyer profiles"
          icon={UsersRound}
          iconClass="bg-primary/10 text-primary"
        />
        <SummaryCard
          label="Lifetime Spend"
          value={query.isLoading ? "..." : formatCurrency(totalLifetimeSpend, customerRows[0]?.currency ?? "INR")}
          hint={summary?.averageCustomerSpend ? `Avg LTV: ${formatCurrency(summary.averageCustomerSpend)}` : "Cumulative purchases"}
          icon={BadgeIndianRupee}
          iconClass="bg-emerald-500/10 text-emerald-600"
        />
        <SummaryCard
          label="Repeat Customer Rate"
          value={query.isLoading ? "..." : `${repeatRate}%`}
          hint={`${summary?.repeatBuyersCount ?? 0} returning buyers`}
          icon={CheckCircle2}
          iconClass="bg-teal/10 text-teal"
        />
        <SummaryCard
          label="Creator Acquired"
          value={query.isLoading ? "..." : String(creatorAcquiredCount)}
          hint="Referred by influencers"
          icon={Sparkles}
          iconClass="bg-indigo-500/10 text-indigo-600"
        />
      </section>

      {/* Filter Tabs & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 h-9"
            placeholder="Search by name, email, city, or creator code..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCustomerPage(1);
            }}
          />
        </div>
        <div className="flex rounded-lg border bg-muted/30 p-0.5">
          {(
            [
              { id: "ALL", label: "All Buyers" },
              { id: "REPEAT", label: "Repeat Buyers" },
              { id: "CREATOR_ATTRIBUTED", label: "Creator Referred" },
              { id: "SINGLE", label: "Single Order" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setFilter(t.id);
                setCustomerPage(1);
              }}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                filter === t.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <PageTable>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-y bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">Customer Profile</th>
              <th className="px-5 py-3 font-medium">Orders Placed</th>
              <th className="px-5 py-3 font-medium">Acquisition Channel</th>
              <th className="px-5 py-3 font-medium">Lifetime Spend</th>
              <th className="px-5 py-3 font-medium">Last Purchase</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
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
            ) : customerRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                  No customers found matching your search or filters.
                </td>
              </tr>
            ) : (
              customerRows.map((customer) => (
                <tr key={customer.email} className="border-b last:border-0 hover:bg-muted/15 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <CustomerAvatar name={customer.name || customer.email} />
                      <div>
                        <p className="font-semibold text-foreground">{customer.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          <span>{customer.email}</span>
                          {customer.location ? (
                            <>
                              <span>·</span>
                              <span>{customer.location}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge
                      variant={customer.isRepeatBuyer ? "default" : "secondary"}
                      className={customer.isRepeatBuyer ? "bg-teal/10 text-teal border-teal/20" : ""}
                    >
                      {customer.ordersCount} {customer.ordersCount === 1 ? "order" : "orders"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    {customer.attributedCreatorCode ? (
                      <Badge variant="outline" className="border-coral/30 bg-coral/10 font-medium text-coral text-xs">
                        <Instagram className="mr-1 h-3 w-3" /> @{customer.attributedCreatorCode}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Direct Store</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-foreground">
                    {formatCurrency(customer.lifetimeSpend, customer.currency)}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground">
                    {customer.lastOrderAt
                      ? new Date(customer.lastOrderAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary"
                      onClick={() => setSelectedCustomerId(customer.id || customer.email)}
                    >
                      View Profile <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </PageTable>

      {query.data && query.data.pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {customerPage} of {query.data.pagination.totalPages} · {query.data.pagination.total} customers
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={customerPage === 1}
              onClick={() => setCustomerPage(customerPage - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={customerPage >= query.data.pagination.totalPages}
              onClick={() => setCustomerPage(customerPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      {/* Customer Profile & Order History Drawer / Sheet */}
      <Sheet open={Boolean(selectedCustomerId)} onOpenChange={(open) => !open && setSelectedCustomerId(null)}>
        <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                {(selectedCustomer?.name?.[0] ?? "C").toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-bold">{selectedCustomer?.name || "Customer Profile"}</p>
                <p className="text-xs text-muted-foreground font-normal">{selectedCustomer?.email}</p>
              </div>
            </SheetTitle>
            <SheetDescription>
              Complete purchase history, contact records, and creator attribution.
            </SheetDescription>
          </SheetHeader>

          {customerDetailsQuery.isLoading ? (
            <div className="space-y-4 py-6">
              <div className="h-24 w-full animate-pulse rounded-xl bg-muted" />
              <div className="h-48 w-full animate-pulse rounded-xl bg-muted" />
            </div>
          ) : selectedCustomer ? (
            <div className="space-y-6 py-6">
              {/* Customer Stats Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-3.5 bg-muted/20">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Lifetime Spend</p>
                  <p className="text-xl font-bold text-foreground mt-1">
                    {formatCurrency(selectedCustomer.lifetimeSpend, selectedCustomer.currency)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Avg Order: {formatCurrency(selectedCustomer.averageOrderValue, selectedCustomer.currency)}
                  </p>
                </div>
                <div className="rounded-xl border p-3.5 bg-muted/20">
                  <p className="text-xs text-muted-foreground uppercase font-medium">Orders Placed</p>
                  <p className="text-xl font-bold text-foreground mt-1">{selectedCustomer.ordersCount}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {selectedCustomer.ordersCount > 1 ? "Repeat Buyer" : "First-time Buyer"}
                  </p>
                </div>
              </div>

              {/* Contact & Address */}
              <div className="space-y-3 rounded-xl border p-4 bg-background">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Contact & Shipping Records
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                  {selectedCustomer.phone ? (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-primary" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                  ) : null}
                  {selectedCustomer.shippingAddress ? (
                    <div className="flex items-start gap-2 pt-1 border-t">
                      <MapPin className="h-3.5 w-3.5 text-primary mt-0.5" />
                      <div className="text-muted-foreground">
                        {selectedCustomer.shippingAddress.name ? (
                          <p className="font-semibold text-foreground">{selectedCustomer.shippingAddress.name}</p>
                        ) : null}
                        <p>{selectedCustomer.shippingAddress.address1}</p>
                        <p>
                          {[
                            selectedCustomer.shippingAddress.city,
                            selectedCustomer.shippingAddress.province,
                            selectedCustomer.shippingAddress.zip,
                            selectedCustomer.shippingAddress.country,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Creator Attribution */}
              {selectedCustomer.attributedCreatorCodes.length > 0 ? (
                <div className="rounded-xl border p-4 bg-coral/5 border-coral/20 space-y-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-coral flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Referred By Influencers
                  </h4>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedCustomer.attributedCreatorCodes.map((code) => (
                      <Badge key={code} variant="outline" className="border-coral/30 bg-coral/10 text-coral font-mono text-xs">
                        <Instagram className="mr-1 h-3 w-3" /> @{code}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Full Chronological Order History */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Order History ({selectedCustomer.orderHistory.length})</span>
                </h4>

                <div className="space-y-3">
                  {selectedCustomer.orderHistory.map((order) => (
                    <div key={order.id} className="rounded-xl border p-4 hover:border-primary/40 transition-colors bg-background">
                      <div className="flex items-center justify-between">
                        <Link
                          to="/store-admin/orders/$orderId"
                          params={{ orderId: order.id }}
                          className="font-semibold text-sm hover:text-primary transition-colors flex items-center gap-1"
                        >
                          {order.name} <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </Link>
                        <span className="font-bold text-sm text-foreground">
                          {formatCurrency(Number(order.total || 0), order.currency)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                        <span>
                          {order.processedAt
                            ? new Date(order.processedAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </span>
                        <span>·</span>
                        <span>{order.itemCount} items</span>
                        <span>·</span>
                        <Badge variant="outline" className="text-[10px] py-0">
                          {order.financialStatus}
                        </Badge>
                      </div>

                      {order.creatorCode ? (
                        <div className="mt-2 pt-2 border-t flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Attributed Creator</span>
                          <span className="font-medium text-coral flex items-center gap-1">
                            <Instagram className="h-3 w-3" /> @{order.creatorCode}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// -------------------------------------------------------------
// 4. DISCOUNTS PAGE
// -------------------------------------------------------------
export function DiscountsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "CREATOR_ONLY" | "STORE_COUPONS" | "ACTIVE" | "EXPIRED">("ALL");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Create Coupon Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDiscountType, setNewDiscountType] = useState<"PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING">("PERCENTAGE");
  const [newValue, setNewValue] = useState("10");
  const [newCreatorId, setNewCreatorId] = useState("NONE");
  const [newExpiresAt, setNewExpiresAt] = useState("");

  const query = useQuery({
    queryKey: ["store", "discounts", search.trim(), filter],
    queryFn: () => getStoreDiscounts({ search: search.trim() || undefined }),
  });

  const discounts = query.data?.discounts ?? [];
  const summary = query.data?.summary;
  const availableCreators = query.data?.availableCreators ?? [];
  const shopDomain = query.data?.shopDomain?.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const filteredDiscounts = useMemo(() => {
    return discounts.filter((d) => {
      if (filter === "CREATOR_ONLY") return d.isCreatorCode;
      if (filter === "STORE_COUPONS") return !d.isCreatorCode;
      if (filter === "ACTIVE") return d.status === "ACTIVE";
      if (filter === "EXPIRED") return d.status === "EXPIRED" || d.status === "DISABLED";
      return true;
    });
  }, [discounts, filter]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code ${code} copied!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateDiscount = async () => {
    if (!newCode.trim()) {
      toast.error("Please enter a discount coupon code.");
      return;
    }
    try {
      await createStoreDiscount({
        code: newCode.trim().toUpperCase(),
        description: newDescription.trim() || undefined,
        discountType: newDiscountType,
        value: Number(newValue) || 0,
        creatorId: newCreatorId === "NONE" ? null : newCreatorId,
        expiresAt: newExpiresAt ? new Date(newExpiresAt).toISOString() : null,
      });
      toast.success(`Coupon ${newCode.toUpperCase()} created successfully!`);
      setIsCreateModalOpen(false);
      setNewCode("");
      setNewDescription("");
      setNewValue("10");
      setNewCreatorId("NONE");
      setNewExpiresAt("");
      void query.refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create discount code.");
    }
  };

  const handleToggleStatus = async (discount: any) => {
    if (!discount.isCustom) {
      toast.info("Creator promo codes are automatically managed via the Creator Roster.");
      return;
    }
    const newStatus = discount.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    try {
      await updateStoreDiscount(discount.id, { status: newStatus });
      toast.success(`Discount ${discount.code} marked as ${newStatus}`);
      void query.refetch();
    } catch {
      toast.error("Failed to update discount status.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Creator Promo Codes & Discounts"
        description="Issue promotional discount vouchers, manage influencer promo codes, and track real-time checkout redemptions."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {shopDomain ? (
              <Button variant="outline" size="sm" asChild>
                <a href={`https://${shopDomain}/admin/discounts`} target="_blank" rel="noreferrer">
                  <ArrowUpRight className="h-4 w-4" /> Open in Shopify
                </a>
              </Button>
            ) : null}
            <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4" /> Create Promo Code
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Active Promo Codes"
          value={query.isLoading ? "..." : String(summary?.totalCoupons ?? 0)}
          hint="Live in store"
          icon={Tag}
          iconClass="bg-primary/10 text-primary"
        />
        <SummaryCard
          label="Total Redemptions"
          value={query.isLoading ? "..." : String(summary?.totalRedemptions ?? 0)}
          hint="Applied at checkout"
          icon={ShoppingBag}
          iconClass="bg-coral/10 text-coral"
        />
        <SummaryCard
          label="Customer Savings"
          value={query.isLoading ? "..." : formatCurrency(summary?.totalCustomerSavings ?? 0)}
          hint="Promotional discount given"
          icon={BadgeIndianRupee}
          iconClass="bg-teal/10 text-teal"
        />
        <SummaryCard
          label="Creator Code Revenue"
          value={query.isLoading ? "..." : formatCurrency(summary?.creatorCodeRevenue ?? 0)}
          hint="Influencer promo GMV"
          icon={Sparkles}
          iconClass="bg-indigo/10 text-indigo"
        />
      </section>

      {/* Filter Tabs & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 h-9"
            placeholder="Search by promo code or creator..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex rounded-lg border bg-muted/30 p-0.5">
          {(
            [
              { id: "ALL", label: "All Codes" },
              { id: "CREATOR_ONLY", label: "Creator Codes" },
              { id: "STORE_COUPONS", label: "Store Coupons" },
              { id: "ACTIVE", label: "Active" },
              { id: "EXPIRED", label: "Expired" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                filter === t.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <PageTable>
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="border-y bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">Coupon Code</th>
              <th className="px-5 py-3 font-medium">Discount Offer</th>
              <th className="px-5 py-3 font-medium">Attribution</th>
              <th className="px-5 py-3 font-medium">Redemptions & Sales</th>
              <th className="px-5 py-3 font-medium">Validity</th>
              <th className="px-5 py-3 text-right font-medium">Status & Action</th>
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
            ) : filteredDiscounts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                  No discount codes found matching your search.
                </td>
              </tr>
            ) : (
              filteredDiscounts.map((discount) => (
                <tr key={discount.id || discount.code} className="border-b last:border-0 hover:bg-muted/15 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded-md text-xs">
                        <Tag className="h-3.5 w-3.5" />
                        {discount.code}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => handleCopy(discount.code)}
                        title="Copy code"
                      >
                        {copiedCode === discount.code ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="font-semibold text-foreground">
                        {discount.discountType === "PERCENTAGE"
                          ? `${discount.value}% Off`
                          : discount.discountType === "FIXED_AMOUNT"
                          ? `₹${discount.value} Off`
                          : "Free Shipping"}
                      </p>
                      <p className="text-xs text-muted-foreground">{discount.description}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {discount.creator ? (
                      <Badge variant="outline" className="border-coral/30 bg-coral/10 font-medium text-coral text-xs">
                        <Instagram className="mr-1 h-3 w-3" /> {discount.creator.handle}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Store-wide Promo</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div>
                      <span className="font-semibold text-foreground">
                        {discount.usageCount} {discount.usageCount === 1 ? "use" : "uses"}
                      </span>
                      <span className="text-xs text-muted-foreground block">
                        {formatCurrency(discount.totalSales)} sales ({formatCurrency(discount.totalSavings)} saved)
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground">
                    {discount.expiresAt
                      ? `Expires ${new Date(discount.expiresAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}`
                      : "No expiration"}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Badge
                        variant={
                          discount.status === "ACTIVE"
                            ? "outline"
                            : discount.status === "EXPIRED"
                            ? "destructive"
                            : "secondary"
                        }
                        className={
                          discount.status === "ACTIVE"
                            ? "border-teal/30 bg-teal/5 text-teal font-medium"
                            : ""
                        }
                      >
                        {discount.status}
                      </Badge>
                      {discount.isCustom ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
                          onClick={() => handleToggleStatus(discount)}
                        >
                          {discount.status === "ACTIVE" ? "Disable" : "Enable"}
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </PageTable>

      {/* CREATE DISCOUNT MODAL */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Promotional Coupon</DialogTitle>
            <DialogDescription>
              Issue a discount promo code for marketing campaigns or creator exclusives.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Coupon Code</Label>
              <Input
                placeholder="e.g. FESTIVE20 or VIPCREATOR"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                className="font-mono uppercase font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label>Description / Offer Details</Label>
              <Input
                placeholder="e.g. 20% festive discount on all items"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select
                  value={newDiscountType}
                  onValueChange={(val: any) => setNewDiscountType(val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                    <SelectItem value="FIXED_AMOUNT">Fixed Amount (₹)</SelectItem>
                    <SelectItem value="FREE_SHIPPING">Free Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Discount Value</Label>
                <Input
                  type="number"
                  min="1"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  disabled={newDiscountType === "FREE_SHIPPING"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assign to Influencer (Optional)</Label>
              <Select value={newCreatorId} onValueChange={setNewCreatorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Store-wide Promo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">General / Store-wide Coupon</SelectItem>
                  {availableCreators.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.displayName} {c.instagramUsername ? `(@${c.instagramUsername})` : c.creatorCode ? `(@${c.creatorCode})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Expiration Date (Optional)</Label>
              <Input
                type="date"
                value={newExpiresAt}
                onChange={(e) => setNewExpiresAt(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDiscount}>
              Create Coupon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
