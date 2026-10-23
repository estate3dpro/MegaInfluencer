import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  ExternalLink,
  Copy,
  CheckCheck,
  TrendingUp,
  ShoppingBag,
  BadgeIndianRupee,
  Gift,
  Truck,
  User,
  Instagram,
  Link2,
  Sparkles,
  Calendar,
  Layers,
  Send,
  Zap,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  getStoreCreatorDetails,
  getCreatorAssignedProducts,
  updateCreatorAssignedProducts,
  updateCreatorCompensationMode,
  updateCreatorAutoCommission,
  createManualCommission,
  sendBarterSample,
  type CompensationMode,
} from "@/features/store-admin/api/creators.api";
import { EditAffiliateCommissionModal } from "@/features/store-admin/components/EditAffiliateCommissionModal";

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const numberFormat = new Intl.NumberFormat("en-IN");

export const Route = createFileRoute("/store-admin/creators/$creatorId")({ component: CreatorDetailPage });

function CreatorDetailPage() {
  const { creatorId } = Route.useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("products");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [sampleDialogOpen, setSampleDialogOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [editCommissionModalOpen, setEditCommissionModalOpen] = useState(false);
  const [selectedEditLink, setSelectedEditLink] = useState<any | null>(null);

  // Search & selections for product assignment
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Send sample form fields
  const [sampleProductTitle, setSampleProductTitle] = useState("");
  const [sampleCarrier, setSampleCarrier] = useState("Delhivery");
  const [sampleTrackingNumber, setSampleTrackingNumber] = useState("");

  // Manual Commission Modal State
  const [manualCommDialogOpen, setManualCommDialogOpen] = useState(false);
  const [manualCommAmount, setManualCommAmount] = useState("");
  const [manualCommOrderName, setManualCommOrderName] = useState("");
  const [manualCommNotes, setManualCommNotes] = useState("");
  const [manualCommStatus, setManualCommStatus] = useState<"APPROVED" | "PENDING" | "PAID">("APPROVED");

  // 1. Fetch Creator Detailed Info & Metrics
  const creatorQuery = useQuery({
    queryKey: ["store", "creator", creatorId],
    queryFn: () => getStoreCreatorDetails(creatorId),
  });

  // 2. Fetch Creator Assigned Products
  const productsQuery = useQuery({
    queryKey: ["store", "creator-products", creatorId],
    queryFn: () => getCreatorAssignedProducts(creatorId),
  });

  // 3. Mutation to update assigned products
  const updateProductsMutation = useMutation({
    mutationFn: (productIds: string[]) => updateCreatorAssignedProducts(creatorId, productIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["store", "creator-products", creatorId] });
      queryClient.invalidateQueries({ queryKey: ["store", "creator", creatorId] });
      setAssignDialogOpen(false);
      toast.success(`Updated assignments: ${data.assignedCount} products assigned.`);
    },
    onError: () => {
      toast.error("Failed to update product assignments.");
    },
  });

  // 4. Mutation to update compensation mode
  const updateCompensationMutation = useMutation({
    mutationFn: (mode: CompensationMode) => updateCreatorCompensationMode(creatorId, mode),
    onSuccess: (_, mode) => {
      queryClient.invalidateQueries({ queryKey: ["store", "creator", creatorId] });
      queryClient.invalidateQueries({ queryKey: ["store", "creators"] });
      toast.success(`Compensation model updated to ${mode}.`);
    },
    onError: () => {
      toast.error("Failed to update compensation mode.");
    },
  });

  // 5. Mutation to dispatch barter sample
  const sendSampleMutation = useMutation({
    mutationFn: (payload: { productTitle: string; carrier: string; trackingNumber: string }) =>
      sendBarterSample(creatorId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store", "creator", creatorId] });
      setSampleDialogOpen(false);
      setSampleProductTitle("");
      setSampleTrackingNumber("");
      toast.success("Product sample fulfillment recorded successfully!");
    },
    onError: () => {
      toast.error("Failed to record sample fulfillment.");
    },
  });

  // 6. Mutation to update Auto / Manual Commission Mode
  const updateAutoCommissionMutation = useMutation({
    mutationFn: (autoCommission: boolean) => updateCreatorAutoCommission(creatorId, autoCommission),
    onSuccess: (_, auto) => {
      queryClient.invalidateQueries({ queryKey: ["store", "creator", creatorId] });
      queryClient.invalidateQueries({ queryKey: ["store", "creators"] });
      if (auto) {
        toast.success("⚡ Auto Commission Enabled: Qualifying orders will be approved automatically.");
      } else {
        toast.info("🔒 Manual Commission Enabled: Qualifying orders will require manual approval.");
      }
    },
    onError: () => {
      toast.error("Failed to update commission mode.");
    },
  });

  // 7. Mutation to record Manual Commission payout / bonus
  const createManualCommissionMutation = useMutation({
    mutationFn: (data: { amount: number; orderName?: string; notes?: string; status?: "APPROVED" | "PENDING" | "PAID" }) =>
      createManualCommission(creatorId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store", "creator", creatorId] });
      queryClient.invalidateQueries({ queryKey: ["store", "creators"] });
      queryClient.invalidateQueries({ queryKey: ["store", "commissions"] });
      setManualCommDialogOpen(false);
      setManualCommAmount("");
      setManualCommOrderName("");
      setManualCommNotes("");
      toast.success("Manual commission credited successfully!");
    },
    onError: () => {
      toast.error("Failed to add manual commission.");
    },
  });

  const openAssignModal = () => {
    const currentlyAssigned = productsQuery.data?.products.filter((p) => p.isAssigned).map((p) => p.id) ?? [];
    setSelectedProductIds(currentlyAssigned);
    setAssignDialogOpen(true);
  };

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (!productsQuery.data?.products) return;
    setSelectedProductIds(productsQuery.data.products.map((p) => p.id));
  };

  const handleClearAll = () => {
    setSelectedProductIds([]);
  };

  const handleSaveAssignments = () => {
    updateProductsMutation.mutate(selectedProductIds);
  };

  const handleRemoveSingle = (productId: string) => {
    const currentAssigned = productsQuery.data?.products.filter((p) => p.isAssigned).map((p) => p.id) ?? [];
    const newAssigned = currentAssigned.filter((id) => id !== productId);
    updateProductsMutation.mutate(newAssigned);
  };

  const copyCreatorCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success(`Creator code ${code} copied!`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(id);
    toast.success("Affiliate tracking link copied!");
    setTimeout(() => setCopiedLink(null), 2000);
  };

  if (creatorQuery.isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-20 bg-muted rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-xl" />
          ))}
        </div>
        <div className="h-80 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!creatorQuery.data) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center text-destructive">
        <p className="font-semibold text-lg">Unable to load creator profile</p>
        <p className="text-sm mt-1 text-muted-foreground">The creator may no longer be assigned to this store.</p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link to="/store-admin/creators">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Return to Creators
          </Link>
        </Button>
      </div>
    );
  }

  const {
    creator,
    assignedAt,
    compensationMode,
    autoCommission: rawAutoComm,
    metrics = {
      totalSales: 0,
      totalOrders: 0,
      totalCommissions: 0,
      totalClicks: 0,
      conversionRate: 0,
      activeLinksCount: 0,
      sampleCount: 0,
    },
    links = [],
    recentOrders = [],
    barterFulfillments = [],
  } = creatorQuery.data;

  const autoCommission = creator?.autoCommission ?? rawAutoComm ?? true;

  const allProducts = productsQuery.data?.products ?? [];
  const assignedProducts = allProducts.filter((p) => p.isAssigned);
  const filteredModalProducts = allProducts.filter((p: any) =>
    (p.title || p.name || "").toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const formattedAssignedDate = assignedAt
    ? new Date(assignedAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Recently";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Back button */}
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2.5 text-xs text-muted-foreground hover:text-foreground">
          <Link to="/store-admin/creators">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to creators
          </Link>
        </Button>
      </div>

      {/* ========================================================================= */}
      {/* 1. CREATOR HERO PROFILE HEADER */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border bg-card p-6 shadow-card space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Creator Profile Info */}
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-tr from-primary to-indigo text-primary-foreground font-display font-bold text-2xl shadow-md">
                {getInitials(creator.displayName || "CR")}
              </div>
              <span
                className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-card ${
                  creator.status === "ACTIVE" ? "bg-emerald-500" : "bg-muted-foreground"
                }`}
                title={creator.status === "ACTIVE" ? "Active Account" : "Inactive Account"}
              />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {creator.displayName}
                </h1>
                <Badge
                  variant={creator.status === "ACTIVE" ? "default" : "secondary"}
                  className={creator.status === "ACTIVE" ? "bg-emerald-600 hover:bg-emerald-600 text-white text-xs" : "text-xs"}
                >
                  {creator.status === "ACTIVE" ? "● Active Partner" : "Suspended"}
                </Badge>
                {creator.termsAcceptedAt ? (
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 text-xs font-semibold gap-1.5 py-0.5 px-2.5 shadow-sm cursor-help"
                    title={`Legally binding agreement to Platform Terms & Conditions (Version ${creator.termsVersion || "v1.0"}) executed on ${new Date(creator.termsAcceptedAt).toLocaleString("en-IN")}`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Terms & Conditions Agreed</span>
                    <span className="text-[10px] opacity-75 font-mono">({new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(creator.termsAcceptedAt))})</span>
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 text-xs font-medium gap-1.5 py-0.5 px-2.5 cursor-help"
                    title="Legal agreement pending or not yet recorded"
                  >
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Terms Pending</span>
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-muted-foreground">
                <span>{creator.email ?? "No email address"}</span>

                {creator.instagramUsername ? (
                  <a
                    href={`https://instagram.com/${creator.instagramUsername}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline font-medium"
                  >
                    <Instagram className="h-3.5 w-3.5 text-pink-500" />
                    @{creator.instagramUsername}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Instagram className="h-3.5 w-3.5" /> Not connected
                  </span>
                )}

                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Assigned {formattedAssignedDate}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Badges & Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Creator Code Pill */}
            {creator.creatorCode && (
              <button
                type="button"
                onClick={() => copyCreatorCode(creator.creatorCode!)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-muted/40 hover:bg-muted text-xs font-mono font-semibold transition-all group"
                title="Click to copy creator code"
              >
                <span className="text-muted-foreground font-sans text-[11px]">Code:</span>
                <span className="text-foreground">{creator.creatorCode}</span>
                {copiedCode ? (
                  <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
                )}
              </button>
            )}

            {/* Compensation Mode Selector */}
            <div className="flex items-center gap-2">
              <Select
                value={compensationMode}
                onValueChange={(val: CompensationMode) => updateCompensationMutation.mutate(val)}
                disabled={updateCompensationMutation.isPending}
              >
                <SelectTrigger className="h-9 text-xs font-semibold w-40 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMMISSION">💵 Commission (%/₹)</SelectItem>
                  <SelectItem value="BARTER">🎁 Barter (Samples)</SelectItem>
                  <SelectItem value="HYBRID">⚡ Hybrid Model</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Influencer-wise Auto Commission On/Off Toggle Button */}
            <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-1 shadow-2xs">
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Commission Mode
                </span>
                <span
                  className={`text-xs font-bold flex items-center gap-1 ${
                    autoCommission
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {autoCommission ? "⚡ Auto Commission" : "🔒 Manual Review"}
                </span>
              </div>
              <Switch
                checked={autoCommission}
                disabled={updateAutoCommissionMutation.isPending}
                onCheckedChange={(val) => updateAutoCommissionMutation.mutate(val)}
                className="data-[state=checked]:bg-emerald-600 ml-1"
              />
            </div>

            {/* Manually Add Commission Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setManualCommDialogOpen(true)}
              className="h-9 text-xs font-semibold gap-1.5 border-dashed hover:border-primary"
            >
              <Plus className="h-3.5 w-3.5" /> Manual Commission
            </Button>

            <Button size="sm" onClick={openAssignModal}>
              <Package className="mr-1.5 h-4 w-4" /> Assign Products
            </Button>
          </div>
        </div>

        {/* Partnership Model Banner */}
        <div className="rounded-xl p-3.5 bg-muted/40 border flex flex-col gap-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {compensationMode === "BARTER" ? (
                <Gift className="h-4 w-4 text-coral shrink-0" />
              ) : compensationMode === "HYBRID" ? (
                <Zap className="h-4 w-4 text-indigo shrink-0" />
              ) : (
                <BadgeIndianRupee className="h-4 w-4 text-emerald-600 shrink-0" />
              )}
              <div>
                <span className="font-semibold text-foreground">
                  {compensationMode === "BARTER"
                    ? "Barter Partnership Active"
                    : compensationMode === "HYBRID"
                    ? "Hybrid Partnership Active"
                    : "Commission Partnership Active"}
                </span>
                <p className="text-[11px] text-muted-foreground">
                  {compensationMode === "BARTER"
                    ? "Purchases are tracked for performance insights, but no cash commission payout is generated."
                    : compensationMode === "HYBRID"
                    ? "Creator receives product samples and also earns cash commissions on referred sales."
                    : "Creator earns commission on every approved customer order generated through their link."}
                </p>
              </div>
            </div>

            {(compensationMode === "BARTER" || compensationMode === "HYBRID") && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs shrink-0 self-start sm:self-auto"
                onClick={() => setSampleDialogOpen(true)}
              >
                <Truck className="h-3.5 w-3.5 mr-1 text-primary" /> Ship Product Sample
              </Button>
            )}
          </div>

          {/* Auto vs Manual Commission Detailed Explainer */}
          {compensationMode !== "BARTER" && (
            <div className="pt-2.5 border-t border-border/40 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    autoCommission
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800"
                  }`}
                >
                  {autoCommission ? "⚡ Auto Commission: ON" : "🔒 Manual Commission: ON (Auto OFF)"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {autoCommission
                    ? "Customer orders referred by this creator are automatically approved and made available for withdrawal."
                    : "Customer orders referred by this creator remain Pending until manually reviewed and approved by Store Admin."}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. KEY PERFORMANCE & ATTRIBUTION METRICS */}
      {/* ========================================================================= */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Attributed Revenue */}
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-1">
          <p className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            <span>Attributed Revenue</span>
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
          </p>
          <p className="font-display text-xl font-bold text-foreground">
            {money.format(metrics.totalSales || 0)}
          </p>
          <p className="text-[10px] text-muted-foreground">{metrics.totalOrders || 0} tracked orders</p>
        </div>

        {/* Referred Orders */}
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-1">
          <p className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            <span>Referred Orders</span>
            <ShoppingBag className="h-3.5 w-3.5 text-coral" />
          </p>
          <p className="font-display text-xl font-bold text-foreground">
            {numberFormat.format(metrics.totalOrders || 0)}
          </p>
          <p className="text-[10px] text-muted-foreground">{metrics.conversionRate || 0}% conversion rate</p>
        </div>

        {/* Commissions Earned */}
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-1">
          <p className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            <span>Commissions Earned</span>
            <BadgeIndianRupee className="h-3.5 w-3.5 text-emerald-600" />
          </p>
          <p className="font-display text-xl font-bold text-emerald-600">
            {compensationMode === "BARTER" ? "Barter Model" : money.format(metrics.totalCommissions || 0)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {compensationMode === "BARTER" ? "Sample gifted" : "Paid/pending"}
          </p>
        </div>

        {/* Total Clicks */}
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-1">
          <p className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            <span>Tracking Clicks</span>
            <Link2 className="h-3.5 w-3.5 text-teal" />
          </p>
          <p className="font-display text-xl font-bold text-foreground">
            {numberFormat.format(metrics.totalClicks || 0)}
          </p>
          <p className="text-[10px] text-muted-foreground">{metrics.activeLinksCount || 0} active links</p>
        </div>

        {/* Instagram Followers */}
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-1">
          <p className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            <span>Followers</span>
            <Instagram className="h-3.5 w-3.5 text-pink-500" />
          </p>
          <p className="font-display text-xl font-bold text-foreground">
            {creator.instagramFollowersCount
              ? numberFormat.format(creator.instagramFollowersCount)
              : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {creator.instagramUsername ? `@${creator.instagramUsername}` : "Instagram pending"}
          </p>
        </div>

        {/* Product Access */}
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-1">
          <p className="text-xs text-muted-foreground font-medium flex items-center justify-between">
            <span>Catalog Access</span>
            <Package className="h-3.5 w-3.5 text-indigo" />
          </p>
          <p className="font-display text-xl font-bold text-foreground">
            {assignedProducts.length > 0 ? `${assignedProducts.length} items` : "Storewide"}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {assignedProducts.length > 0 ? "Restricted" : "All products visible"}
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. TABBED SECTIONS (PRODUCTS, TRACKING LINKS, ORDERS, SAMPLES, PROFILE) */}
      {/* ========================================================================= */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 border">
          <TabsTrigger value="products" className="text-xs gap-1.5">
            <Package className="h-3.5 w-3.5" /> Assigned Products ({assignedProducts.length})
          </TabsTrigger>
          <TabsTrigger value="links" className="text-xs gap-1.5">
            <Link2 className="h-3.5 w-3.5" /> Tracking Links ({links.length})
          </TabsTrigger>
          <TabsTrigger value="orders" className="text-xs gap-1.5">
            <ShoppingBag className="h-3.5 w-3.5" /> Referred Orders ({recentOrders.length})
          </TabsTrigger>
          {(compensationMode === "BARTER" || compensationMode === "HYBRID" || barterFulfillments.length > 0) && (
            <TabsTrigger value="samples" className="text-xs gap-1.5">
              <Gift className="h-3.5 w-3.5" /> Product Samples ({barterFulfillments.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="profile" className="text-xs gap-1.5">
            <User className="h-3.5 w-3.5" /> Creator Profile
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: ASSIGNED PRODUCTS */}
        <TabsContent value="products" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="flex-row items-center justify-between space-y-0 p-5 pb-3">
              <div>
                <CardTitle className="text-base font-bold">Assigned Catalog Products</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  {assignedProducts.length > 0
                    ? `Only these ${assignedProducts.length} products are restricted & visible to ${creator.displayName}.`
                    : "No specific products restricted. All store products are visible to this creator by default."}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={openAssignModal}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Manage Products
              </Button>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              {assignedProducts.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {assignedProducts.map((product) => (
                    <div key={product.id} className="flex items-center gap-3 rounded-xl border p-3 bg-card hover:border-primary/40 transition-all">
                      <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-lg bg-muted shrink-0">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate text-xs text-foreground">{product.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {product.price ? (product.price.startsWith("₹") ? product.price : `₹${product.price}`) : "—"}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive shrink-0 h-8 w-8"
                        onClick={() => handleRemoveSingle(product.id)}
                        title="Remove assignment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-8 text-center bg-muted/10">
                  <Package className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm font-semibold">Storewide Access (No restrictions)</p>
                  <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                    This creator currently has access to your entire catalog. Click &quot;Assign Products&quot; if you want to restrict them to specific items.
                  </p>
                  <Button size="sm" className="mt-4" onClick={openAssignModal}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Assign specific products
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: TRACKING LINKS */}
        <TabsContent value="links" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="flex-row items-center justify-between space-y-0 p-5 pb-3">
              <div>
                <CardTitle className="text-base font-bold">Affiliate Tracking Links</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Links created for {creator.displayName} to share on Instagram, YouTube, and WhatsApp.
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {links.length > 0 ? (
                <div className="rounded-xl border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
                      <tr>
                        <th className="py-2.5 px-3 text-left">Destination</th>
                        <th className="py-2.5 px-3 text-left">Tracking URL</th>
                        <th className="py-2.5 px-3 text-left">Commission</th>
                        <th className="py-2.5 px-3 text-center">Clicks</th>
                        <th className="py-2.5 px-3 text-center">Orders</th>
                        <th className="py-2.5 px-3 text-right">Revenue</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-right pr-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {links.map((link: any) => (
                        <tr key={link.id} className="hover:bg-muted/20">
                          <td className="py-3 px-3 font-semibold text-foreground">
                            {link.targetType === "STORE"
                              ? "Entire Store"
                              : link.product ?? link.collection ?? "Specific Target"}
                          </td>
                          <td className="py-3 px-3 font-mono">
                            <div className="flex items-center gap-1.5">
                              <span className="text-primary truncate max-w-xs">{link.url}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 shrink-0"
                                onClick={() => copyUrl(link.url, link.id)}
                                title="Copy Link"
                              >
                                {copiedLink === link.id ? (
                                  <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-semibold text-teal">
                            {link.commissionType === "FIXED_AMOUNT"
                              ? `₹${Number(link.commissionAmount ?? 0).toLocaleString()} (flat)`
                              : link.commissionRate ? `${link.commissionRate}%` : "—"}
                          </td>
                          <td className="py-3 px-3 text-center font-semibold">
                            {link.clicks || 0}
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-coral">
                            {link.orders || 0}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-foreground">
                            {money.format(link.revenue || 0)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Badge variant={link.status === "ACTIVE" ? "default" : "secondary"} className="text-[10px]">
                              {link.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-right pr-4">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs font-semibold hover:border-primary hover:text-primary"
                              onClick={() => {
                                setSelectedEditLink({
                                  ...link,
                                  creator: creator.displayName,
                                  creatorCode: creator.creatorCode,
                                });
                                setEditCommissionModalOpen(true);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5 mr-1 text-primary" /> Edit
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-8 text-center bg-muted/10">
                  <Link2 className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm font-semibold">No tracking links created yet</p>
                  <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                    Create unique tracking links from the Links tab or Products page to share with this creator.
                  </p>
                  <Button asChild size="sm" className="mt-4">
                    <Link to="/store-admin/creators">Generate New Link</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: ATTRIBUTED ORDERS */}
        <TabsContent value="orders" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="flex-row items-center justify-between space-y-0 p-5 pb-3">
              <div>
                <CardTitle className="text-base font-bold">Attributed Customer Orders</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Purchases tracked to {creator.displayName}&apos;s referral links and discount codes.
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {recentOrders.length > 0 ? (
                <div className="rounded-xl border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
                      <tr>
                        <th className="py-2.5 px-3 text-left">Order</th>
                        <th className="py-2.5 px-3 text-left">Date</th>
                        <th className="py-2.5 px-3 text-right">Order Amount</th>
                        <th className="py-2.5 px-3 text-right">Commission</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recentOrders.map((order: any) => (
                        <tr key={order.id} className="hover:bg-muted/20">
                          <td className="py-3 px-3 font-semibold text-foreground">
                            {order.orderName}
                          </td>
                          <td className="py-3 px-3 text-muted-foreground">
                            {new Date(order.processedAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-foreground">
                            {money.format(order.orderAmount)}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-600">
                            {compensationMode === "BARTER" ? "Barter" : money.format(order.amount)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Badge
                              variant={order.status === "APPROVED" || order.status === "PAID" ? "default" : "secondary"}
                              className="text-[10px]"
                            >
                              {order.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-8 text-center bg-muted/10">
                  <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm font-semibold">No orders attributed yet</p>
                  <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                    Once shoppers complete orders using {creator.displayName}&apos;s link or creator code, they will automatically appear here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: BARTER SAMPLES */}
        <TabsContent value="samples" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="flex-row items-center justify-between space-y-0 p-5 pb-3">
              <div>
                <CardTitle className="text-base font-bold">Barter Sample Fulfillments</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Track gifting shipments and sample packages dispatched to {creator.displayName}.
                </p>
              </div>
              <Button size="sm" onClick={() => setSampleDialogOpen(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Dispatch Sample
              </Button>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {barterFulfillments.length > 0 ? (
                <div className="rounded-xl border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
                      <tr>
                        <th className="py-2.5 px-3 text-left">Product Gift</th>
                        <th className="py-2.5 px-3 text-left">Carrier</th>
                        <th className="py-2.5 px-3 text-left">Tracking Number</th>
                        <th className="py-2.5 px-3 text-left">Date Dispatched</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {barterFulfillments.map((sample: any) => (
                        <tr key={sample.id} className="hover:bg-muted/20">
                          <td className="py-3 px-3 font-semibold text-foreground">
                            {sample.productTitle}
                          </td>
                          <td className="py-3 px-3 text-muted-foreground">
                            {sample.carrier || "Standard"}
                          </td>
                          <td className="py-3 px-3 font-mono font-medium">
                            {sample.trackingNumber || "—"}
                          </td>
                          <td className="py-3 px-3 text-muted-foreground">
                            {new Date(sample.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                              {sample.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-8 text-center bg-muted/10">
                  <Gift className="mx-auto h-8 w-8 text-coral" />
                  <p className="mt-2 text-sm font-semibold">No barter samples recorded</p>
                  <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                    Record sample products gifted to this creator along with courier tracking numbers.
                  </p>
                  <Button size="sm" className="mt-4" onClick={() => setSampleDialogOpen(true)}>
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Ship First Sample
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: PROFILE OVERVIEW */}
        <TabsContent value="profile" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold">Creator Profile & Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <dl className="grid gap-4 sm:grid-cols-2 text-xs">
                <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
                  <dt className="text-muted-foreground font-medium">Display Name</dt>
                  <dd className="font-semibold text-sm text-foreground">{creator.displayName}</dd>
                </div>

                <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
                  <dt className="text-muted-foreground font-medium">Email Address</dt>
                  <dd className="font-semibold text-sm text-foreground">{creator.email ?? "Not provided"}</dd>
                </div>

                <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
                  <dt className="text-muted-foreground font-medium">Creator Code</dt>
                  <dd className="font-mono font-bold text-sm text-primary">{creator.creatorCode ?? "—"}</dd>
                </div>

                <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
                  <dt className="text-muted-foreground font-medium">Instagram Handle</dt>
                  <dd className="font-semibold text-sm text-foreground">
                    {creator.instagramUsername ? `@${creator.instagramUsername}` : "Not connected"}
                  </dd>
                </div>

                <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
                  <dt className="text-muted-foreground font-medium">Partnership Date</dt>
                  <dd className="font-semibold text-sm text-foreground">{formattedAssignedDate}</dd>
                </div>

                <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
                  <dt className="text-muted-foreground font-medium">Compensation Model</dt>
                  <dd className="font-semibold text-sm text-foreground">{compensationMode}</dd>
                </div>

                {creator.profile?.bio && (
                  <div className="p-3 rounded-lg border bg-muted/20 sm:col-span-2 space-y-1">
                    <dt className="text-muted-foreground font-medium">Bio Description</dt>
                    <dd className="text-foreground leading-relaxed">{creator.profile.bio}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Legal Compliance & Agreement Card */}
          <Card className="shadow-card border-emerald-500/25 bg-emerald-500/5 dark:bg-emerald-950/20">
            <CardHeader className="p-5 pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Legal Terms & Condition Compliance
                </CardTitle>
                {creator.termsAcceptedAt ? (
                  <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 text-xs font-semibold gap-1">
                    ✓ Legally Enforceable Agreement (v{creator.termsVersion || "1.0"})
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-300 text-xs font-medium gap-1">
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                    Agreement Pending
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Official audit log proving this influencer has explicitly agreed to the Platform Terms of Service, Instagram Data Handling Policies, and Commerce Affiliate Terms.
              </p>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="grid gap-3 sm:grid-cols-3 text-xs">
                <div className="p-3 rounded-lg border bg-background/80 space-y-1">
                  <span className="text-muted-foreground font-medium">Agreement Status</span>
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    {creator.termsAcceptedAt ? (
                      <>
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Agreed & Legally Binding
                      </>
                    ) : (
                      <>
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        Pending Consent
                      </>
                    )}
                  </p>
                </div>
                <div className="p-3 rounded-lg border bg-background/80 space-y-1">
                  <span className="text-muted-foreground font-medium">Consent Timestamp</span>
                  <p className="font-semibold text-foreground font-mono">
                    {creator.termsAcceptedAt
                      ? new Date(creator.termsAcceptedAt).toLocaleString("en-IN")
                      : "No record yet"}
                  </p>
                </div>
                <div className="p-3 rounded-lg border bg-background/80 space-y-1">
                  <span className="text-muted-foreground font-medium">Policy Document</span>
                  <p className="font-semibold text-foreground">
                    Version {creator.termsVersion || "v1.0"} (Standard Terms & Meta Data Policy)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ========================================================================= */}
      {/* ASSIGN PRODUCTS DIALOG */}
      {/* ========================================================================= */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Assign Catalog Products to {creator.displayName}</DialogTitle>
            <DialogDescription>
              Select which products from your store catalog will be specifically visible on this creator&apos;s dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-3 py-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleSelectAll}>
                Select all
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleClearAll}>
                Clear
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 border rounded-lg p-2 min-h-60 max-h-96">
            {filteredModalProducts.map((product) => {
              const isChecked = selectedProductIds.includes(product.id);
              return (
                <div
                  key={product.id}
                  onClick={() => toggleProduct(product.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    isChecked ? "bg-primary/10 border-primary" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`grid h-5 w-5 place-items-center rounded border ${
                        isChecked ? "bg-primary text-primary-foreground border-primary" : "border-muted-foreground"
                      }`}
                    >
                      {isChecked && <Check className="h-3.5 w-3.5" />}
                    </div>
                    <div className="grid h-10 w-10 place-items-center overflow-hidden rounded bg-muted shrink-0">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold leading-none text-foreground">{product.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {product.price ? (product.price.startsWith("₹") ? product.price : `₹${product.price}`) : "—"}
                      </p>
                    </div>
                  </div>
                  {isChecked && <Badge variant="secondary" className="text-[10px]">Selected</Badge>}
                </div>
              );
            })}
            {!filteredModalProducts.length && (
              <p className="py-10 text-center text-xs text-muted-foreground">No products match your search query.</p>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              <b>{selectedProductIds.length}</b> products selected
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveAssignments} disabled={updateProductsMutation.isPending}>
                {updateProductsMutation.isPending ? "Saving..." : "Save Product Assignments"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* SHIP BARTER SAMPLE DIALOG */}
      {/* ========================================================================= */}
      <Dialog open={sampleDialogOpen} onOpenChange={setSampleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ship Product Sample to {creator.displayName}</DialogTitle>
            <DialogDescription>
              Record a gifted sample package sent to this creator for content creation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">Product Item Title</Label>
              <Input
                placeholder="e.g. Premium Silk Scarf / Face Serum"
                value={sampleProductTitle}
                onChange={(e) => setSampleProductTitle(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Courier / Carrier</Label>
                <Input
                  placeholder="Delhivery / BlueDart / DTDC"
                  value={sampleCarrier}
                  onChange={(e) => setSampleCarrier(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Tracking Number (AWB)</Label>
                <Input
                  placeholder="AWB123456789"
                  value={sampleTrackingNumber}
                  onChange={(e) => setSampleTrackingNumber(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setSampleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!sampleProductTitle.trim() || sendSampleMutation.isPending}
              onClick={() =>
                sendSampleMutation.mutate({
                  productTitle: sampleProductTitle,
                  carrier: sampleCarrier,
                  trackingNumber: sampleTrackingNumber,
                })
              }
            >
              {sendSampleMutation.isPending ? "Saving..." : "Record Sample Shipment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Commission Credit Dialog */}
      <Dialog open={manualCommDialogOpen} onOpenChange={setManualCommDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BadgeIndianRupee className="h-5 w-5 text-emerald-600" />
              Credit Manual Commission to {creator?.displayName}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Manually award a commission, promotional bonus, or custom sales attribution to this influencer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Commission Payout Amount (₹)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">₹</span>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="e.g. 500"
                  value={manualCommAmount}
                  onChange={(e) => setManualCommAmount(e.target.value)}
                  className="h-9 pl-7 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Order / Campaign Description</Label>
              <Input
                placeholder="e.g. Festive Campaign Performance Bonus / Offline Referral"
                value={manualCommOrderName}
                onChange={(e) => setManualCommOrderName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Initial Status</Label>
                <Select
                  value={manualCommStatus}
                  onValueChange={(val: "APPROVED" | "PENDING" | "PAID") => setManualCommStatus(val)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APPROVED">✓ Approved (Ready for withdrawal)</SelectItem>
                    <SelectItem value="PENDING">⏳ Pending (Review required)</SelectItem>
                    <SelectItem value="PAID">💵 Paid (Already disbursed)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Internal Notes (Optional)</Label>
                <Input
                  placeholder="e.g. Approved by Store Admin"
                  value={manualCommNotes}
                  onChange={(e) => setManualCommNotes(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setManualCommDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!manualCommAmount || Number(manualCommAmount) <= 0 || createManualCommissionMutation.isPending}
              onClick={() =>
                createManualCommissionMutation.mutate({
                  amount: Number(manualCommAmount),
                  orderName: manualCommOrderName,
                  notes: manualCommNotes,
                  status: manualCommStatus,
                })
              }
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
            >
              {createManualCommissionMutation.isPending ? "Crediting..." : "Confirm Commission Payout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditAffiliateCommissionModal
        open={editCommissionModalOpen}
        onOpenChange={setEditCommissionModalOpen}
        link={selectedEditLink}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["store", "creator", creatorId] });
        }}
      />
    </div>
  );
}
