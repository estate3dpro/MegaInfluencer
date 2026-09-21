import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  BadgeIndianRupee,
  ChevronRight,
  Copy,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Tag,
  UsersRound,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getStoreProducts, getStoreProductSyncStatus, syncStoreProducts } from "../api/products.api";
import { getStoreOrders, syncStoreOrders } from "../api/orders.api";
import { getStoreCustomers } from "../api/customers.api";

function SearchInput({ placeholder }: { placeholder: string }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input className="pl-9" placeholder={placeholder} />
    </div>
  );
}

const orders = [
  {
    id: "#UT-10482",
    customer: "Priya Sharma",
    date: "Today, 10:42 AM",
    amount: "₹3,498",
    payment: "Paid",
    fulfillment: "Processing",
  },
  {
    id: "#UT-10481",
    customer: "Vikram Rao",
    date: "Today, 9:18 AM",
    amount: "₹1,899",
    payment: "Paid",
    fulfillment: "Unfulfilled",
  },
  {
    id: "#UT-10480",
    customer: "Ananya Iyer",
    date: "Yesterday, 5:36 PM",
    amount: "₹5,247",
    payment: "Paid",
    fulfillment: "Fulfilled",
  },
  {
    id: "#UT-10479",
    customer: "Rahul Mehta",
    date: "Yesterday, 3:12 PM",
    amount: "₹2,199",
    payment: "Paid",
    fulfillment: "Fulfilled",
  },
  {
    id: "#UT-10478",
    customer: "Nisha Verma",
    date: "Sep 13, 11:05 AM",
    amount: "₹1,299",
    payment: "Refunded",
    fulfillment: "Returned",
  },
];

const customers = [
  {
    name: "Priya Sharma",
    email: "priya.sharma@email.com",
    orders: 8,
    spent: "₹18,740",
    lastOrder: "Today",
  },
  {
    name: "Ananya Iyer",
    email: "ananya.iyer@email.com",
    orders: 6,
    spent: "₹14,225",
    lastOrder: "Yesterday",
  },
  {
    name: "Vikram Rao",
    email: "vikram.rao@email.com",
    orders: 5,
    spent: "₹9,870",
    lastOrder: "Today",
  },
  {
    name: "Rhea Kapoor",
    email: "rhea.kapoor@email.com",
    orders: 4,
    spent: "₹8,496",
    lastOrder: "Sep 11",
  },
  {
    name: "Arjun Menon",
    email: "arjun.menon@email.com",
    orders: 3,
    spent: "₹6,897",
    lastOrder: "Sep 08",
  },
];

const discounts = [
  { code: "WELCOME15", type: "15% off", usage: "84 / 200 used", end: "Sep 30, 2026", active: true },
  {
    code: "CREATOR20",
    type: "20% off",
    usage: "41 / Unlimited",
    end: "Oct 15, 2026",
    active: true,
  },
  {
    code: "FREESHIP",
    type: "Free shipping",
    usage: "128 / Unlimited",
    end: "No end date",
    active: true,
  },
  {
    code: "SUMMER25",
    type: "25% off",
    usage: "200 / 200 used",
    end: "Ended Sep 01",
    active: false,
  },
];

function PageTable({ children }: { children: React.ReactNode }) {
  return (
    <Card className="shadow-card">
      <CardContent className="overflow-x-auto p-0">{children}</CardContent>
    </Card>
  );
}
function Initial({ name }: { name: string }) {
  return (
    <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
      {name
        .split(" ")
        .map((part) => part[0])
        .join("")}
    </span>
  );
}

function formatProductPrice(price: string, currency: string) {
  const value = Number(price);
  if (!Number.isFinite(value)) return "Price unavailable";
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function ProductsPage() {
  const [search, setSearch] = useState("");
  const [inventoryOnly, setInventoryOnly] = useState(false);
  const [page, setPage] = useState(1);
  const normalizedSearch = search.trim();
  const query = useQuery({ queryKey: ["store", "products", page, normalizedSearch], queryFn: () => getStoreProducts(page, { search: normalizedSearch || undefined }) });
  const sync = useQuery({ queryKey: ["store", "products", "sync"], queryFn: syncStoreProducts, enabled: false });
  const syncStatus = useQuery({ queryKey: ["store", "products", "sync-status"], queryFn: getStoreProductSyncStatus, refetchInterval: (query) => query.state.data?.sync.status === "RUNNING" ? 2000 : false });
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
  const filteredProducts = useMemo(() => {
    return (query.data?.products ?? []).filter((product) => !inventoryOnly || product.stock > 0);
  }, [inventoryOnly, query.data]);
  const lowStock = (query.data?.products ?? []).filter((product) => product.stock > 0 && product.stock < 10).length;
  const outOfStock = (query.data?.products ?? []).filter((product) => product.stock === 0).length;
  const tones = ["bg-coral/15 text-coral", "bg-primary/15 text-primary", "bg-teal/15 text-teal", "bg-indigo/15 text-indigo", "bg-warning/15 text-warning"];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Live Shopify catalogue, inventory and pricing."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => void sync.refetch().then(() => void syncStatus.refetch())} disabled={isSyncing}>
              <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? `Syncing${syncStatus.data?.sync.synced ? ` (${syncStatus.data.sync.synced})` : ""}...` : "Sync products"}
            </Button>
            <Button>
              <Plus className="h-4 w-4" /> Add product
            </Button>
          </div>
        }
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <Summary label="Products" value={query.isLoading ? "..." : String(query.data?.pagination.total ?? 0)} icon={Package} />
        <Summary label="Low stock" value={query.isLoading ? "..." : String(lowStock)} hint="Needs attention" icon={Package} />
        <Summary label="Out of stock" value={query.isLoading ? "..." : String(outOfStock)} hint="Update availability" icon={Package} />
      </section>
      <div className="flex flex-wrap gap-3">
        <div className="min-w-60 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search all products" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
          </div>
        </div>
        <Button variant="outline" onClick={() => setInventoryOnly(false)}>All products</Button>
        <Button variant="outline" onClick={() => setInventoryOnly((current) => !current)}>Inventory</Button>
      </div>
      <PageTable>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-y bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">Product</th>
              <th className="px-5 py-3 font-medium">Inventory</th>
              <th className="px-5 py-3 font-medium">Price</th>
              <th className="px-5 py-3 font-medium">Sales</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {query.isLoading ? Array.from({ length: 5 }).map((_, index) => (
              <tr key={index} className="border-b last:border-0"><td colSpan={5} className="px-5 py-5"><div className="h-4 w-2/3 animate-pulse rounded bg-muted" /></td></tr>
            )) : filteredProducts.map((product, index) => (
              <tr key={product.id} className="border-b last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <span className={`grid h-10 w-10 place-items-center rounded-lg ${tones[index % tones.length]}`}>
                        <Package className="h-4 w-4" />
                      </span>
                    )}
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <Badge
                    variant={
                      product.stock === 0
                        ? "destructive"
                        : product.stock < 10
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {product.stock === 0 ? "Out of stock" : `${product.stock.toLocaleString("en-IN")} in stock`}
                  </Badge>
                </td>
                <td className="px-5 py-3"><p className="font-semibold">{formatProductPrice(product.price, product.currency)}</p><p className="mt-0.5 text-xs text-muted-foreground">{product.currency}</p></td>
                <td className="px-5 py-3 text-muted-foreground">—</td>
                <td className="px-5 py-3">
                  <Button asChild variant="ghost" size="sm"><Link to="/store-admin/products/$productId" params={{ productId: product.id }}>View details <ChevronRight className="h-4 w-4" /></Link></Button>
                </td>
              </tr>
            ))}
            {!query.isLoading && !query.isError && filteredProducts.length === 0 ? <tr><td colSpan={5} className="px-5 py-16 text-center text-muted-foreground">No products found.</td></tr> : null}
            {query.isError ? <tr><td colSpan={5} className="px-5 py-16 text-center text-muted-foreground">Unable to load Shopify products.</td></tr> : null}
          </tbody>
        </table>
      </PageTable>
      {query.data && query.data.pagination.totalPages > 1 ? <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Page {page} of {query.data.pagination.totalPages} · {query.data.pagination.total} products</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={page >= query.data.pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button></div></div> : null}
    </div>
  );
}

export function OrdersPage() {
  const [orderSearch, setOrderSearch] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const ordersQuery = useQuery({ queryKey: ["store", "orders", orderPage], queryFn: () => getStoreOrders(orderPage) });
  const ordersSync = useQuery({ queryKey: ["store", "orders", "sync"], queryFn: syncStoreOrders, enabled: false });
  const orderRows = (ordersQuery.data?.orders ?? []).filter((order) => `${order.name} ${order.email ?? ""}`.toLowerCase().includes(orderSearch.toLowerCase()));
  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Track and fulfil customer purchases."
        actions={
          <Button variant="outline" onClick={() => void ordersSync.refetch().then(() => ordersQuery.refetch())} disabled={ordersSync.isFetching}><RefreshCw className={`h-4 w-4 ${ordersSync.isFetching ? "animate-spin" : ""}`} /> {ordersSync.isFetching ? "Syncing..." : "Sync orders"}</Button>
        }
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <Summary label="Orders" value={String(ordersQuery.data?.pagination.total ?? 0)} icon={ShoppingBag} />
        <Summary label="To fulfil" value={String((ordersQuery.data?.orders ?? []).filter((order) => !order.fulfillmentStatus || /processing|unfulfilled/i.test(order.fulfillmentStatus)).length)} hint="On this page" icon={Package} />
        <Summary label="Sales" value={new Intl.NumberFormat("en-IN", { style: "currency", currency: ordersQuery.data?.orders[0]?.currency ?? "INR", maximumFractionDigits: 2 }).format((ordersQuery.data?.orders ?? []).reduce((sum, order) => sum + Number(order.total ?? 0), 0))} icon={BadgeIndianRupee} />
      </section>
      <div className="flex flex-wrap gap-3">
        <div className="min-w-60 flex-1">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search order or customer" value={orderSearch} onChange={(event) => setOrderSearch(event.target.value)} /></div>
        </div>
        <Button variant="outline">All orders</Button>
        <Button variant="outline">Fulfilment status</Button>
      </div>
      <PageTable>
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-y bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">Order</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Payment</th>
              <th className="px-5 py-3 font-medium">Fulfilment</th>
              <th className="px-5 py-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {orderRows.map((order) => (
              <tr key={order.id} className="border-b last:border-0">
                <td className="px-5 py-3">
                  <Link to="/store-admin/orders/$orderId" params={{ orderId: order.id }} className="font-medium hover:text-primary">{order.name}</Link>
                  <p className="text-xs text-muted-foreground">{order.email ?? "Guest"}</p>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{order.processedAt ? new Date(order.processedAt).toLocaleDateString() : "—"}</td>
                <td className="px-5 py-3">
                  <Badge variant={/refund/i.test(order.financialStatus ?? "") ? "destructive" : "outline"}>
                    {order.financialStatus ?? "—"}
                  </Badge>
                </td>
                <td className="px-5 py-3">
                  <Badge
                    variant={
                      /processing|unfulfilled/i.test(order.fulfillmentStatus ?? "")
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {order.fulfillmentStatus ?? "Unfulfilled"}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-right font-semibold">{new Intl.NumberFormat("en-IN", { style: "currency", currency: order.currency ?? "INR" }).format(Number(order.total ?? 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PageTable>
      {ordersQuery.data && ordersQuery.data.pagination.totalPages > 1 ? <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Page {orderPage} of {ordersQuery.data.pagination.totalPages} · {ordersQuery.data.pagination.total} orders</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={orderPage === 1} onClick={() => setOrderPage(orderPage - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={orderPage >= ordersQuery.data.pagination.totalPages} onClick={() => setOrderPage(orderPage + 1)}>Next</Button></div></div> : null}
    </div>
  );
}

export function CustomersPage() {
  const [customerPage, setCustomerPage] = useState(1);
  const query = useQuery({ queryKey: ["store", "customers", customerPage], queryFn: () => getStoreCustomers(customerPage) });
  const customerRows = query.data?.customers ?? [];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="See the people who shop with your brand."
        actions={
          <Button>
            <Plus className="h-4 w-4" /> Add customer
          </Button>
        }
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <Summary label="Total customers" value={String(query.data?.pagination.total ?? 0)} icon={UsersRound} />
        <Summary label="Returning customers" value={String(customerRows.filter((customer) => customer.orders > 1).length)} hint="On this page" icon={UsersRound} />
        <Summary label="Total spend" value={new Intl.NumberFormat("en-IN", { style: "currency", currency: customerRows[0]?.currency ?? "INR", maximumFractionDigits: 0 }).format(customerRows.reduce((sum, customer) => sum + customer.spent, 0))} hint="On this page" icon={UsersRound} />
      </section>
      <div className="flex flex-wrap gap-3">
        <div className="min-w-60 flex-1">
          <SearchInput placeholder="Search customers" />
        </div>
        <Button variant="outline">All customers</Button>
        <Button variant="outline">Sort: Newest</Button>
      </div>
      <PageTable>
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-y bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Orders</th>
              <th className="px-5 py-3 font-medium">Total spent</th>
              <th className="px-5 py-3 font-medium">Last order</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {customerRows.map((customer) => (
              <tr key={customer.email} className="border-b last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Initial name={customer.email} />
                    <div>
                      <p className="font-medium">{customer.email.split("@")[0]}</p>
                      <p className="text-xs text-muted-foreground">{customer.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">{customer.orders}</td>
                  <td className="px-5 py-3 font-medium">{new Intl.NumberFormat("en-IN", { style: "currency", currency: customer.currency }).format(customer.spent)}</td>
                  <td className="px-5 py-3 text-muted-foreground">{customer.lastOrder ? new Date(customer.lastOrder).toLocaleDateString() : "—"}</td>
                <td className="px-5 py-3">
                  <Button variant="ghost" size="sm">
                    View <ChevronRight className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {!query.isLoading && customerRows.length === 0 ? <tr><td colSpan={5} className="px-5 py-16 text-center text-muted-foreground">No customers found in synced orders.</td></tr> : null}
          </tbody>
        </table>
      </PageTable>
      {query.data && query.data.pagination.totalPages > 1 ? <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Page {customerPage} of {query.data.pagination.totalPages} · {query.data.pagination.total} customers</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={customerPage === 1} onClick={() => setCustomerPage(customerPage - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={customerPage >= query.data.pagination.totalPages} onClick={() => setCustomerPage(customerPage + 1)}>Next</Button></div></div> : null}
    </div>
  );
}

export function DiscountsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Discounts"
        description="Create offers that encourage customers to buy."
        actions={
          <Button>
            <Plus className="h-4 w-4" /> Create discount
          </Button>
        }
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <Summary label="Active discounts" value="3" icon={Tag} />
        <Summary label="Discounted orders" value="253" hint="this month" icon={ShoppingBag} />
        <Summary label="Discount value" value="₹18,490" hint="this month" icon={BadgeIndianRupee} />
      </section>
      <Card className="shadow-card">
        <CardContent className="p-0">
          {discounts.map((discount) => (
            <div
              key={discount.code}
              className="flex flex-wrap items-center gap-4 border-b px-5 py-4 last:border-0"
            >
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <Tag className="h-4 w-4" />
              </span>
              <div className="min-w-44 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm font-semibold">{discount.code}</p>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{discount.type}</p>
              </div>
              <p className="w-32 text-sm text-muted-foreground">{discount.usage}</p>
              <p className="w-32 text-sm text-muted-foreground">{discount.end}</p>
              <Badge
                variant={discount.active ? "outline" : "secondary"}
                className={discount.active ? "border-teal/30 bg-teal/5 text-teal" : ""}
              >
                {discount.active ? "Active" : "Expired"}
              </Badge>
              <Button variant="ghost" size="sm">
                Edit <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Summary({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof Package;
}) {
  return (
    <Card className="shadow-card">
      <CardContent className="flex items-center gap-3 p-5">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-display text-xl font-semibold">{value}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
