import { useState } from "react";
import {
  ArrowUpRight,
  BadgeIndianRupee,
  Calendar,
  Check,
  Clock,
  Copy,
  DollarSign,
  ExternalLink,
  Facebook,
  Filter,
  Instagram,
  Layers,
  Link2,
  MessageCircle,
  Package,
  Percent,
  Plus,
  Search,
  Share2,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, CartesianGrid } from "recharts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlatformLinkGeneratorModal, type PlatformLinkItem } from "@/components/app/PlatformLinkGeneratorModal";
import { getInfluencerStoresOverview } from "../api/stores.api";
import { getInfluencerProducts } from "../api/products.api";
import { createInfluencerLink, getInfluencerLinks } from "../api/links.api";
import { getInfluencerOrders } from "../api/orders.api";
import { getInfluencerEarnings } from "../api/earnings.api";
import { queryKeys } from "@/lib/query-keys";

type Scope = string;
const fallbackScopeName: Record<string, string> = { all: "All stores" };
const fallbackScopeData: Record<
  string,
  { sales: string; orders: string; earnings: string; clicks: string; conversion: string }
> = {
  all: { sales: "₹0.00", orders: "0", earnings: "₹0.00", clicks: "0", conversion: "0.0%" },
};
const fallbackProducts: Array<{
  id?: string;
  name: string;
  store: string;
  storeSlug: string;
  price: string;
  clicks: number;
  orders: number;
  tone: string;
  imageUrl?: string | null;
  affiliateSlug?: string | null;
  affiliateUrl?: string | null;
}> = [];

function useScope() {
  return useState<Scope>("all");
}

function StoreSelector({
  scope,
  setScope,
  stores,
}: {
  scope: Scope;
  setScope: (value: Scope) => void;
  stores?: Array<{ id: string; name: string; slug: string }>;
}) {
  const storeList = stores?.length ? stores : [];
  return (
    <Select value={scope} onValueChange={(value) => setScope(value)}>
      <SelectTrigger className="w-full bg-card sm:w-52">
        <Store className="mr-2 h-4 w-4 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Combined analytics</SelectItem>
        {storeList.map((st) => (
          <SelectItem key={st.slug || st.id} value={st.slug || st.id}>
            {st.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Metrics({
  scope,
  scopeData,
  showEarnings = true,
}: {
  scope: Scope;
  scopeData: Record<string, { sales: string; orders: string; earnings: string; clicks: string; conversion: string }>;
  showEarnings?: boolean;
}) {
  const data = scopeData[scope] || scopeData["all"] || fallbackScopeData["all"];
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Attributed sales" value={data.sales} icon={TrendingUp} detail="Last 30 days" />
      <Metric label="Orders generated" value={data.orders} icon={ShoppingBag} detail="Tracked purchases" />
      {showEarnings ? <Metric label="Your earnings" value={data.earnings} icon={BadgeIndianRupee} detail="Approved + pending" /> : null}
      <Metric label="Link clicks" value={data.clicks} icon={Link2} detail={`${data.conversion} conversion rate`} />
    </section>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
  detail,
}: {
  label: string;
  value: string;
  icon: typeof Store;
  detail: string;
}) {
  return (
    <Card className="shadow-card">
      <CardContent className="flex items-center gap-4 p-5">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-0.5 font-display text-2xl font-semibold">{value}</p>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function filterForScope<T extends { store?: string; storeSlug?: string }>(
  rows: T[],
  scope: Scope,
  scopeNameMap: Record<string, string>
) {
  return scope === "all"
    ? rows
    : rows.filter((row) => row.storeSlug === scope || row.store === scopeNameMap[scope] || row.store === scope);
}

async function copyShareLink(url: string | null | undefined) {
  if (!url) {
    toast.error("No tracking link is available for this product yet.");
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Share link copied to clipboard!");
  } catch {
    toast.error("Could not copy the tracking link.");
  }
}

// --------------------------------------------------------------------------
// 1. My Store Page
// --------------------------------------------------------------------------
export function StorePage() {
  const [scope, setScope] = useScope();
  const [platformModalOpen, setPlatformModalOpen] = useState(false);
  const [selectedLinkItem, setSelectedLinkItem] = useState<PlatformLinkItem | null>(null);

  const storesQuery = useQuery({
    queryKey: queryKeys.stores.influencerOverview,
    queryFn: getInfluencerStoresOverview,
  });

  const data = storesQuery.data;
  const scopeDataMap = data?.scopeData ?? fallbackScopeData;
  const scopeNameMap = {
    ...fallbackScopeName,
    ...(data?.stores ? Object.fromEntries(data.stores.map((s) => [s.slug || s.id, s.name])) : {}),
  };
  const currentScopeTitle = scope === "all" ? "Combined store" : scopeNameMap[scope] || "Store";
  const storeMixList = data?.storeMix ?? [];
  const productList = data?.products ?? fallbackProducts;
  const filteredProducts = filterForScope(productList, scope, scopeNameMap);
  const timelineData = data?.scopeData?.[scope]?.timeline ?? data?.timeline ?? [];

  const openPlatformModal = (product: typeof fallbackProducts[0]) => {
    setSelectedLinkItem({
      id: product.id || product.name,
      baseUrl: product.affiliateUrl || `/r/${product.affiliateSlug || "promo"}`,
      productName: product.name,
      storeName: product.store,
      slug: product.affiliateSlug || "product",
    });
    setPlatformModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Store"
        description="Track the storefronts and products you share with your audience."
        actions={<StoreSelector scope={scope} setScope={setScope} stores={data?.stores} />}
      />
      <Metrics scope={scope} scopeData={scopeDataMap} showEarnings={!data?.isBarterOnly} />
      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="shadow-card xl:col-span-2">
          <CardHeader className="p-5 pb-3">
            <CardTitle>{scope === "all" ? "Combined store performance" : `${currentScopeTitle} performance`}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Sales driven by your links in the last 30 days (hover bars for details)
            </p>
          </CardHeader>
          <CardContent className="p-5 pt-2">
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" opacity={0.6} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--primary)", opacity: 0.1 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-xl border bg-card p-3 shadow-lg">
                            <p className="text-xs font-semibold text-foreground">
                              {d.label} {d.date ? `(${d.date})` : ""}
                            </p>
                            <div className="mt-2 space-y-1 text-xs">
                              <p className="font-semibold text-primary">Sales: {d.salesFormatted || `₹${d.sales}`}</p>
                              <p className="text-muted-foreground">
                                {d.orders} {d.orders === 1 ? "order" : "orders"}
                              </p>
                              <p className="text-muted-foreground">
                                {d.clicks} {d.clicks === 1 ? "click" : "clicks"}
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey={(d) => Math.max(Number(d.sales) || 0, d.clicks > 0 ? 0.2 : 0)}
                    fill="var(--primary)"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={42}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="p-5 pb-3">
            <CardTitle>Store mix</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Where your sales come from</p>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-2">
            {storeMixList.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-sm">
                  <span>{item.name}</span>
                  <span className="font-medium">{item.percentage}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${item.percentage}%` }} />
                </div>
              </div>
            ))}
            {!storeMixList.length ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No assigned stores yet.</p>
            ) : null}
          </CardContent>
        </Card>
      </section>
      <Card className="shadow-card">
        <CardHeader className="p-5 pb-3">
          <CardTitle>Top shared products</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Assigned products for your connected stores</p>
        </CardHeader>
        <CardContent className="space-y-3 p-5 pt-1">
          {filteredProducts.map((product) => (
            <div key={product.name} className="flex flex-wrap items-center gap-3 rounded-xl border p-3">
              <span className={`grid h-10 w-10 place-items-center rounded-lg ${product.tone}`}>
                <Package className="h-4 w-4" />
              </span>
              <div className="min-w-40 flex-1">
                <p className="font-medium">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {product.store} · {product.price}
                </p>
              </div>
              <p className="text-sm">
                <b>{product.clicks}</b> <span className="text-muted-foreground">clicks</span>
              </p>
              <p className="text-sm">
                <b>{product.orders}</b> <span className="text-muted-foreground">orders</span>
              </p>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs"
                  onClick={() => openPlatformModal(product)}
                >
                  <Share2 className="h-3.5 w-3.5 text-primary" /> Platform Links
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyShareLink(product.affiliateUrl)}
                  title="Copy link"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
          {!filteredProducts.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No assigned products found for this store.</p>
          ) : null}
        </CardContent>
      </Card>

      <PlatformLinkGeneratorModal
        open={platformModalOpen}
        onOpenChange={setPlatformModalOpen}
        linkItem={selectedLinkItem}
      />
    </div>
  );
}

// --------------------------------------------------------------------------
// 2. Products Page with Dedicated Platform UTM Sections
// --------------------------------------------------------------------------
export function ProductsPage({ campaignId, campaignTitle }: { campaignId?: string; campaignTitle?: string }) {
  const [scope, setScope] = useScope();
  const [platformModalOpen, setPlatformModalOpen] = useState(false);
  const [selectedLinkItem, setSelectedLinkItem] = useState<PlatformLinkItem | null>(null);
  const [selectedProductIndex, setSelectedProductIndex] = useState<number>(0);

  const storesQuery = useQuery({
    queryKey: queryKeys.stores.influencerOverview,
    queryFn: getInfluencerStoresOverview,
  });
  const productsQuery = useQuery({
    queryKey: queryKeys.products.influencer(scope, "", campaignId),
    queryFn: () => getInfluencerProducts(scope, undefined, campaignId),
  });

  const storesData = storesQuery.data;
  const scopeDataMap = storesData?.scopeData ?? fallbackScopeData;
  const scopeNameMap = {
    ...fallbackScopeName,
    ...(storesData?.stores ? Object.fromEntries(storesData.stores.map((s) => [s.slug || s.id, s.name])) : {}),
  };
  const currentScopeTitle = campaignId
    ? `Products for ${campaignTitle || "this campaign"}`
    : scope === "all"
      ? "Featured across your stores"
      : `${scopeNameMap[scope] || "Store"} products`;

  const productList = productsQuery.data?.products ?? [];
  const activeProduct = productList[selectedProductIndex] || productList[0] || null;

  const openPlatformModal = (product: typeof productList[0]) => {
    setSelectedLinkItem({
      id: product.id || product.name,
      baseUrl: product.affiliateUrl || `/r/${product.affiliateSlug || "promo"}`,
      productName: product.name,
      storeName: product.store,
      slug: product.affiliateSlug || "product",
    });
    setPlatformModalOpen(true);
  };

  // Helper for inline platform links
  const getProductBaseUrl = (p: typeof productList[0] | null) => {
    if (!p) return window.location.origin;
    if (p.affiliateUrl) {
      return p.affiliateUrl.startsWith("http")
        ? p.affiliateUrl
        : `${window.location.origin}${p.affiliateUrl.startsWith("/") ? "" : "/"}${p.affiliateUrl}`;
    }
    return `${window.location.origin}/r/${p.affiliateSlug || "product"}`;
  };

  const currentBaseUrl = getProductBaseUrl(activeProduct);
  const currentProductSlug = activeProduct?.name
    ? activeProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24)
    : "product-deal";

  // Dedicated UTM Links for active product
  const activeWhatsAppUrl = `${currentBaseUrl}?utm_source=whatsapp&utm_medium=social_chat&utm_campaign=${encodeURIComponent(currentProductSlug)}`;
  const activeFacebookUrl = `${currentBaseUrl}?utm_source=facebook&utm_medium=social_post&utm_campaign=${encodeURIComponent(currentProductSlug)}`;
  const activeInstagramUrl = `${currentBaseUrl}?utm_source=instagram&utm_medium=story_bio&utm_campaign=${encodeURIComponent(currentProductSlug)}`;

  const activeWhatsAppMsg = activeProduct
    ? `Hey! Check out *${activeProduct.name}* from *${activeProduct.store}* (${activeProduct.price})! 🛍️\n\n👉 Shop directly here: ${activeWhatsAppUrl}`
    : `Hey! Check out these exclusive deals! 👉 ${activeWhatsAppUrl}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products & Platform UTM Links"
        description={campaignId ? "The product selected for this campaign is ready for you to share." : "Generate dedicated WhatsApp & Facebook UTM tracking links for your assigned products."}
        actions={campaignId ? undefined : <StoreSelector scope={scope} setScope={setScope} stores={storesData?.stores} />}
      />
      <Metrics scope={scope} scopeData={scopeDataMap} showEarnings={!storesData?.isBarterOnly} />

      {/* DEDICATED PLATFORM-SPECIFIC SECTION (WHATSAPP & FACEBOOK UTM GENERATOR) */}
      {productList.length > 0 && (
        <Card className="shadow-card border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
          <CardHeader className="p-5 pb-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide">
                    Platform Link Hub
                  </Badge>
                  <CardTitle className="text-lg">Platform-Specific UTM Links</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground">
                  Select an assigned product below to generate distinct trackable links for WhatsApp broadcasts and Facebook posts.
                </p>
              </div>

              {/* Product Selector for the Platform Hub */}
              <div className="w-full sm:w-72">
                <Select
                  value={String(selectedProductIndex)}
                  onValueChange={(val) => setSelectedProductIndex(Number(val))}
                >
                  <SelectTrigger className="h-9 bg-background text-xs font-medium">
                    <SelectValue placeholder="Select assigned product" />
                  </SelectTrigger>
                  <SelectContent>
                    {productList.map((p, idx) => (
                      <SelectItem key={p.id || p.name} value={String(idx)} className="text-xs">
                        {p.name} ({p.price})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 pt-2 space-y-4">
            {activeProduct && (
              <div className="grid gap-4 md:grid-cols-2">
                {/* 1. WHATSAPP SPECIFIC SECTION */}
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                        <MessageCircle className="h-4 w-4" />
                        <span>WhatsApp Link (utm_source=whatsapp)</span>
                      </div>
                      <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-[10px]">
                        Chat & Broadcast
                      </Badge>
                    </div>

                    <div className="rounded-xl bg-background border p-2.5 space-y-1.5">
                      <p className="text-[11px] font-medium text-muted-foreground">WhatsApp Unique URL:</p>
                      <p className="font-mono text-xs text-foreground truncate select-all">
                        {activeWhatsAppUrl}
                      </p>
                    </div>

                    <div className="rounded-xl bg-background/70 border p-2.5 text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {activeWhatsAppMsg}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
                      onClick={() => {
                        navigator.clipboard?.writeText(activeWhatsAppUrl);
                        toast.success("WhatsApp link copied!");
                      }}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" /> Copy Link
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-1"
                      onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(activeWhatsAppMsg)}`, "_blank")}
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> Open WhatsApp
                    </Button>
                  </div>
                </div>

                {/* 2. FACEBOOK SPECIFIC SECTION */}
                <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
                        <Facebook className="h-4 w-4" />
                        <span>Facebook Link (utm_source=facebook)</span>
                      </div>
                      <Badge variant="outline" className="border-blue-500/40 text-blue-600 dark:text-blue-400 text-[10px]">
                        Feed & Groups
                      </Badge>
                    </div>

                    <div className="rounded-xl bg-background border p-2.5 space-y-1.5">
                      <p className="text-[11px] font-medium text-muted-foreground">Facebook Unique URL:</p>
                      <p className="font-mono text-xs text-foreground truncate select-all">
                        {activeFacebookUrl}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-background/70 border text-xs text-muted-foreground space-y-1">
                      <p className="font-semibold text-foreground">💡 Facebook Attribution Tip:</p>
                      <p className="text-[11px] leading-relaxed">
                        Share this link in Facebook Posts, Reels, Group discussions, or Facebook Ads to track Facebook-driven buyers.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/10"
                      onClick={() => {
                        navigator.clipboard?.writeText(activeFacebookUrl);
                        toast.success("Facebook link copied!");
                      }}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" /> Copy FB Link
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold gap-1"
                      onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(activeFacebookUrl)}`, "_blank")}
                    >
                      <Facebook className="h-3.5 w-3.5" /> Post on FB
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* PRODUCTS CARD GRID */}
      <Card className="shadow-card">
        <CardHeader className="p-5 pb-3">
          <CardTitle>{currentScopeTitle}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{campaignId ? "Campaign products and live attribution." : "Your assigned product recommendations and live attribution."}</p>
        </CardHeader>
        <CardContent className="p-5 pt-2">
          {productList.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {productList.map((product, idx) => (
                <div
                  key={product.id || product.name}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border bg-card p-4 transition-all hover:shadow-card hover:border-primary/40"
                >
                  <div>
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted/40">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className={`grid h-full w-full place-items-center ${product.tone || "bg-primary/10 text-primary"}`}>
                          <Package className="h-10 w-10 opacity-70" />
                        </div>
                      )}
                      <div className="absolute right-2.5 top-2.5">
                        <Badge variant="secondary" className="bg-background/90 backdrop-blur font-medium shadow-sm">
                          {product.orders} sold
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">{product.store}</p>
                      <h3
                        className="font-semibold text-base leading-snug line-clamp-2 text-foreground"
                        title={product.name}
                      >
                        {product.name}
                      </h3>
                      <p className="mt-2 font-display text-lg font-bold text-primary">{product.price}</p>
                    </div>
                  </div>

                  {/* 1-Tap Action Buttons per Product */}
                  <div className="mt-4 space-y-2">
                    <Button
                      className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs h-9 border border-primary/20"
                      variant="ghost"
                      onClick={() => openPlatformModal(product)}
                    >
                      <Share2 className="mr-1.5 h-3.5 w-3.5" /> Platform Links (WA / FB)
                    </Button>

                    <div className="grid grid-cols-2 gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/30"
                        onClick={() => {
                          const base = getProductBaseUrl(product);
                          const wa = `${base}?utm_source=whatsapp&utm_medium=social_chat`;
                          navigator.clipboard?.writeText(wa);
                          toast.success("WhatsApp link copied!");
                        }}
                      >
                        <MessageCircle className="h-3 w-3 mr-1" /> WhatsApp
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs text-blue-600 hover:bg-blue-500/10 border-blue-500/30"
                        onClick={() => {
                          const base = getProductBaseUrl(product);
                          const fb = `${base}?utm_source=facebook&utm_medium=social_post`;
                          navigator.clipboard?.writeText(fb);
                          toast.success("Facebook link copied!");
                        }}
                      >
                        <Facebook className="h-3 w-3 mr-1" /> Facebook
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="col-span-full rounded-2xl border border-dashed p-12 text-center">
              <Package className="mx-auto h-10 w-10 text-muted-foreground opacity-60" />
              <p className="mt-3 text-base font-semibold">No assigned products available</p>
              <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
                Your store admin has not assigned any specific products to your account yet. Once products are
                assigned, they will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <PlatformLinkGeneratorModal
        open={platformModalOpen}
        onOpenChange={setPlatformModalOpen}
        linkItem={selectedLinkItem}
      />
    </div>
  );
}

// --------------------------------------------------------------------------
// 3. Tracked Links Page
// --------------------------------------------------------------------------
export function LinksPage() {
  const [scope, setScope] = useScope();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [platformModalOpen, setPlatformModalOpen] = useState(false);
  const [selectedLinkItem, setSelectedLinkItem] = useState<PlatformLinkItem | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("storewide");
  const [linkType, setLinkType] = useState<"store" | "product" | "collection">("store");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [customSlug, setCustomSlug] = useState("");

  const queryClient = useQueryClient();

  const storesQuery = useQuery({
    queryKey: queryKeys.stores.influencerOverview,
    queryFn: getInfluencerStoresOverview,
  });

  const stores = storesQuery.data?.stores ?? [];
  const currentStoreId = scope === "all" ? undefined : stores.find((s) => s.slug === scope || s.id === scope)?.id;

  const linksQuery = useQuery({
    queryKey: queryKeys.links.influencer(currentStoreId, search),
    queryFn: () => getInfluencerLinks(currentStoreId, search),
  });

  const productsQuery = useQuery({
    queryKey: queryKeys.products.influencer(scope),
    queryFn: () => getInfluencerProducts(scope),
  });

  const createMutation = useMutation({
    mutationFn: createInfluencerLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      toast.success("Tracking link created successfully!");
      setIsCreateOpen(false);
      setCustomSlug("");
      setSelectedProductId("storewide");
      setSelectedProductIds([]);
      setLinkType("store");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create tracking link");
    },
  });

  const links = linksQuery.data?.links ?? [];
  const isBarterOnly = linksQuery.data?.isBarterOnly ?? storesQuery.data?.isBarterOnly ?? false;
  const scopeDataMap = storesQuery.data?.scopeData ?? fallbackScopeData;

  const handleCreateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreId) {
      toast.error("Please select a store");
      return;
    }
    if (linkType === "product" && selectedProductId === "storewide") {
      toast.error("Please select a product");
      return;
    }
    if (linkType === "collection" && selectedProductIds.length < 2) {
      toast.error("Choose at least two products for a collection link");
      return;
    }
    createMutation.mutate({
      organizationId: selectedStoreId,
      productId: linkType === "product" ? selectedProductId : null,
      productIds: linkType === "collection" ? selectedProductIds : undefined,
      customSlug: customSlug.trim() || null,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Links"
        description="Create and manage trackable links for your storefront and social content."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <StoreSelector scope={scope} setScope={setScope} stores={stores} />
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-1.5 h-4 w-4" /> Create link
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <form onSubmit={handleCreateLink}>
                  <DialogHeader>
                    <DialogTitle>Create Tracked Link</DialogTitle>
                    <DialogDescription>
                      Generate a custom short URL with automatic referral attribution and UTM tracking.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="store">Select Store *</Label>
                      <Select
                        value={selectedStoreId}
                        onValueChange={(val) => {
                          setSelectedStoreId(val);
                          setSelectedProductId("storewide");
                          setSelectedProductIds([]);
                        }}
                      >
                        <SelectTrigger id="store">
                          <SelectValue placeholder="Choose a brand store" />
                        </SelectTrigger>
                        <SelectContent>
                          {stores.map((st) => (
                            <SelectItem key={st.id} value={st.id}>
                              {st.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Link destination</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {([['store', 'Store'], ['product', 'One product'], ['collection', 'Collection']] as const).map(([value, label]) => (
                          <Button key={value} type="button" size="sm" variant={linkType === value ? "default" : "outline"} onClick={() => setLinkType(value)}>{label}</Button>
                        ))}
                      </div>
                    </div>

                    {linkType === "product" ? <div className="space-y-2">
                      <Label htmlFor="product">Product *</Label>
                      <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                        <SelectTrigger id="product">
                          <SelectValue placeholder="Storewide Homepage" />
                        </SelectTrigger>
                        <SelectContent>
                          {productsQuery.data?.products?.filter((p) => !selectedStoreId || stores.find((store) => store.id === selectedStoreId)?.slug === p.storeSlug).map((p) => (
                            <SelectItem key={p.id || p.name} value={p.id || p.name}>
                              {p.name} ({p.price})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div> : null}

                    {linkType === "collection" ? <div className="space-y-2">
                      <div className="flex items-center justify-between"><Label>Select at least two products *</Label><span className="text-xs text-muted-foreground">{selectedProductIds.length} selected</span></div>
                      <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-2">
                        {productsQuery.data?.products?.filter((p) => !selectedStoreId || stores.find((store) => store.id === selectedStoreId)?.slug === p.storeSlug).map((product) => {
                          const checked = selectedProductIds.includes(product.id);
                          return <label key={product.id} className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-muted"><input type="checkbox" checked={checked} onChange={() => setSelectedProductIds((ids) => checked ? ids.filter((id) => id !== product.id) : [...ids, product.id])} /><span className="min-w-0 flex-1 truncate text-sm">{product.name}</span><span className="text-xs text-muted-foreground">{product.price}</span></label>;
                        })}
                        {!productsQuery.data?.products?.length ? <p className="p-2 text-sm text-muted-foreground">Choose a store to view your assigned products.</p> : null}
                      </div>
                    </div> : null}

                    <div className="space-y-2">
                      <Label htmlFor="slug">Custom Alias / Slug (Optional)</Label>
                      <div className="flex items-center rounded-lg border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">
                        <span>Tracking link alias: /r/</span>
                        <input
                          id="slug"
                          type="text"
                          value={customSlug}
                          onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                          placeholder="festive-deal"
                          className="ml-1 w-full bg-transparent text-foreground outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Generating..." : "Generate Link"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <Metrics scope={scope} scopeData={scopeDataMap} showEarnings={!isBarterOnly} />

      <Card className="shadow-card">
        <CardHeader className="flex flex-col gap-4 p-5 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>My Tracked Links</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {scope === "all" ? "All brand links combined" : `Links for ${scope}`}
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search links or products..."
              className="h-9 pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-5 pt-1">
          {links.length > 0 ? (
            links.map((link) => (
              <div
                key={link.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-56 flex-1">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <Link2 className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate text-foreground">
                        {link.targetType === "COLLECTION"
                          ? `${link.productCount ?? link.products?.length ?? 0} product collection`
                          : link.productTitle || `${link.storeName} Store Link`}
                      </p>
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                        {link.targetType}
                      </Badge>
                    </div>
                    <p className="mt-0.5 font-mono text-xs text-primary truncate">
                      {link.url}
                    </p>
                    {link.targetType === "COLLECTION" ? <p className="mt-1 truncate text-xs text-muted-foreground">{link.products?.map((product) => product.title).join(" · ")}</p> : null}
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center sm:text-right">
                    <p className="font-bold font-display text-foreground">{link.clicks}</p>
                    <p className="text-[11px] text-muted-foreground">Clicks</p>
                  </div>
                  <div className="text-center sm:text-right">
                    <p className="font-bold font-display text-foreground">{link.orders}</p>
                    <p className="text-[11px] text-muted-foreground">Orders</p>
                  </div>
                  <div className="text-center sm:text-right">
                    <p className="font-bold font-display text-success">{link.conversion}</p>
                    <p className="text-[11px] text-muted-foreground">Conv.</p>
                  </div>
                  {!isBarterOnly ? (
                    <div className="text-center sm:text-right">
                      <p className="font-bold font-display text-primary">₹{link.earnings}</p>
                      <p className="text-[11px] text-muted-foreground">Earned</p>
                    </div>
                  ) : null}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-xs text-primary border-primary/30 hover:bg-primary/10"
                    onClick={() => {
                      setSelectedLinkItem({
                        id: link.id,
                        baseUrl: link.url,
                        productName: link.productTitle || (link.targetType === "COLLECTION" ? "Product Collection" : `${link.storeName} Store`),
                        storeName: link.storeName,
                        slug: (link as any).slug || "affiliate",
                      });
                      setPlatformModalOpen(true);
                    }}
                  >
                    <Share2 className="h-3.5 w-3.5" /> Platform UTMs
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard?.writeText(link.url);
                      toast.success("Tracking link copied to clipboard!");
                    }}
                  >
                    <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center">
              <Link2 className="mx-auto h-10 w-10 text-muted-foreground opacity-50" />
              <p className="mt-3 text-base font-semibold">No tracking links created yet</p>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
                Generate tracking links to share on your Instagram bio, stories, or YouTube descriptions.
              </p>
              <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" /> Create your first link
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <PlatformLinkGeneratorModal
        open={platformModalOpen}
        onOpenChange={setPlatformModalOpen}
        linkItem={selectedLinkItem}
      />
    </div>
  );
}

// --------------------------------------------------------------------------
// 4. Orders Page
// --------------------------------------------------------------------------
export function OrdersPage() {
  const [scope, setScope] = useScope();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const storesQuery = useQuery({
    queryKey: queryKeys.stores.influencerOverview,
    queryFn: getInfluencerStoresOverview,
  });

  const ordersQuery = useQuery({
    queryKey: queryKeys.orders.influencer(scope, statusFilter, search),
    queryFn: () => getInfluencerOrders(scope, statusFilter, search),
  });

  const ordersData = ordersQuery.data;
  const orderList = ordersData?.orders ?? [];
  const scopeDataMap = storesQuery.data?.scopeData ?? fallbackScopeData;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return <Badge variant="outline" className="border-success/30 bg-success/10 text-success font-semibold">Approved</Badge>;
      case "Paid":
        return <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-semibold">Paid</Badge>;
      case "Cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary" className="bg-muted text-muted-foreground">Pending Approval</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="See every purchase attributed to your shared links and social promotions."
        actions={<StoreSelector scope={scope} setScope={setScope} stores={storesQuery.data?.stores} />}
      />

      <Metrics scope={scope} scopeData={scopeDataMap} showEarnings={!ordersData?.metrics.isBarterOnly} />

      <Card className="shadow-card">
        <CardHeader className="flex flex-col gap-4 p-5 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {[
              ["all", "All Orders"],
              ["approved", "Approved"],
              ["pending", "Pending"],
              ["paid", "Paid"],
            ].map(([val, label]) => (
              <Button
                key={val}
                size="sm"
                variant={statusFilter === val ? "default" : "outline"}
                onClick={() => setStatusFilter(val)}
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order # or store..."
              className="h-9 pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-y bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Order details</th>
                <th className="px-5 py-3 font-medium">Store</th>
                <th className="px-5 py-3 font-medium">Product / Link</th>
                <th className="px-5 py-3 font-medium">Order Total</th>
                {!ordersData?.metrics.isBarterOnly ? <th className="px-5 py-3 font-medium">Your Commission</th> : null}
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {orderList.length > 0 ? (
                orderList.map((order) => (
                  <tr key={order.id} className="border-b transition-colors hover:bg-muted/20 last:border-0">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-foreground">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{order.customer}</p>
                    </td>
                    <td className="px-5 py-4 font-medium text-foreground">{order.store}</td>
                    <td className="px-5 py-4 text-muted-foreground truncate max-w-44" title={order.productTitle}>
                      {order.productTitle}
                    </td>
                    <td className="px-5 py-4 font-medium">{order.orderTotal}</td>
                    {!ordersData?.metrics.isBarterOnly ? (
                      <td className="px-5 py-4">
                        {order.isBarter ? <p className="text-xs font-semibold text-amber-600">Barter order</p> : <><p className="font-display font-bold text-primary">{order.commission}</p><p className="text-[11px] text-muted-foreground">{order.commissionRate} rate</p></>}
                      </td>
                    ) : null}
                    <td className="px-5 py-4">{getStatusBadge(order.status)}</td>
                    <td className="px-5 py-4 text-right text-xs text-muted-foreground">{order.date}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={ordersData?.metrics.isBarterOnly ? 6 : 7} className="py-14 text-center text-muted-foreground">
                    <ShoppingBag className="mx-auto h-9 w-9 opacity-40" />
                    <p className="mt-2 font-medium">No attributed orders found</p>
                    <p className="text-xs">Purchases from your shared referral links will appear here in real-time.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// --------------------------------------------------------------------------
// 5. Earnings Page
// --------------------------------------------------------------------------
export function EarningsPage() {
  const [scope, setScope] = useScope();

  const storesQuery = useQuery({
    queryKey: queryKeys.stores.influencerOverview,
    queryFn: getInfluencerStoresOverview,
  });

  const earningsQuery = useQuery({
    queryKey: queryKeys.earnings.influencer(scope),
    queryFn: () => getInfluencerEarnings(scope),
  });

  const earningsData = earningsQuery.data;
  const balances = earningsData?.balances ?? {
    availableToWithdraw: "₹0.00",
    availableToWithdrawRaw: 0,
    pendingApproval: "₹0.00",
    pendingApprovalRaw: 0,
    pendingOrdersCount: 0,
    lifetimeEarnings: "₹0.00",
    lifetimeEarningsRaw: 0,
    paidEarnings: "₹0.00",
    currentPeriodEarnings: "₹0.00",
    growthRate: "+0.0%",
    isGrowthPositive: true,
  };

  const timeline = earningsData?.timeline ?? [];
  const recentCommissions = earningsData?.recentCommissions ?? [];
  const barterFulfillments = earningsData?.barterFulfillments ?? [];

  if (earningsData?.isBarterOnly) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Barter Orders"
          description="Your store partnerships are currently managed as barter. Orders are tracked, with no cash commission or payout."
          actions={<StoreSelector scope={scope} setScope={setScope} stores={storesQuery.data?.stores} />}
        />
        <section className="grid gap-4 sm:grid-cols-1">
          <Metric label="Barter orders generated" value={String(earningsData.barterOrders)} icon={ShoppingBag} detail="Tracked purchases" />
        </section>
        <Card className="shadow-card">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Orders from your shared links are counted here, but barter partnerships do not create commission earnings or payouts.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Earnings & Payouts"
        description="Track earnings across all 4 compensation models: Affiliate Commission, Fixed Pricing, Hybrid Base Fees, and Barter Samples."
        actions={<StoreSelector scope={scope} setScope={setScope} stores={storesQuery.data?.stores} />}
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Metric
          label="Available to withdraw"
          value={balances.availableToWithdraw}
          icon={BadgeIndianRupee}
          detail="Approved and ready for payout"
        />
        <Metric
          label="Pending approval"
          value={balances.pendingApproval}
          icon={TrendingUp}
          detail={`From ${balances.pendingOrdersCount} pending deal${balances.pendingOrdersCount === 1 ? "" : "s"} / order${balances.pendingOrdersCount === 1 ? "" : "s"}`}
        />
        <Metric
          label="Lifetime earnings"
          value={balances.lifetimeEarnings}
          icon={Users}
          detail="Total earnings across all models"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardHeader className="p-5 pb-3">
            <CardTitle>{scope === "all" ? "Combined monthly earnings" : `${scope} monthly earnings`}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Monthly revenue growth across sales commissions and fixed deal fees</p>
          </CardHeader>
          <CardContent className="p-5 pt-2">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeline} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" opacity={0.6} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--primary)", opacity: 0.1 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-xl border bg-card p-3 shadow-lg">
                            <p className="text-xs font-semibold text-foreground">{d.month} Earnings</p>
                            <p className="mt-1 font-display font-bold text-primary">{d.earningsFormatted}</p>
                            <p className="text-xs text-muted-foreground">{d.orders} deals / orders attributed</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="earnings"
                    fill="var(--primary)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card flex flex-col justify-between">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Current month earnings</p>
            <p className="mt-2 font-display text-3xl font-bold text-foreground">{balances.currentPeriodEarnings}</p>
            <p className={`mt-2 flex items-center gap-1 text-sm font-semibold ${balances.isGrowthPositive ? "text-success" : "text-destructive"}`}>
              <ArrowUpRight className="h-4 w-4" /> {balances.growthRate} vs. last month
            </p>
            <div className="mt-6 rounded-xl bg-muted/40 p-4 text-xs text-muted-foreground space-y-1.5">
              <div className="flex justify-between">
                <span>Paid payouts:</span>
                <span className="font-semibold text-foreground">{balances.paidEarnings}</span>
              </div>
              <div className="flex justify-between">
                <span>Next settlement:</span>
                <span className="font-semibold text-foreground">Weekly / Monthly</span>
              </div>
            </div>
          </CardContent>
          <div className="p-6 pt-0">
            <Button
              className="w-full"
              disabled={balances.availableToWithdrawRaw <= 0}
              onClick={() => {
                toast.success(`Withdrawal request of ${balances.availableToWithdraw} submitted to brand partner!`);
              }}
            >
              Withdraw earnings
            </Button>
          </div>
        </Card>
      </section>

      {/* Barter Product Sample Fulfillment Tracking Section */}
      {barterFulfillments.length > 0 && (
        <Card className="shadow-card">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" /> Barter Sample Shipments
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Track sample dispatches and delivery confirmations for product exchange campaigns</p>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 p-5 pt-1">
            {barterFulfillments.map((item) => (
              <div key={item.id} className="rounded-xl border p-4 space-y-3 bg-card">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">{item.storeName}</span>
                    <p className="font-semibold text-sm text-foreground mt-0.5">{item.campaignTitle}</p>
                  </div>
                  <Badge variant={item.status === "DELIVERED" || item.status === "COMPLETED" ? "outline" : "secondary"} className="flex items-center gap-1">
                    <Truck className="h-3 w-3" /> {item.status}
                  </Badge>
                </div>
                <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-1">
                  <p className="font-medium text-foreground">Product: {item.productTitle}</p>
                  {item.trackingNumber && (
                    <p className="text-muted-foreground font-mono">
                      {item.carrier ?? "Courier"}: <span className="font-bold text-foreground">{item.trackingNumber}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Unified Transactions Feed */}
      <Card className="shadow-card">
        <CardHeader className="p-5 pb-3">
          <CardTitle>Recent deal & commission activity</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Attributed sales commissions, fixed campaign fees, and hybrid base payouts</p>
        </CardHeader>
        <CardContent className="space-y-3 p-5 pt-1">
          {recentCommissions.length > 0 ? (
            recentCommissions.map((comm) => (
              <div key={comm.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    {comm.type === "FIXED_FEE" ? (
                      <DollarSign className="h-4 w-4" />
                    ) : comm.type === "HYBRID_BASE" ? (
                      <Layers className="h-4 w-4" />
                    ) : (
                      <Percent className="h-4 w-4" />
                    )}
                  </span>
                  <div>
                    <p className="font-semibold text-sm">{comm.orderName}</p>
                    <p className="text-xs text-muted-foreground">{comm.storeName} · {comm.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {comm.type === "FIXED_FEE" && (
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-200 text-[10px]">
                      Fixed Fee
                    </Badge>
                  )}
                  {comm.type === "HYBRID_BASE" && (
                    <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-200 text-[10px]">
                      Hybrid Base
                    </Badge>
                  )}
                  {(!comm.type || comm.type === "COMMISSION") && (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200 text-[10px]">
                      Commission
                    </Badge>
                  )}
                  <Badge variant={comm.status === "APPROVED" ? "outline" : "secondary"} className={comm.status === "APPROVED" ? "border-success/30 bg-success/10 text-success" : ""}>
                    {comm.status}
                  </Badge>
                  <p className="font-display font-bold text-primary">{comm.amount}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No recent earnings records found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
