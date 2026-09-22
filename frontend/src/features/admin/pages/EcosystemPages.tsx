import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Boxes,
  Building2,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Instagram,
  Megaphone,
  Plus,
  RefreshCw,
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
import {
  getAdminCampaigns,
  getAdminProducts,
  getAdminSocial,
} from "../api/overview.api";
import { getStores } from "../api/stores.api";
import { InfluencersPage } from "./InfluencersPage";
import { StoresPage } from "./StoresPage";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// -------------------------------------------------------------
// 1. BRANDS PAGE
// -------------------------------------------------------------
export function BrandsPage() {
  const [search, setSearch] = useState("");
  const query = useQuery({ queryKey: ["admin", "stores"], queryFn: getStores });
  const stores = query.data?.stores ?? [];

  const filtered = stores.filter((s: any) =>
    `${s.name} ${s.category || ""} ${s.shopDomain || ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partner Merchant Brands"
        description="Oversee verified retail brand accounts, store platforms, and campaign partnerships."
        actions={
          <Button asChild size="sm">
            <Link to="/admin/stores">
              <Store className="h-4 w-4 mr-1" /> Manage Stores Directory
            </Link>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">Connected Brands</p>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">{stores.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Active store organizations</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">Shopify Verified</p>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal/10 text-teal">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">
              {stores.filter((s: any) => s.connectionStatus === "CONNECTED").length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Operating with active sync</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">Creator Partnerships</p>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-coral/10 text-coral">
                <Sparkles className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">
              {stores.reduce((sum: number, s: any) => sum + (s._count?.assignments ?? 0), 0)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Active influencer assignments</p>
          </CardContent>
        </Card>
      </section>

      <Card className="shadow-card overflow-hidden">
        <div className="p-5">
          <div className="relative min-w-64 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9 h-9"
              placeholder="Search brand by name, category, or domain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="border-y bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Brand Store</th>
                <th className="px-5 py-3 font-medium">Domain / Platform</th>
                <th className="px-5 py-3 font-medium">Store Owner</th>
                <th className="px-5 py-3 text-center font-medium">Creator Partners</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {query.isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td colSpan={6} className="px-5 py-4">
                      <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    No brand stores found.
                  </td>
                </tr>
              ) : (
                filtered.map((store: any) => (
                  <tr key={store.id} className="border-b last:border-0 hover:bg-muted/15 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-foreground">{store.name}</p>
                      <p className="text-xs text-muted-foreground">{store.category || "General Retail"}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground font-mono">
                      {store.shopDomain || "Not configured"}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-foreground text-xs">{store.owner?.displayName}</p>
                      <p className="text-xs text-muted-foreground">{store.owner?.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-center font-semibold text-primary">
                      {store._count?.assignments ?? 0}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={store.connectionStatus === "CONNECTED" ? "outline" : "secondary"}
                        className={
                          store.connectionStatus === "CONNECTED"
                            ? "border-teal/30 bg-teal/5 text-teal text-xs font-medium"
                            : "text-xs"
                        }
                      >
                        {store.connectionStatus}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button asChild variant="ghost" size="sm" className="text-primary">
                        <Link to="/admin/stores">
                          Manage <ExternalLink className="h-3.5 w-3.5 ml-1" />
                        </Link>
                      </Button>
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
// 2. PRODUCTS PAGE
// -------------------------------------------------------------
export function ProductsPage() {
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: ["admin", "products", search],
    queryFn: () => getAdminProducts({ search }),
  });

  const products = query.data?.products ?? [];
  const totalProducts = query.data?.totalProducts ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cross-Store Products Catalog"
        description="Unified inventory and product catalog synced across all connected Shopify stores."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">Catalog Products</p>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <Boxes className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">{totalProducts.toLocaleString()}</p>
            <p className="mt-1 text-xs text-muted-foreground">Synced from brand inventories</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">Active Influencer Assignments</p>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal/10 text-teal">
                <Sparkles className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">
              {products.reduce((sum, p) => sum + p.assignedCreatorsCount, 0)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Products assigned to creators</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">Tracking Links Created</p>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-coral/10 text-coral">
                <UsersRound className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">
              {products.reduce((sum, p) => sum + p.activeLinksCount, 0)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Active affiliate referral links</p>
          </CardContent>
        </Card>
      </section>

      <Card className="shadow-card overflow-hidden">
        <div className="p-5">
          <div className="relative min-w-64 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9 h-9"
              placeholder="Search product by title, vendor, or store name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-y bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Brand Store</th>
                <th className="px-5 py-3 font-medium">Vendor</th>
                <th className="px-5 py-3 text-center font-medium">Stock Total</th>
                <th className="px-5 py-3 text-center font-medium">Assigned Creators</th>
                <th className="px-5 py-3 text-right font-medium">Price</th>
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
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-b last:border-0 hover:bg-muted/15 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt=""
                            className="h-9 w-9 rounded-lg object-cover border"
                          />
                        ) : (
                          <span className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-muted-foreground">
                            <Boxes className="h-4 w-4" />
                          </span>
                        )}
                        <p className="font-semibold text-foreground">{product.title}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-foreground">{product.storeName}</td>
                    <td className="px-5 py-3.5 text-muted-foreground text-xs">{product.vendor || "—"}</td>
                    <td className="px-5 py-3.5 text-center">
                      <Badge
                        variant={product.inventoryTotal > 0 ? "outline" : "secondary"}
                        className={
                          product.inventoryTotal > 10
                            ? "border-teal/30 bg-teal/5 text-teal text-xs"
                            : product.inventoryTotal > 0
                            ? "border-amber-500/30 bg-amber-500/5 text-amber-600 text-xs"
                            : "bg-destructive/10 text-destructive text-xs"
                        }
                      >
                        {product.inventoryTotal} in stock
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-center font-semibold text-primary">
                      {product.assignedCreatorsCount}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-foreground">
                      {formatCurrency(product.price)}
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
// 3. CAMPAIGNS PAGE
// -------------------------------------------------------------
export function CampaignsPage() {
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: ["admin", "campaigns", search],
    queryFn: () => getAdminCampaigns({ search }),
  });

  const campaigns = query.data?.campaigns ?? [];
  const liveCount = query.data?.liveCount ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Creator Campaigns"
        description="Monitor brand campaigns, creator brief deliverables, budget allocation, and creator applications."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">Total Campaigns</p>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <Megaphone className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">{campaigns.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Across all merchant brands</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">Live & Active</p>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal/10 text-teal">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">{liveCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Discoverable by creators</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">Creator Applications</p>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-coral/10 text-coral">
                <UsersRound className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">
              {campaigns.reduce((sum, c) => sum + c.applicationsCount, 0)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Submitted applications</p>
          </CardContent>
        </Card>
      </section>

      <Card className="shadow-card overflow-hidden">
        <div className="p-5">
          <div className="relative min-w-64 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9 h-9"
              placeholder="Search campaigns by title, category, or brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="border-y bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Campaign</th>
                <th className="px-5 py-3 font-medium">Brand</th>
                <th className="px-5 py-3 font-medium">Category & Type</th>
                <th className="px-5 py-3 text-center font-medium">Applications</th>
                <th className="px-5 py-3 text-center font-medium">Assigned</th>
                <th className="px-5 py-3 font-medium">Status</th>
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
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    No campaigns found.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/15 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img src={c.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover border" />
                        <div>
                          <p className="font-semibold text-foreground">{c.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{c.deliverables}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-foreground">{c.storeName}</td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {c.category} · {c.campaignType}
                    </td>
                    <td className="px-5 py-3.5 text-center font-semibold text-primary">
                      {c.applicationsCount}
                    </td>
                    <td className="px-5 py-3.5 text-center font-semibold text-foreground">
                      {c.assignedCreatorsCount}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={c.status === "PUBLISHED" ? "outline" : "secondary"}
                        className={
                          c.status === "PUBLISHED"
                            ? "border-teal/30 bg-teal/5 text-teal text-xs font-medium"
                            : "text-xs"
                        }
                      >
                        {c.status}
                      </Badge>
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
// 4. SOCIAL ACCOUNTS PAGE
// -------------------------------------------------------------
export function SocialPage() {
  const query = useQuery({ queryKey: ["admin", "social"], queryFn: () => getAdminSocial() });
  const accounts = query.data?.accounts ?? [];
  const metrics = query.data?.metrics ?? { totalAccounts: 0, healthyCount: 0, attentionNeededCount: 0 };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Connected Instagram Accounts"
        description="Monitor Instagram Graph API OAuth tokens, automation webhook bindings, and connection health."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">Connected Profiles</p>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-pink-500/10 text-pink-600">
                <Instagram className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">{metrics.totalAccounts}</p>
            <p className="mt-1 text-xs text-muted-foreground">Active Meta OAuth authorizations</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">Healthy & Synced</p>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal/10 text-teal">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">{metrics.healthyCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Live webhook delivery active</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">Attention Needed</p>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-500/10 text-amber-600">
                <RefreshCw className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">{metrics.attentionNeededCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Expired or disconnected tokens</p>
          </CardContent>
        </Card>
      </section>

      <Card className="shadow-card overflow-hidden">
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="border-y bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Influencer Account</th>
                <th className="px-5 py-3 font-medium">Instagram Handle</th>
                <th className="px-5 py-3 font-medium">Creator Code</th>
                <th className="px-5 py-3 font-medium">Connection Status</th>
                <th className="px-5 py-3 text-right font-medium">Last Synced</th>
              </tr>
            </thead>
            <tbody>
              {query.isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td colSpan={5} className="px-5 py-4">
                      <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                    </td>
                  </tr>
                ))
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                    No Instagram accounts connected yet.
                  </td>
                </tr>
              ) : (
                accounts.map((acc) => (
                  <tr key={acc.id} className="border-b last:border-0 hover:bg-muted/15 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-foreground">{acc.influencerName}</p>
                      <p className="text-xs text-muted-foreground">{acc.influencerEmail || "No email"}</p>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-pink-600 dark:text-pink-400">
                      <span className="flex items-center gap-1">
                        <Instagram className="h-3.5 w-3.5" />
                        @{acc.username}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-primary">
                      {acc.creatorCode ? `@${acc.creatorCode}` : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={acc.status === "ACTIVE" ? "outline" : "secondary"}
                        className={
                          acc.status === "ACTIVE"
                            ? "border-teal/30 bg-teal/5 text-teal text-xs font-medium"
                            : "text-xs"
                        }
                      >
                        {acc.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(acc.syncedAt))}
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

export { InfluencersPage, StoresPage };
