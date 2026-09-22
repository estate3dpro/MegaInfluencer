import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Package,
  ExternalLink,
  Sparkles,
  UserCheck,
  UserPlus,
  Trash2,
  Copy,
  Check,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  MousePointer,
  Clock,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Tag,
  Building2,
  Share2,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { toast } from "sonner";
import { Route } from "@/routes/store-admin/products/$productId";
import {
  getStoreProductDetails,
  assignCreatorToProduct,
  unassignCreatorFromProduct,
  createProductAffiliateLink,
} from "../api/products.api";

function formatMoney(amount: number | string | null | undefined, currency = "INR") {
  const num = Number(amount ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 2,
  }).format(num);
}

export function ProductDetailsPage() {
  const { productId } = Route.useParams();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"influencers" | "links" | "orders" | "variants" | "media">("influencers");
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // Dialog States
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>("");
  const [assignCommissionRate, setAssignCommissionRate] = useState("10");

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkCreatorId, setLinkCreatorId] = useState<string>("NONE");
  const [linkCommissionRate, setLinkCommissionRate] = useState("10");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["store", "product", productId],
    queryFn: () => getStoreProductDetails(productId),
  });

  // Assign mutation
  const assignMutation = useMutation({
    mutationFn: (vars: { creatorId: string; commissionRate: number }) =>
      assignCreatorToProduct(productId, {
        creatorId: vars.creatorId,
        commissionRate: vars.commissionRate,
        generateLink: true,
      }),
    onSuccess: () => {
      toast.success("Influencer assigned and product link generated!");
      setIsAssignModalOpen(false);
      setSelectedCreatorId("");
      void refetch();
      void queryClient.invalidateQueries({ queryKey: ["store", "products"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to assign influencer.");
    },
  });

  // Unassign mutation
  const unassignMutation = useMutation({
    mutationFn: (creatorId: string) => unassignCreatorFromProduct(productId, creatorId),
    onSuccess: () => {
      toast.success("Influencer assignment removed.");
      void refetch();
      void queryClient.invalidateQueries({ queryKey: ["store", "products"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to remove assignment.");
    },
  });

  // Create Link mutation
  const createLinkMutation = useMutation({
    mutationFn: (vars: { creatorId: string | null; commissionRate: number }) =>
      createProductAffiliateLink(productId, {
        creatorId: vars.creatorId,
        commissionRate: vars.commissionRate,
      }),
    onSuccess: () => {
      toast.success("Affiliate link created!");
      setIsLinkModalOpen(false);
      setLinkCreatorId("NONE");
      void refetch();
      void queryClient.invalidateQueries({ queryKey: ["store", "products"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create affiliate link.");
    },
  });

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLinkId(id);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="h-16 w-full animate-pulse rounded-xl bg-muted" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="h-96 w-full animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (isError || !data?.product) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-3" />
          <h2 className="text-lg font-semibold text-destructive">Product Not Found</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            The requested product could not be loaded or is not synced with your store.
          </p>
          <Button asChild variant="outline">
            <Link to="/store-admin/products">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { product, metrics, assignedCreators, availableCreators, affiliateLinks, recentOrders } = data;
  const rawPayload = product.payload ?? {};
  const variants = rawPayload.variants?.nodes ?? rawPayload.variants ?? [];
  const images = rawPayload.images?.nodes ?? rawPayload.images ?? [];

  // Extract numeric Shopify Product ID for admin URL
  const shopifyNumericId = product.shopifyId?.split("/").pop() || "";
  const shopDomain = product.shopDomain?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const shopifyAdminUrl =
    shopDomain && shopifyNumericId ? `https://${shopDomain}/admin/products/${shopifyNumericId}` : null;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Nav & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/store-admin/products"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Catalogue
        </Link>
        {shopifyAdminUrl ? (
          <a
            href={shopifyAdminUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <span>View in Shopify Admin</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </div>

      {/* Main Header */}
      <PageHeader
        title={product.title}
        description={
          product.handle
            ? `SKU / Handle: ${product.handle}${product.vendor ? ` · Vendor: ${product.vendor}` : ""}`
            : "Product Details & Creator Performance"
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {shopifyAdminUrl ? (
              <Button variant="outline" size="sm" asChild>
                <a href={shopifyAdminUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" /> Edit in Shopify
                </a>
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLinkModalOpen(true)}
            >
              <Share2 className="h-4 w-4" /> Create Link
            </Button>
            <Button
              size="sm"
              onClick={() => setIsAssignModalOpen(true)}
              className="bg-primary text-primary-foreground"
            >
              <UserPlus className="h-4 w-4" /> Assign Influencer
            </Button>
          </div>
        }
      />

      {/* 4 Metric KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Revenue</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                {formatMoney(metrics.totalRevenue, product.currency ?? "INR")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                <ShoppingCart className="h-3 w-3 text-primary" />
                <span>{metrics.totalOrders} total orders ({metrics.unitsSold} units)</span>
              </p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <DollarSign className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Creator Revenue</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-600">
                {formatMoney(metrics.creatorRevenue, product.currency ?? "INR")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-emerald-600" />
                <span>{metrics.creatorOrders} affiliate orders</span>
              </p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Creator Commission</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-indigo-600">
                {formatMoney(metrics.creatorCommissions, product.currency ?? "INR")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                <UserCheck className="h-3 w-3 text-indigo-600" />
                <span>{assignedCreators.length} assigned creators</span>
              </p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600">
              <UserCheck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Affiliate Clicks & Conv.</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                {metrics.totalClicks.toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                <MousePointer className="h-3 w-3 text-amber-500" />
                <span>{metrics.conversionRate}% click-to-buy rate</span>
              </p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
              <MousePointer className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Main 2-Column Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Tabs with Influencers, Links, Orders, Variants */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <Tabs
                value={activeTab}
                onValueChange={(val) => setActiveTab(val as any)}
                className="w-full"
              >
                <div className="flex items-center justify-between">
                  <TabsList className="grid grid-cols-5 w-full max-w-xl">
                    <TabsTrigger value="influencers" className="text-xs">
                      Influencers ({assignedCreators.length})
                    </TabsTrigger>
                    <TabsTrigger value="links" className="text-xs">
                      Links ({affiliateLinks.length})
                    </TabsTrigger>
                    <TabsTrigger value="orders" className="text-xs">
                      Orders ({recentOrders.length})
                    </TabsTrigger>
                    <TabsTrigger value="variants" className="text-xs">
                      Variants ({variants.length || 1})
                    </TabsTrigger>
                    <TabsTrigger value="media" className="text-xs">
                      Media ({images.length || 1})
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* TAB 1: ASSIGNED INFLUENCERS */}
                <TabsContent value="influencers" className="pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Assigned Influencers</h3>
                      <p className="text-xs text-muted-foreground">
                        Creators authorized to promote this product with personalized affiliate tracking.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsAssignModalOpen(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-1.5" /> Assign More
                    </Button>
                  </div>

                  {assignedCreators.length === 0 ? (
                    <div className="rounded-xl border border-dashed py-12 text-center">
                      <UserCheck className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                      <p className="text-sm font-medium text-foreground">No influencers assigned yet</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto mb-4">
                        Assign creators from your roster to give them dedicated tracked links and commission rates.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setIsAssignModalOpen(true)}
                      >
                        <UserPlus className="h-4 w-4 mr-1.5" /> Assign First Creator
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                          <tr>
                            <th className="px-4 py-3 font-medium">Influencer</th>
                            <th className="px-4 py-3 font-medium">Active Links</th>
                            <th className="px-4 py-3 font-medium">Product GMV</th>
                            <th className="px-4 py-3 font-medium">Commission</th>
                            <th className="px-4 py-3 text-right font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assignedCreators.map((creator) => (
                            <tr key={creator.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                                    {creator.name.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-foreground">{creator.name}</p>
                                    <p className="text-xs text-muted-foreground">{creator.handle}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3.5">
                                <Badge variant="outline" className="font-mono text-xs">
                                  {creator.activeLinksCount} {creator.activeLinksCount === 1 ? "link" : "links"}
                                </Badge>
                              </td>
                              <td className="px-4 py-3.5 font-medium text-foreground">
                                {formatMoney(creator.sales, product.currency ?? "INR")}
                                <span className="text-xs text-muted-foreground block">
                                  {creator.orders} {creator.orders === 1 ? "order" : "orders"}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 font-medium text-indigo-600">
                                {formatMoney(creator.commission, product.currency ?? "INR")}
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => unassignMutation.mutate(creator.id)}
                                  disabled={unassignMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>

                {/* TAB 2: AFFILIATE LINKS */}
                <TabsContent value="links" className="pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Active Affiliate Links</h3>
                      <p className="text-xs text-muted-foreground">
                        Direct tracking links redirecting customers straight to this product handle.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsLinkModalOpen(true)}
                    >
                      <Share2 className="h-4 w-4 mr-1.5" /> Generate Link
                    </Button>
                  </div>

                  {affiliateLinks.length === 0 ? (
                    <div className="rounded-xl border border-dashed py-12 text-center">
                      <Share2 className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                      <p className="text-sm font-medium text-foreground">No tracking links created yet</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto mb-4">
                        Generate links for creators or marketing campaigns to track sales for this specific item.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setIsLinkModalOpen(true)}
                      >
                        <Share2 className="h-4 w-4 mr-1.5" /> Create First Link
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                          <tr>
                            <th className="px-4 py-3 font-medium">Link & Slug</th>
                            <th className="px-4 py-3 font-medium">Attributed Creator</th>
                            <th className="px-4 py-3 font-medium">Commission</th>
                            <th className="px-4 py-3 font-medium">Performance</th>
                            <th className="px-4 py-3 text-right font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {affiliateLinks.map((link) => (
                            <tr key={link.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-semibold text-foreground">/r/{link.slug}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                    onClick={() => handleCopyLink(link.url, link.id)}
                                  >
                                    {copiedLinkId === link.id ? (
                                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                </div>
                              </td>
                              <td className="px-4 py-3.5">
                                {link.creator ? (
                                  <div>
                                    <p className="font-semibold text-foreground">{link.creator.name}</p>
                                    <p className="text-xs text-muted-foreground">{link.creator.handle}</p>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">General / Store Link</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5">
                                <Badge variant="secondary" className="font-mono text-xs">
                                  {link.commissionRate}%
                                </Badge>
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="text-xs">
                                  <span className="font-semibold text-foreground">
                                    {formatMoney(link.revenue, product.currency ?? "INR")}
                                  </span>
                                  <span className="text-muted-foreground block">
                                    {link.clicks} clicks · {link.orders} orders
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCopyLink(link.url, link.id)}
                                >
                                  {copiedLinkId === link.id ? "Copied" : "Copy Link"}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>

                {/* TAB 3: RECENT ORDERS */}
                <TabsContent value="orders" className="pt-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-foreground">Recent Customer Orders</h3>
                    <p className="text-xs text-muted-foreground">
                      Customer orders containing this product synced from Shopify.
                    </p>
                  </div>

                  {recentOrders.length === 0 ? (
                    <div className="rounded-xl border border-dashed py-12 text-center">
                      <ShoppingCart className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                      <p className="text-sm font-medium text-foreground">No orders recorded yet</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                        Orders containing this product will appear here automatically once customers purchase.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                          <tr>
                            <th className="px-4 py-3 font-medium">Order</th>
                            <th className="px-4 py-3 font-medium">Date</th>
                            <th className="px-4 py-3 font-medium">Financial Status</th>
                            <th className="px-4 py-3 font-medium">Qty</th>
                            <th className="px-4 py-3 font-medium">Total</th>
                            <th className="px-4 py-3 font-medium">Creator Tag</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentOrders.map((order) => (
                            <tr key={order.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                              <td className="px-4 py-3.5">
                                <span className="font-semibold text-foreground">{order.name}</span>
                                <span className="text-xs text-muted-foreground block">{order.email ?? "—"}</span>
                              </td>
                              <td className="px-4 py-3.5 text-xs text-muted-foreground">
                                {order.processedAt
                                  ? new Date(order.processedAt).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "—"}
                              </td>
                              <td className="px-4 py-3.5">
                                <Badge
                                  variant="outline"
                                  className={
                                    order.financialStatus === "PAID" || order.financialStatus === "paid"
                                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                                      : order.financialStatus === "REFUNDED" || order.financialStatus === "refunded"
                                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                                      : "border-amber-500/30 bg-amber-500/10 text-amber-700"
                                  }
                                >
                                  {order.financialStatus ?? "PAID"}
                                </Badge>
                              </td>
                              <td className="px-4 py-3.5 font-medium">{order.quantity}</td>
                              <td className="px-4 py-3.5 font-semibold text-foreground">
                                {formatMoney(order.total, order.currency ?? product.currency ?? "INR")}
                              </td>
                              <td className="px-4 py-3.5">
                                {order.creatorCode ? (
                                  <Badge className="bg-primary/10 text-primary border-primary/20">
                                    @{order.creatorCode}
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Direct Store</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>

                {/* TAB 4: VARIANTS */}
                <TabsContent value="variants" className="pt-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-foreground">Product Variants & SKU Inventory</h3>
                    <p className="text-xs text-muted-foreground">
                      Specific SKU sizes, colors, and stock breakdown from Shopify.
                    </p>
                  </div>

                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 font-medium">Variant Title</th>
                          <th className="px-4 py-3 font-medium">SKU</th>
                          <th className="px-4 py-3 font-medium">Price</th>
                          <th className="px-4 py-3 font-medium">Inventory</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variants.length === 0 ? (
                          <tr>
                            <td className="px-4 py-3.5 font-medium">Default Title</td>
                            <td className="px-4 py-3.5 font-mono text-xs">{product.handle || "—"}</td>
                            <td className="px-4 py-3.5 font-semibold">
                              {formatMoney(product.price, product.currency ?? "INR")}
                            </td>
                            <td className="px-4 py-3.5">
                              <Badge
                                variant={
                                  product.inventoryTotal === 0
                                    ? "destructive"
                                    : product.inventoryTotal < 10
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {product.inventoryTotal} in stock
                              </Badge>
                            </td>
                          </tr>
                        ) : (
                          variants.map((variant: any) => (
                            <tr key={variant.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                              <td className="px-4 py-3.5 font-medium text-foreground">{variant.title}</td>
                              <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                                {variant.sku || "No SKU"}
                              </td>
                              <td className="px-4 py-3.5 font-semibold text-foreground">
                                {formatMoney(variant.price, product.currency ?? "INR")}
                              </td>
                              <td className="px-4 py-3.5">
                                <Badge
                                  variant={
                                    Number(variant.inventoryQuantity || 0) === 0
                                      ? "destructive"
                                      : Number(variant.inventoryQuantity || 0) < 10
                                      ? "secondary"
                                      : "outline"
                                  }
                                >
                                  {Number(variant.inventoryQuantity || 0).toLocaleString("en-IN")} units
                                </Badge>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                {/* TAB 5: MEDIA */}
                <TabsContent value="media" className="pt-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-foreground">Product Media Gallery</h3>
                    <p className="text-xs text-muted-foreground">
                      High-resolution images synced from your Shopify store catalogue.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {images.length === 0 && product.imageUrl ? (
                      <div className="aspect-square overflow-hidden rounded-xl border bg-muted">
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      images.map((image: any, idx: number) => (
                        <div
                          key={image.id ?? idx}
                          className="group relative aspect-square overflow-hidden rounded-xl border bg-muted shadow-sm"
                        >
                          <img
                            src={image.url}
                            alt={image.altText ?? product.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
        </div>

        {/* Right Sidebar Column: Overview Card & Metadata */}
        <div className="space-y-6">
          <Card className="border-border/60 shadow-sm overflow-hidden">
            <div className="aspect-square w-full bg-muted overflow-hidden relative">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-muted-foreground">
                  <Package className="h-16 w-16" />
                </div>
              )}
              <div className="absolute top-3 right-3">
                <Badge
                  variant={
                    product.inventoryTotal === 0
                      ? "destructive"
                      : product.inventoryTotal < 10
                      ? "secondary"
                      : "outline"
                  }
                  className="bg-background/90 backdrop-blur shadow-sm"
                >
                  {product.inventoryTotal === 0
                    ? "Out of Stock"
                    : `${product.inventoryTotal} in stock`}
                </Badge>
              </div>
            </div>

            <CardContent className="p-5 space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Catalogue Price</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatMoney(product.price, product.currency ?? "INR")}
                </p>
              </div>

              <div className="space-y-2 border-t pt-4 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" /> Product Type
                  </span>
                  <span className="font-medium text-foreground">{product.productType || "Standard"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" /> Vendor
                  </span>
                  <span className="font-medium text-foreground">{product.vendor || "Default Store"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" /> Status
                  </span>
                  <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                    {product.status || "ACTIVE"}
                  </Badge>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Synced At
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(product.syncedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              {product.descriptionHtml ? (
                <div className="border-t pt-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Description</p>
                  <div
                    className="prose prose-xs max-w-none text-xs text-muted-foreground line-clamp-4 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ASSIGN CREATOR MODAL */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Influencer to Product</DialogTitle>
            <DialogDescription>
              Select a creator from your roster to authorize promotion of{" "}
              <strong className="text-foreground">{product.title}</strong> and generate their affiliate link.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Select Influencer</Label>
              {availableCreators.length === 0 ? (
                <div className="p-3 bg-muted rounded-lg text-xs text-muted-foreground">
                  All creators in your roster are already assigned to this product, or no creators have joined your store yet.
                </div>
              ) : (
                <Select value={selectedCreatorId} onValueChange={setSelectedCreatorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an influencer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCreators.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.displayName} {c.instagramUsername ? `(@${c.instagramUsername})` : c.creatorCode ? `(@${c.creatorCode})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>Commission Rate (%)</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={assignCommissionRate}
                onChange={(e) => setAssignCommissionRate(e.target.value)}
                placeholder="10"
              />
              <p className="text-[11px] text-muted-foreground">
                Percentage of product sales paid to the creator upon completed order.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!selectedCreatorId || assignMutation.isPending}
              onClick={() =>
                assignMutation.mutate({
                  creatorId: selectedCreatorId,
                  commissionRate: Number(assignCommissionRate) || 10,
                })
              }
            >
              {assignMutation.isPending ? "Assigning..." : "Assign & Generate Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CREATE AFFILIATE LINK MODAL */}
      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Product Affiliate Link</DialogTitle>
            <DialogDescription>
              Create a direct tracking link pointing specifically to{" "}
              <strong className="text-foreground">{product.title}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Attributed Creator (Optional)</Label>
              <Select value={linkCreatorId} onValueChange={setLinkCreatorId}>
                <SelectTrigger>
                  <SelectValue placeholder="General / Store Link" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">General / Store Campaign (No specific creator)</SelectItem>
                  {assignedCreators.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.handle})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Commission Rate (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={linkCommissionRate}
                onChange={(e) => setLinkCommissionRate(e.target.value)}
                placeholder="10"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkModalOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={createLinkMutation.isPending}
              onClick={() =>
                createLinkMutation.mutate({
                  creatorId: linkCreatorId === "NONE" ? null : linkCreatorId,
                  commissionRate: Number(linkCommissionRate) || 10,
                })
              }
            >
              {createLinkMutation.isPending ? "Creating..." : "Create Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
