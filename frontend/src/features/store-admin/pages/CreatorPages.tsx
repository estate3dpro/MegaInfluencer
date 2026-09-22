import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  BadgeIndianRupee,
  CheckCircle2,
  ChevronRight,
  Copy,
  ExternalLink,
  Instagram,
  Link2,
  Megaphone,
  Plus,
  Search,
  Sparkles,
  UserPlus,
  UsersRound,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { createAffiliateLink, getAffiliateLinks, updateAffiliateLink } from "../api/affiliate-links.api";
import {
  assignStoreCreator,
  getAvailableCreators,
  getStoreCommissions,
  getStoreCreators,
  updateCommissionStatus,
  type StoreCreator,
} from "../api/creators.api";
import { getStoreProducts } from "../api/products.api";
import { getStoreCampaigns } from "@/features/campaigns/api/campaigns.api";

function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
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

function CreatorAvatar({ name, tone = "bg-primary/10 text-primary" }: { name: string; tone?: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold ${tone}`}>
      {initials || "C"}
    </span>
  );
}

// -------------------------------------------------------------
// 1. CREATORS PAGE
// -------------------------------------------------------------
export function CreatorsPage() {
  const [search, setSearch] = useState("");
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [selectedInfluencerId, setSelectedInfluencerId] = useState("");

  const client = useQueryClient();
  const query = useQuery({ queryKey: ["store", "creators"], queryFn: getStoreCreators });
  const creators = query.data ?? [];

  const availableQuery = useQuery({
    queryKey: ["store", "creators", "available"],
    queryFn: getAvailableCreators,
    enabled: partnerModalOpen,
  });

  const assignMutation = useMutation({
    mutationFn: (influencerId: string) => assignStoreCreator(influencerId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["store", "creators"] });
      client.invalidateQueries({ queryKey: ["store", "creators", "available"] });
      setPartnerModalOpen(false);
      setSelectedInfluencerId("");
      toast.success("Creator successfully added to your store roster!");
    },
    onError: () => toast.error("Could not add creator to store"),
  });

  const filteredCreators = creators.filter((c: StoreCreator) =>
    `${c.displayName} ${c.email || ""} ${c.creatorCode || ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  const totalSalesAll = creators.reduce((sum, c) => sum + (c.totalSales || 0), 0);
  const totalCommissionsAll = creators.reduce((sum, c) => sum + (c.totalCommissions || 0), 0);

  const tones = [
    "bg-coral/15 text-coral",
    "bg-primary/15 text-primary",
    "bg-teal/15 text-teal",
    "bg-indigo/15 text-indigo",
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Influencers & Creators"
        description="Manage verified creator partnerships, Instagram handles, product assignments, and tracked commission earnings."
        actions={
          <div className="flex gap-2">
            <Button onClick={() => setPartnerModalOpen(true)} variant="outline" size="sm">
              <UserPlus className="h-4 w-4" /> Add Creator Partner
            </Button>
            <Button asChild size="sm">
              <Link to="/store-admin/affiliate">
                <Plus className="h-4 w-4" /> Create tracking link
              </Link>
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-4">
        <SummaryCard
          label="Connected Creators"
          value={query.isLoading ? "..." : String(creators.length)}
          hint="Active brand partners"
          icon={UsersRound}
          iconClass="bg-primary/10 text-primary"
        />
        <SummaryCard
          label="Instagram Connected"
          value={String(creators.filter((c) => c.instagramUsername).length)}
          hint="With verified handle"
          icon={Instagram}
          iconClass="bg-coral/10 text-coral"
        />
        <SummaryCard
          label="Creator Attributed GMV"
          value={formatCurrency(totalSalesAll)}
          hint="Total sales driven"
          icon={BadgeIndianRupee}
          iconClass="bg-teal/10 text-teal"
        />
        <SummaryCard
          label="Commissions Earned"
          value={formatCurrency(totalCommissionsAll)}
          hint="Creator payout earnings"
          icon={Sparkles}
          iconClass="bg-indigo/10 text-indigo"
        />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 h-9"
            placeholder="Search creator by name, Instagram, or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/store-admin/commissions">
              <BadgeIndianRupee className="h-4 w-4 mr-1 text-primary" /> View Commission Payouts
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/store-admin/analytics">
              <Sparkles className="h-4 w-4 mr-1 text-primary" /> View Leaderboard
            </Link>
          </Button>
        </div>
      </div>

      <PageTable>
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="border-y bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">Influencer Profile</th>
              <th className="px-5 py-3 font-medium">Instagram Handle</th>
              <th className="px-5 py-3 font-medium">Creator Code</th>
              <th className="px-5 py-3 text-right font-medium">Attributed GMV</th>
              <th className="px-5 py-3 text-center font-medium">Orders</th>
              <th className="px-5 py-3 text-right font-medium">Commissions</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
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
            ) : filteredCreators.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                  No creators found. Click &ldquo;Add Creator Partner&rdquo; to add influencers to your store.
                </td>
              </tr>
            ) : (
              filteredCreators.map((creator, index) => (
                <tr key={creator.id} className="border-b last:border-0 hover:bg-muted/15 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <CreatorAvatar
                        name={creator.displayName}
                        tone={tones[index % tones.length]}
                      />
                      <div>
                        <p className="font-semibold text-foreground">{creator.displayName}</p>
                        <p className="text-xs text-muted-foreground">{creator.email || "No email"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {creator.instagramUsername ? (
                      <span className="inline-flex items-center gap-1 font-medium text-xs text-pink-600 dark:text-pink-400">
                        <Instagram className="h-3.5 w-3.5" />
                        @{creator.instagramUsername}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not connected</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-mono font-semibold text-xs text-primary">
                    {creator.creatorCode ? `@${creator.creatorCode}` : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-foreground">
                    {formatCurrency(creator.totalSales || 0)}
                  </td>
                  <td className="px-5 py-3.5 text-center font-medium">
                    {creator.totalOrders || 0}
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(creator.totalCommissions || 0)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Button asChild variant="ghost" size="sm" className="text-primary">
                      <Link to="/store-admin/creators/$creatorId" params={{ creatorId: creator.id }}>
                        Profile <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </PageTable>

      {/* Partner with Creator Dialog */}
      <Dialog open={partnerModalOpen} onOpenChange={setPartnerModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add Creator Partner</DialogTitle>
            <DialogDescription>
              Select an influencer registered on MegaInfluencer to partner with your store. They can receive product links and earn commissions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-3">
            <div className="grid gap-2">
              <Label>Select Influencer</Label>
              {availableQuery.isLoading ? (
                <p className="text-xs text-muted-foreground">Loading available creators...</p>
              ) : (availableQuery.data?.length ?? 0) === 0 ? (
                <p className="text-xs text-muted-foreground">
                  All registered influencers are currently assigned to your store.
                </p>
              ) : (
                <Select value={selectedInfluencerId} onValueChange={setSelectedInfluencerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an influencer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(availableQuery.data ?? []).map((creator) => (
                      <SelectItem key={creator.id} value={creator.id}>
                        {creator.displayName} {creator.instagramUsername ? `(@${creator.instagramUsername})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPartnerModalOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!selectedInfluencerId || assignMutation.isPending}
              onClick={() => selectedInfluencerId && assignMutation.mutate(selectedInfluencerId)}
            >
              {assignMutation.isPending ? "Assigning..." : "Assign to Store"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// -------------------------------------------------------------
// 2. AFFILIATE LINKS PAGE
// -------------------------------------------------------------
export function AffiliatePage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [linkType, setLinkType] = useState<"CREATOR" | "STORE">("CREATOR");
  const [creatorId, setCreatorId] = useState("");
  const [productId, setProductId] = useState("store");
  const [productSearch, setProductSearch] = useState("");
  const [commissionRate, setCommissionRate] = useState("10");

  const client = useQueryClient();
  const linksQuery = useQuery({
    queryKey: ["store", "affiliate-links", search],
    queryFn: () => getAffiliateLinks(search ? { search } : undefined),
  });

  const creatorsQuery = useQuery({
    queryKey: ["store", "creators"],
    queryFn: getStoreCreators,
    enabled: dialogOpen && linkType === "CREATOR",
  });

  const productsQuery = useQuery({
    queryKey: ["store", "products", "affiliate-link"],
    queryFn: () => getStoreProducts(1, { all: true }),
    enabled: dialogOpen,
  });

  const createMutation = useMutation({
    mutationFn: createAffiliateLink,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["store", "affiliate-links"] });
      setDialogOpen(false);
      setLinkType("CREATOR");
      setCreatorId("");
      setProductId("store");
      toast.success("Affiliate link created successfully");
    },
    onError: () => toast.error("Could not create the tracking link"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "PAUSED" }) =>
      updateAffiliateLink(id, { status }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["store", "affiliate-links"] }),
    onError: () => toast.error("Could not update link status"),
  });

  const links = linksQuery.data ?? [];
  const affiliateProducts = (productsQuery.data?.products ?? []).filter((product) =>
    `${product.name} ${product.sku}`.toLowerCase().includes(productSearch.trim().toLowerCase())
  );

  const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);
  const totalOrders = links.reduce((sum, link) => sum + link.orders, 0);
  const totalRevenue = links.reduce((sum, link) => sum + link.revenue, 0);

  const copyLink = async (url: string) => {
    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.setAttribute("readonly", "");
        textarea.style.cssText = "position:fixed;opacity:0;pointer-events:none";
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand("copy");
        textarea.remove();
        if (!copied) throw new Error("Clipboard command was rejected");
      }
      toast.success("Tracking link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const submitLink = () => {
    if (linkType === "CREATOR" && !creatorId) {
      toast.error("Please select a creator");
      return;
    }
    const rate = Number(commissionRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      toast.error("Commission rate must be between 0 and 100%");
      return;
    }
    createMutation.mutate({
      creatorId: linkType === "CREATOR" ? creatorId : null,
      productId: productId === "store" ? null : productId,
      commissionRate: rate,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Creator Tracking Links"
        description="Generate unique referral links with UTM parameters, auto-attribution, and custom commission rules."
        actions={
          <Button onClick={() => setDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4" /> Create tracking link
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Active Tracking Links"
          value={String(links.filter((l) => l.status === "ACTIVE").length)}
          hint={`${new Set(links.filter((l) => l.creatorId).map((l) => l.creatorId)).size} creators`}
          icon={Link2}
          iconClass="bg-primary/10 text-primary"
        />
        <SummaryCard
          label="Total Link Clicks"
          value={totalClicks.toLocaleString()}
          hint="From Instagram traffic"
          icon={ExternalLink}
          iconClass="bg-coral/10 text-coral"
        />
        <SummaryCard
          label="Total Attributed GMV"
          value={formatCurrency(totalRevenue)}
          hint={`${totalOrders} orders (${totalClicks ? ((totalOrders / totalClicks) * 100).toFixed(1) : 0}% conv)`}
          icon={BadgeIndianRupee}
          iconClass="bg-teal/10 text-teal"
        />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 h-9"
            placeholder="Search by creator name, product or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/store-admin/analytics">
            <Sparkles className="h-4 w-4 mr-1 text-primary" /> View Analytics
          </Link>
        </Button>
      </div>

      <PageTable>
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-y bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">Assigned Partner</th>
              <th className="px-5 py-3 font-medium">Short Tracking URL</th>
              <th className="px-5 py-3 text-center font-medium">Clicks</th>
              <th className="px-5 py-3 text-center font-medium">Orders</th>
              <th className="px-5 py-3 text-right font-medium">Attributed Sales</th>
              <th className="px-5 py-3 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {linksQuery.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td colSpan={6} className="px-5 py-4">
                    <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                  </td>
                </tr>
              ))
            ) : links.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                  No tracking links created yet. Click &ldquo;Create tracking link&rdquo; above to get started.
                </td>
              </tr>
            ) : (
              links.map((link) => (
                <tr key={link.id} className="border-b last:border-0 hover:bg-muted/15 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-foreground">
                    {link.creator ?? "Store-wide Link"}
                    <p className="text-xs font-normal text-muted-foreground mt-0.5">
                      {link.product ? `Product: ${link.product}` : "Entire Store"} · {link.commissionRate}% comm
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-foreground font-mono text-xs">
                      <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="max-w-64 truncate" title={link.url}>
                        {link.url}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() => copyLink(link.url)}
                        title="Copy link"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-center font-medium">
                    {link.clicks.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-center font-medium">
                    {link.orders}
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-foreground">
                    {formatCurrency(link.revenue)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Button
                      variant={link.status === "ACTIVE" ? "outline" : "secondary"}
                      size="sm"
                      className="text-xs h-7"
                      disabled={statusMutation.isPending}
                      onClick={() =>
                        statusMutation.mutate({
                          id: link.id,
                          status: link.status === "ACTIVE" ? "PAUSED" : "ACTIVE",
                        })
                      }
                    >
                      {link.status === "ACTIVE" ? "Active (Pause)" : "Paused (Resume)"}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </PageTable>

      {/* Creation Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Create Creator Tracking Link</DialogTitle>
            <DialogDescription>
              Generate a custom short link with automatic referral attribution, UTM tags, and commission payout tracking.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-3">
            <div className="grid gap-2">
              <Label>Attribution Type</Label>
              <Select value={linkType} onValueChange={(v: "CREATOR" | "STORE") => setLinkType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CREATOR">Creator Affiliate Link</SelectItem>
                  <SelectItem value="STORE">General Store Link (Store Credits)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {linkType === "CREATOR" ? (
              <div className="grid gap-2">
                <Label>Select Influencer / Creator</Label>
                <Select value={creatorId} onValueChange={setCreatorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a creator..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(creatorsQuery.data ?? []).map((creator) => (
                      <SelectItem key={creator.id} value={creator.id}>
                        {creator.displayName} {creator.creatorCode ? `(@${creator.creatorCode})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="grid gap-2">
              <Label>Destination Page / Product</Label>
              <Input
                placeholder="Filter products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="h-8 text-xs"
              />
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Entire storefront" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="store">Entire Store Homepage</SelectItem>
                  {affiliateProducts.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="commission-rate">
                {linkType === "CREATOR" ? "Commission Rate (%)" : "Store Credit Rate (%)"}
              </Label>
              <Input
                id="commission-rate"
                type="number"
                min="0"
                max="100"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitLink} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating link..." : "Generate Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// -------------------------------------------------------------
// 3. CAMPAIGNS PAGE (Connected with Live Campaign Data)
// -------------------------------------------------------------
export function CampaignsPage() {
  const query = useQuery({ queryKey: ["store-campaigns"], queryFn: getStoreCampaigns });
  const campaigns = query.data ?? [];
  const activeCount = campaigns.filter((c) => c.status === "PUBLISHED").length;
  const applicationCount = campaigns.reduce((tot, c) => tot + (c._count?.applications ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Creator Brand Campaigns"
        description="Structured partnerships, brief deliverables, and product seeding campaigns."
        actions={
          <Button asChild size="sm">
            <Link to="/store-admin/campaigns/new">
              <Plus className="h-4 w-4" /> Create campaign
            </Link>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Active Campaigns"
          value={query.isLoading ? "..." : String(activeCount)}
          hint={`${campaigns.length} total created`}
          icon={Megaphone}
          iconClass="bg-primary/10 text-primary"
        />
        <SummaryCard
          label="Creator Applications"
          value={String(applicationCount)}
          hint="From influencer community"
          icon={UsersRound}
          iconClass="bg-teal/10 text-teal"
        />
        <SummaryCard
          label="Campaign Marketplace"
          value="Live"
          hint="Discoverable by influencers"
          icon={Sparkles}
          iconClass="bg-coral/10 text-coral"
        />
      </section>

      {query.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="animate-pulse p-6">
              <div className="h-6 w-1/3 bg-muted rounded" />
              <div className="mt-4 h-16 bg-muted rounded" />
            </Card>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="border-dashed p-12 text-center">
          <p className="text-muted-foreground">No campaigns created yet.</p>
          <Button asChild className="mt-4" size="sm">
            <Link to="/store-admin/campaigns/new">
              <Plus className="h-4 w-4 mr-1" /> Create First Campaign
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="shadow-card overflow-hidden">
              <div className="relative h-32 overflow-hidden bg-muted">
                <img src={campaign.imageUrl} alt="" className="h-full w-full object-cover" />
                <Badge className="absolute left-3 top-3 border-0 bg-black/60 text-white backdrop-blur-sm">
                  {campaign.status}
                </Badge>
              </div>
              <CardContent className="p-5">
                <h2 className="font-display text-lg font-semibold">{campaign.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{campaign.brief}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Deliverables:</span>
                    <p className="font-medium truncate">{campaign.deliverables}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Applications:</span>
                    <p className="font-medium">{campaign._count?.applications ?? 0} creators</p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/store-admin/campaigns">Manage in Marketplace</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 4. COMMISSIONS PAGE (100% Live with Status Management)
// -------------------------------------------------------------
export function CommissionsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "PAID" | "REVERSED">("ALL");

  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["store", "commissions", statusFilter, search],
    queryFn: () => getStoreCommissions({ status: statusFilter, search }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "PENDING" | "APPROVED" | "PAID" | "REVERSED" }) =>
      updateCommissionStatus(id, status),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["store", "commissions"] });
      toast.success("Commission status updated successfully");
    },
    onError: () => toast.error("Failed to update commission status"),
  });

  const commissions = query.data?.commissions ?? [];
  const metrics = query.data?.metrics ?? {
    pendingAmount: 0,
    approvedAmount: 0,
    paidAmount: 0,
    totalCount: 0,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Creator Commission Payouts"
        description="Review attributed earnings, approve pending payouts, and track commission settlements."
        actions={
          <Button asChild size="sm">
            <Link to="/store-admin/analytics">
              <Sparkles className="h-4 w-4 mr-1 text-primary" /> View Leaderboard
            </Link>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Pending Approval"
          value={query.isLoading ? "..." : formatCurrency(metrics.pendingAmount)}
          hint="Awaiting store confirmation"
          icon={BadgeIndianRupee}
          iconClass="bg-amber-500/10 text-amber-600"
        />
        <SummaryCard
          label="Approved to Settle"
          value={query.isLoading ? "..." : formatCurrency(metrics.approvedAmount)}
          hint="Ready for bank transfer"
          icon={CheckCircle2}
          iconClass="bg-teal/10 text-teal"
        />
        <SummaryCard
          label="Settled & Paid"
          value={query.isLoading ? "..." : formatCurrency(metrics.paidAmount)}
          hint="Paid to creators"
          icon={UsersRound}
          iconClass="bg-primary/10 text-primary"
        />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 h-9"
            placeholder="Search by creator name, Instagram handle, or order #..."
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

      <PageTable>
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-y bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">Influencer</th>
              <th className="px-5 py-3 font-medium">Shopify Order</th>
              <th className="px-5 py-3 font-medium">Order GMV</th>
              <th className="px-5 py-3 font-medium">Commission Rate</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 text-right font-medium">Earned Amount</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
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
                  No commission records found. Orders driven by creator affiliate links or promo codes will appear here automatically.
                </td>
              </tr>
            ) : (
              commissions.map((comm) => (
                <tr key={comm.id} className="border-b last:border-0 hover:bg-muted/15 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <CreatorAvatar name={comm.creator?.name ?? "Creator"} />
                      <div>
                        <p className="font-semibold text-foreground">{comm.creator?.name ?? "Store Partner"}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          {comm.creator?.instagram ? (
                            <>
                              <Instagram className="h-3 w-3 text-pink-500" />
                              @{comm.creator.instagram}
                            </>
                          ) : (
                            comm.creator?.code ? `@${comm.creator.code}` : "No handle"
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono font-semibold text-foreground">
                    {comm.orderNumber}
                    <p className="text-xs font-normal text-muted-foreground">
                      {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(comm.createdAt))}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 font-medium">{formatCurrency(comm.orderAmount)}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{comm.commissionRate}%</td>
                  <td className="px-5 py-3.5">
                    <Badge
                      variant={
                        comm.status === "PAID"
                          ? "outline"
                          : comm.status === "APPROVED"
                          ? "default"
                          : comm.status === "REVERSED"
                          ? "secondary"
                          : "outline"
                      }
                      className={
                        comm.status === "PAID"
                          ? "border-teal/30 bg-teal/5 text-teal font-medium"
                          : comm.status === "APPROVED"
                          ? "bg-primary text-primary-foreground font-medium"
                          : comm.status === "REVERSED"
                          ? "bg-muted text-muted-foreground"
                          : "border-amber-500/30 bg-amber-500/5 text-amber-600 font-medium"
                      }
                    >
                      {comm.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(comm.amount)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex justify-end gap-1.5">
                      {comm.status === "PENDING" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-teal/40 text-teal hover:bg-teal/10"
                          disabled={updateMutation.isPending}
                          onClick={() => updateMutation.mutate({ id: comm.id, status: "APPROVED" })}
                        >
                          Approve
                        </Button>
                      ) : null}
                      {comm.status === "APPROVED" ? (
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-teal hover:bg-teal/90 text-teal-foreground"
                          disabled={updateMutation.isPending}
                          onClick={() => updateMutation.mutate({ id: comm.id, status: "PAID" })}
                        >
                          Mark Paid
                        </Button>
                      ) : null}
                      {comm.status !== "REVERSED" && comm.status !== "PAID" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-muted-foreground hover:text-destructive"
                          disabled={updateMutation.isPending}
                          onClick={() => updateMutation.mutate({ id: comm.id, status: "REVERSED" })}
                          title="Reverse Commission"
                        >
                          <XCircle className="h-3.5 w-3.5" />
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
    </div>
  );
}
