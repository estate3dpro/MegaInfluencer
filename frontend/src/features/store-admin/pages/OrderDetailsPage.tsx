import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ShoppingBag,
  ExternalLink,
  Package,
  User,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  TrendingUp,
  DollarSign,
  CreditCard,
  Truck,
  Calendar,
  Tag,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Share2,
  BadgeCheck,
  RotateCcw,
  Edit3,
  UserCheck,
  UserX,
  Link2,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Route } from "@/routes/store-admin/orders/$orderId";
import { getStoreOrderDetails, updateOrderCommissionStatus, attributeStoreOrder } from "../api/orders.api";
import { getStoreCreators } from "../api/creators.api";

function formatMoney(amount: number | string | null | undefined, currency = "INR") {
  const num = Number(amount ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 2,
  }).format(num);
}

export function OrderDetailsPage() {
  const { orderId } = Route.useParams();
  const queryClient = useQueryClient();
  const [copiedLink, setCopiedLink] = useState(false);
  const [isAttributionModalOpen, setIsAttributionModalOpen] = useState(false);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>("none");
  const [customRate, setCustomRate] = useState<string>("10");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["store", "order", orderId],
    queryFn: () => getStoreOrderDetails(orderId),
  });

  const { data: creators = [] } = useQuery({
    queryKey: ["store", "creators"],
    queryFn: getStoreCreators,
  });

  const commissionStatusMutation = useMutation({
    mutationFn: (newStatus: "PENDING" | "APPROVED" | "PAID" | "REVERSED") =>
      updateOrderCommissionStatus(orderId, newStatus),
    onSuccess: (_, newStatus) => {
      toast.success(`Commission status updated to ${newStatus}`);
      void refetch();
      void queryClient.invalidateQueries({ queryKey: ["store", "orders"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update commission status.");
    },
  });

  const attributionMutation = useMutation({
    mutationFn: (payload: { creatorId: string | null; commissionRate: number }) =>
      attributeStoreOrder(orderId, payload),
    onSuccess: (res) => {
      toast.success(res.creator ? `Order attributed to ${res.creator.displayName || "creator"}` : "Order creator attribution cleared");
      setIsAttributionModalOpen(false);
      void refetch();
      void queryClient.invalidateQueries({ queryKey: ["store", "orders"] });
      void queryClient.invalidateQueries({ queryKey: ["store", "commissions"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to attribute order.");
    },
  });

  const handleOpenAttributionModal = () => {
    const existingCreatorId = data?.order?.commission?.creator?.id;
    setSelectedCreatorId(existingCreatorId || "none");
    setCustomRate(String(data?.order?.commission?.rate || 10));
    setIsAttributionModalOpen(true);
  };

  const handleSaveAttribution = () => {
    const creatorId = selectedCreatorId === "none" ? null : selectedCreatorId;
    const rate = Math.max(0, Math.min(100, Number(customRate) || 10));
    attributionMutation.mutate({ creatorId, commissionRate: rate });
  };


  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
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

  if (isError || !data?.order) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-3" />
          <h2 className="text-lg font-semibold text-destructive">Order Not Found</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            The requested customer order could not be loaded or is not synced with your store.
          </p>
          <Button asChild variant="outline">
            <Link to="/store-admin/orders">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { order } = data;
  const shopifyNumericId = order.shopifyId?.split("/").pop() || "";
  const shopDomain = order.shopDomain?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const shopifyAdminUrl =
    shopDomain && shopifyNumericId ? `https://${shopDomain}/admin/orders/${shopifyNumericId}` : null;

  const address = order.shippingAddress;
  const customer = order.customer;
  const commission = order.commission;
  const attribution = order.attribution;

  const isPaid = /paid/i.test(order.financialStatus ?? "");
  const isRefunded = /refund/i.test(order.financialStatus ?? "");
  const isFulfilled = /fulfilled/i.test(order.fulfillmentStatus ?? "");

  return (
    <div className="space-y-6 pb-12">
      {/* Top Nav & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/store-admin/orders"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Orders
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
        title={`Order ${order.name}`}
        description={`Processed on ${
          order.processedAt
            ? new Date(order.processedAt).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Date unavailable"
        } · Customer: ${order.email ?? "Guest Checkout"}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenAttributionModal}
              className="border-primary/30 text-primary hover:bg-primary/10"
            >
              <UserCheck className="h-4 w-4 mr-1.5" />
              {commission?.creator ? "Edit Attribution" : "Attribute Creator"}
            </Button>
            {shopifyAdminUrl ? (
              <Button variant="outline" size="sm" asChild>
                <a href={shopifyAdminUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1.5" /> Open in Shopify
                </a>
              </Button>
            ) : null}
            {commission ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="default" className="bg-primary text-primary-foreground">
                    <BadgeCheck className="h-4 w-4 mr-1.5" /> Manage Commission
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>Commission Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => commissionStatusMutation.mutate("APPROVED")}
                    disabled={commission.status === "APPROVED" || commissionStatusMutation.isPending}
                    className="text-teal focus:text-teal"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Approve Commission
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => commissionStatusMutation.mutate("PAID")}
                    disabled={commission.status === "PAID" || commissionStatusMutation.isPending}
                    className="text-emerald-600 focus:text-emerald-600"
                  >
                    <DollarSign className="h-4 w-4 mr-2" /> Mark as Paid
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => commissionStatusMutation.mutate("PENDING")}
                    disabled={commission.status === "PENDING" || commissionStatusMutation.isPending}
                  >
                    <Clock className="h-4 w-4 mr-2" /> Mark as Pending
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => commissionStatusMutation.mutate("REVERSED")}
                    disabled={commission.status === "REVERSED" || commissionStatusMutation.isPending}
                    className="text-destructive focus:text-destructive"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" /> Reverse / Void Payout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        }
      />

      {/* Manual Attribution Dialog */}
      <Dialog open={isAttributionModalOpen} onOpenChange={setIsAttributionModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              <span>Attribute Order to Influencer</span>
            </DialogTitle>
            <DialogDescription>
              Assign a creator to this order or fix direct checkout / &ldquo;Buy It Now&rdquo; attributions.
              Commissions will be recalculated automatically based on this order total ({formatMoney(order.total, order.currency)}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="creator-select">Select Creator / Influencer</Label>
              <Select value={selectedCreatorId} onValueChange={setSelectedCreatorId}>
                <SelectTrigger id="creator-select">
                  <SelectValue placeholder="Choose a creator..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground italic">— No Influencer / Unattributed —</span>
                  </SelectItem>
                  {creators.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.displayName || "Unnamed Creator"} {c.creatorCode ? `(@${c.creatorCode})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCreatorId !== "none" && (
              <div className="space-y-2">
                <Label htmlFor="commission-rate">Commission Rate (%)</Label>
                <Input
                  id="commission-rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={customRate}
                  onChange={(e) => setCustomRate(e.target.value)}
                  placeholder="e.g. 10"
                />
                <p className="text-xs text-muted-foreground">
                  Estimated Payout:{" "}
                  <span className="font-semibold text-foreground">
                    {formatMoney((Number(order.total) * (Number(customRate) || 0)) / 100, order.currency)}
                  </span>
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsAttributionModalOpen(false)}
              disabled={attributionMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAttribution}
              disabled={attributionMutation.isPending}
              className="bg-primary text-primary-foreground"
            >
              {attributionMutation.isPending ? "Updating..." : "Save Attribution"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* 4 Metric KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Order Total</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                {formatMoney(order.total, order.currency)}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <Badge
                  variant={isRefunded ? "destructive" : "outline"}
                  className={
                    isPaid
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                      : isRefunded
                      ? ""
                      : "border-amber-500/30 bg-amber-500/10 text-amber-700"
                  }
                >
                  {order.financialStatus || "Paid"}
                </Badge>
              </div>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <CreditCard className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Fulfillment Status</p>
              <p className="mt-1 text-xl font-bold tracking-tight text-foreground">
                {order.fulfillmentStatus || "Unfulfilled"}
              </p>
              <div className="mt-1.5">
                <Badge
                  variant="outline"
                  className={
                    isFulfilled
                      ? "border-teal/30 bg-teal/5 text-teal"
                      : "border-amber-500/30 bg-amber-500/10 text-amber-700"
                  }
                >
                  {isFulfilled ? "Dispatched / Fulfilled" : "Awaiting Dispatch"}
                </Badge>
              </div>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-teal/10 text-teal">
              <Truck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Channel Attribution</p>
              <p className="mt-1 text-lg font-bold tracking-tight text-foreground">
                {attribution.creatorCode ? `@${attribution.creatorCode}` : "Direct Store"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-coral" />
                <span>{attribution.utmSource ? `Via ${attribution.utmSource}` : "Organic Checkout"}</span>
              </p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-coral/10 text-coral">
              <Sparkles className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Creator Commission</p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-indigo-600">
                {commission ? formatMoney(commission.amount, order.currency) : "₹0.00"}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5">
                {commission ? (
                  <Badge
                    variant="outline"
                    className={
                      commission.status === "PAID"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 font-semibold"
                        : commission.status === "APPROVED"
                        ? "border-teal/30 bg-teal/5 text-teal font-semibold"
                        : commission.status === "REVERSED"
                        ? "border-destructive/30 bg-destructive/10 text-destructive font-semibold"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-700 font-semibold"
                    }
                  >
                    {commission.status} ({commission.rate}%)
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">No creator commission</span>
                )}
              </div>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600">
              <DollarSign className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Main 2-Column Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Purchased Items & Marketing Attribution */}
        <div className="lg:col-span-2 space-y-6">
          {/* Purchased Line Items */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  <span>Purchased Items ({order.lineItems.length})</span>
                </CardTitle>
                <Badge variant="outline" className="font-mono text-xs">
                  {order.lineItems.reduce((sum, item) => sum + item.quantity, 0)} total units
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Item Details</th>
                      <th className="px-5 py-3 font-medium">SKU</th>
                      <th className="px-5 py-3 font-medium">Unit Price</th>
                      <th className="px-5 py-3 font-medium">Quantity</th>
                      <th className="px-5 py-3 text-right font-medium">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.lineItems.map((item, idx) => (
                      <tr key={item.id ?? idx} className="border-b last:border-0 hover:bg-muted/15 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="h-10 w-10 rounded-lg object-cover border bg-muted"
                              />
                            ) : (
                              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                                <Package className="h-5 w-5" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-foreground">{item.title}</p>
                              {item.variantTitle ? (
                                <p className="text-xs text-muted-foreground">{item.variantTitle}</p>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                          {item.sku || "—"}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-foreground">
                          {formatMoney(item.price, item.currency)}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-foreground">
                          × {item.quantity}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-foreground">
                          {formatMoney(item.total, item.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Order Totals Summary Footer */}
              <div className="border-t bg-muted/20 p-5">
                <div className="space-y-1.5 max-w-xs ml-auto text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatMoney(order.total, order.currency)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Taxes</span>
                    <span>Included</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-bold text-base text-foreground">
                    <span>Total Paid</span>
                    <span>{formatMoney(order.total, order.currency)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Marketing & Creator Attribution Tracker */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-coral" />
                <span>Marketing & Creator Attribution</span>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenAttributionModal}
                className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/10"
              >
                <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                {commission?.creator ? "Re-assign Creator" : "Assign Creator"}
              </Button>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border p-4 bg-muted/20 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Attributed Creator</p>
                  {commission?.creator || attribution.creatorCode ? (
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {(commission?.creator?.name ?? attribution.creatorCode ?? "CR").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {commission?.creator?.name ?? `Creator Code: ${attribution.creatorCode}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {commission?.creator?.handle ?? `@${attribution.creatorCode}`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Direct store order (no creator code captured)
                    </p>
                  )}
                </div>

                <div className="rounded-xl border p-4 bg-muted/20 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Affiliate Tracking Link</p>
                  {attribution.linkSlug || commission?.link?.slug ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-foreground">
                        /r/{attribution.linkSlug ?? commission?.link?.slug}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => handleCopy(`/r/${attribution.linkSlug ?? commission?.link?.slug}`)}
                      >
                        {copiedLink ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No affiliate link slug associated
                    </p>
                  )}
                </div>
              </div>

              {/* UTM Attributes Table */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Captured Campaign & UTM Parameters
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border bg-background p-3 text-xs">
                    <span className="text-muted-foreground block text-[11px]">UTM Source</span>
                    <span className="font-semibold text-foreground mt-0.5 block">
                      {attribution.utmSource || "direct"}
                    </span>
                  </div>
                  <div className="rounded-lg border bg-background p-3 text-xs">
                    <span className="text-muted-foreground block text-[11px]">UTM Medium</span>
                    <span className="font-semibold text-foreground mt-0.5 block">
                      {attribution.utmMedium || "instagram"}
                    </span>
                  </div>
                  <div className="rounded-lg border bg-background p-3 text-xs">
                    <span className="text-muted-foreground block text-[11px]">UTM Campaign</span>
                    <span className="font-semibold text-foreground mt-0.5 block">
                      {attribution.utmCampaign || "store_affiliate"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar Column: Customer & Shipping Details */}
        <div className="space-y-6">
          {/* Customer Profile Card */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <span>Customer Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                  {(customer?.firstName?.[0] ?? order.email?.[0] ?? "C").toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {customer?.firstName || customer?.lastName
                      ? `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim()
                      : "Online Customer"}
                  </p>
                  <p className="text-xs text-muted-foreground">{order.email ?? "Guest checkout"}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  <span className="text-foreground">{order.email || "No email on file"}</span>
                </div>
                {customer?.phone || address?.phone ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    <span className="text-foreground">{customer?.phone || address?.phone}</span>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address Card */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Delivery Address</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {address ? (
                <div className="space-y-1.5 text-xs text-foreground">
                  {address.name ? <p className="font-semibold">{address.name}</p> : null}
                  {address.address1 ? <p>{address.address1}</p> : null}
                  {address.address2 ? <p>{address.address2}</p> : null}
                  <p>
                    {[address.city, address.province, address.zip].filter(Boolean).join(", ")}
                  </p>
                  {address.country ? <p className="font-medium text-muted-foreground">{address.country}</p> : null}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Digital fulfillment or no shipping address recorded.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Shopify Platform Sync Card */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" />
                <span>Shopify Order Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shopify ID</span>
                <span className="font-mono font-medium text-foreground">{shopifyNumericId || order.shopifyId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Financial Status</span>
                <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                  {order.financialStatus}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fulfillment</span>
                <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                  {order.fulfillmentStatus}
                </Badge>
              </div>
              {shopifyAdminUrl ? (
                <div className="pt-2 border-t">
                  <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                    <a href={shopifyAdminUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> View on Shopify
                    </a>
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
