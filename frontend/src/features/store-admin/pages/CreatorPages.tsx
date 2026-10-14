import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  BadgeIndianRupee,
  CheckCircle2,
  ChevronRight,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Gift,
  Instagram,
  Layers,
  Link2,
  Megaphone,
  Package,
  Plus,
  RefreshCw,
  Search,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Truck,
  UserCheck,
  UserPlus,
  UsersRound,
  XCircle,
  Zap,
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import { PlatformLinkGeneratorModal, type PlatformLinkItem } from "@/components/app/PlatformLinkGeneratorModal";
import { createAffiliateLink, getAffiliateLinks, updateAffiliateLink } from "../api/affiliate-links.api";
import { ReferralProgramSettingsModal } from "../components/ReferralProgramSettingsModal";
import {
  assignStoreCreator,
  bulkApproveCommissions,
  createStoreCreator,
  getAvailableCreators,
  getStoreCommissions,
  getStoreCreators,
  getCreatorSettings,
  updateCreatorSettings,
  approveCreator,
  rejectCreator,
  sendBarterSample,
  updateCreatorCompensationMode,
  updateCreatorAutoCommission,
  updateCommissionStatus,
  impersonateCreator,
  type CompensationMode,
  type CreateStoreCreatorInput,
  type StoreCreator,
} from "../api/creators.api";
import { getStoreProducts } from "../api/products.api";
import { getStoreCollections, syncStoreCollections, type StoreCollection } from "../api/collections.api";
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
      <div className="overflow-x-auto">{children}</div>
    </Card>
  );
}

function CreatorAvatar({ name, tone = "bg-primary/10 text-primary" }: { name?: string | null; tone?: string | undefined }) {
  const initials = (name ?? "")
    .split(" ")
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
// 1. CREATORS PAGE (With 3 Deal Modes: Commission, Barter, Hybrid + Sample Dispatch)
// -------------------------------------------------------------
export function CreatorsPage() {
  const [search, setSearch] = useState("");
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"CREATE" | "DIRECTORY">("CREATE");
  const [selectedInfluencerId, setSelectedInfluencerId] = useState("");
  const [assignDealMode, setAssignDealMode] = useState<CompensationMode>("COMMISSION");
  const [tabFilter, setTabFilter] = useState<"ALL" | "APPROVED" | "PENDING" | "AVAILABLE">("ALL");

  // Create Creator Form State
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newInstagram, setNewInstagram] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newBio, setNewBio] = useState("");
  const [newDealMode, setNewDealMode] = useState<CompensationMode>("COMMISSION");
  const [autoCreateLink, setAutoCreateLink] = useState(true);

  // Sample Dispatch Modal State
  const [sampleModalOpen, setSampleModalOpen] = useState(false);
  const [sampleCreator, setSampleCreator] = useState<StoreCreator | null>(null);
  const [sampleProductTitle, setSampleProductTitle] = useState("");
  const [sampleCarrier, setSampleCarrier] = useState("BlueDart");
  const [sampleTrackingNumber, setSampleTrackingNumber] = useState("");
  const [sampleAddress, setSampleAddress] = useState("");

  const navigate = useNavigate();
  const startImpersonation = useAuthStore((state) => state.startImpersonation);
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["store", "creators"], queryFn: getStoreCreators });
  const creators = query.data ?? [];

  const impersonateMutation = useMutation({
    mutationFn: (creatorId: string) => impersonateCreator(creatorId),
    onSuccess: (data) => {
      const accessToken = data.accessToken || data.tokens?.accessToken;
      const refreshToken = data.refreshToken || data.tokens?.refreshToken;
      if (!accessToken || !refreshToken) {
        toast.error("Failed to acquire impersonation session tokens");
        return;
      }
      const displayName = data.user.name || data.user.displayName || "Influencer";
      startImpersonation({
        influencerUser: {
          id: data.user.id,
          email: data.user.email || "",
          name: displayName,
          creatorCode: data.user.creatorCode,
          roles: ["influencer"],
          activeRole: "influencer",
        },
        accessToken,
        refreshToken,
        storeName: data.impersonatedBy?.storeName,
        targetCreatorId: data.user.id,
      });
      client.clear();
      toast.success(`Switched to impersonating ${displayName}`);
      void navigate({ to: "/influencer/dashboard" });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to impersonate creator");
    },
  });

  const settingsQuery = useQuery({
    queryKey: ["store", "creators", "settings"],
    queryFn: getCreatorSettings,
  });
  const autoApprove = settingsQuery.data?.autoApproveCreators ?? true;

  const toggleAutoApproveMutation = useMutation({
    mutationFn: (newValue: boolean) => updateCreatorSettings(newValue),
    onSuccess: (data) => {
      client.invalidateQueries({ queryKey: ["store", "creators", "settings"] });
      client.invalidateQueries({ queryKey: ["store", "creators"] });
      if (data.autoApproveCreators) {
        toast.success("⚡ Automatic Approval Active: Any registered influencer can partner and promote immediately.");
      } else {
        toast.info("🔒 Manual Approval Required: You now manually review and approve influencers in this roster.");
      }
    },
    onError: () => toast.error("Could not update approval workflow setting"),
  });

  const approveMutation = useMutation({
    mutationFn: ({ creatorId, compensationMode = "COMMISSION" }: { creatorId: string; compensationMode?: CompensationMode }) =>
      approveCreator(creatorId, compensationMode),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["store", "creators"] });
      client.invalidateQueries({ queryKey: ["store", "creators", "available"] });
      toast.success("Influencer partner approved!");
    },
    onError: () => toast.error("Could not approve influencer"),
  });

  const rejectMutation = useMutation({
    mutationFn: (creatorId: string) => rejectCreator(creatorId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["store", "creators"] });
      client.invalidateQueries({ queryKey: ["store", "creators", "available"] });
      toast.success("Influencer removed from roster.");
    },
    onError: () => toast.error("Could not remove influencer"),
  });

  const availableQuery = useQuery({
    queryKey: ["store", "creators", "available"],
    queryFn: getAvailableCreators,
    enabled: partnerModalOpen || tabFilter === "AVAILABLE",
  });

  const assignMutation = useMutation({
    mutationFn: ({ influencerId, compensationMode }: { influencerId: string; compensationMode: CompensationMode }) =>
      assignStoreCreator(influencerId, compensationMode),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["store", "creators"] });
      client.invalidateQueries({ queryKey: ["store", "creators", "available"] });
      setPartnerModalOpen(false);
      setSelectedInfluencerId("");
      toast.success("Creator successfully partnered with your store!");
    },
    onError: () => toast.error("Could not add creator to store"),
  });

  const createCreatorMutation = useMutation({
    mutationFn: (data: CreateStoreCreatorInput) => createStoreCreator(data),
    onSuccess: (res) => {
      client.invalidateQueries({ queryKey: ["store", "creators"] });
      client.invalidateQueries({ queryKey: ["store", "creators", "available"] });
      client.invalidateQueries({ queryKey: ["store", "affiliate-links"] });
      setPartnerModalOpen(false);
      setNewDisplayName("");
      setNewEmail("");
      setNewPassword("");
      setShowPassword(false);
      setNewPhone("");
      setNewInstagram("");
      setNewCity("");
      setNewBio("");
      setNewDealMode("COMMISSION");
      setAutoCreateLink(true);
      toast.success(
        `🎉 Influencer ${res.creator.displayName} (${res.creator.creatorCode ? `@${res.creator.creatorCode}` : 'partner'}) created & added to your store!`
      );
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to create creator");
    },
  });

  const compensationMutation = useMutation({
    mutationFn: ({ creatorId, compensationMode }: { creatorId: string; compensationMode: CompensationMode }) =>
      updateCreatorCompensationMode(creatorId, compensationMode),
    onSuccess: (_, variables) => {
      client.invalidateQueries({ queryKey: ["store", "creators"] });
      client.invalidateQueries({ queryKey: ["store", "commissions"] });
      const label =
        variables.compensationMode === "HYBRID"
          ? "⚡ Hybrid (Free Sample + 15% Commission)"
          : variables.compensationMode === "BARTER"
          ? "🎁 Barter Only (Product Gifting)"
          : "💵 15% Sales Commission Only";
      toast.success(`Creator partnership updated to ${label}`);
    },
    onError: () => toast.error("Could not update creator compensation mode"),
  });

  const autoCommissionMutation = useMutation({
    mutationFn: ({ creatorId, autoCommission }: { creatorId: string; autoCommission: boolean }) =>
      updateCreatorAutoCommission(creatorId, autoCommission),
    onSuccess: (data) => {
      client.invalidateQueries({ queryKey: ["store", "creators"] });
      if (data.autoCommission) {
        toast.success("⚡ Auto Commission Enabled: Referral orders will be automatically approved.");
      } else {
        toast.info("🔒 Manual Commission Enabled: Referral orders will require manual Store Admin review & approval.");
      }
    },
    onError: () => toast.error("Could not update commission mode"),
  });

  const sampleMutation = useMutation({
    mutationFn: (data: { creatorId: string; productTitle: string; carrier?: string; trackingNumber?: string; shippingAddress?: string }) =>
      sendBarterSample(data.creatorId, data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["store", "creators"] });
      setSampleModalOpen(false);
      setSampleProductTitle("");
      setSampleTrackingNumber("");
      setSampleAddress("");
      toast.success("Barter product sample dispatched and courier tracking shared with creator!");
    },
    onError: () => toast.error("Failed to record sample dispatch"),
  });

  const handleOpenSampleModal = (creator: StoreCreator) => {
    setSampleCreator(creator);
    setSampleProductTitle(creator.recentSample?.productTitle || "");
    setSampleCarrier(creator.recentSample?.carrier || "BlueDart");
    setSampleTrackingNumber(creator.recentSample?.trackingNumber || "");
    setSampleModalOpen(true);
  };

  const approvedCreators = creators.filter((c) => c.approvalStatus !== "PENDING");
  const pendingCreators = creators.filter((c) => c.approvalStatus === "PENDING");
  const availableCreators = availableQuery.data ?? [];

  const displayList =
    tabFilter === "PENDING"
      ? pendingCreators
      : tabFilter === "APPROVED"
      ? approvedCreators
      : creators;

  const filteredCreators = displayList.filter((c: StoreCreator) =>
    `${c.displayName} ${c.email || ""} ${c.creatorCode || ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  const filteredAvailable = availableCreators.filter((c) =>
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
        title="Influencers & Creators Roster"
        description="Manage verified creator partnerships, set compensation models (Commission, Barter, Hybrid), and track sample shipments."
        actions={
          <div className="flex gap-2">
            <Button onClick={() => setPartnerModalOpen(true)} className="gap-1.5 font-bold rounded-xl" size="sm">
              <UserPlus className="h-4 w-4" /> Add / Create Creator
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link to="/store-admin/affiliate">
                <Plus className="h-4 w-4" /> Create Link
              </Link>
            </Button>
          </div>
        }
      />

      {/* Influencer Approval Workflow Switcher Card */}
      <div className="rounded-2xl border bg-card p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start md:items-center gap-3">
          <div
            className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 font-bold transition-colors ${
              autoApprove
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
            }`}
          >
            {autoApprove ? <UserCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-sm text-foreground">Influencer Approval Workflow</h3>
              <Badge
                variant={autoApprove ? "default" : "outline"}
                className={`text-[11px] font-bold ${
                  autoApprove
                    ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                    : "text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30"
                }`}
              >
                {autoApprove ? "⚡ Automatic Approval (Instant)" : "🔒 Manual Review Required"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
              {autoApprove
                ? "Automatic: When an influencer joins or wants to promote your store, they are approved automatically and can generate links immediately."
                : "Manual: Influencers remain in 'Pending Review' until you manually review and click 'Approve' in this roster."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 self-start md:self-center bg-muted/40 p-2.5 px-4 rounded-xl border border-border/60 shrink-0">
          <div className="text-right">
            <span className="text-xs font-bold text-foreground block">Auto-Approve Influencers</span>
            <span className="text-[10px] text-muted-foreground block">
              {autoApprove ? "Instant Partnering" : "Manual Approval"}
            </span>
          </div>
          <Switch
            checked={autoApprove}
            disabled={toggleAutoApproveMutation.isPending}
            onCheckedChange={(checked) => toggleAutoApproveMutation.mutate(checked)}
          />
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-4">
        <SummaryCard
          label="Active Partners"
          value={query.isLoading ? "..." : String(approvedCreators.length)}
          hint="Approved influencers"
          icon={UsersRound}
          iconClass="bg-primary/10 text-primary"
        />
        <SummaryCard
          label="Pending Review"
          value={String(pendingCreators.length)}
          hint={pendingCreators.length > 0 ? "Requires manual approval" : "All creators reviewed"}
          icon={ShieldAlert}
          iconClass={pendingCreators.length > 0 ? "bg-amber-500/15 text-amber-600 font-bold" : "bg-muted text-muted-foreground"}
        />
        <SummaryCard
          label="Instagram Verified"
          value={String(creators.filter((c) => c.instagramUsername).length)}
          hint="With connected handle"
          icon={Instagram}
          iconClass="bg-coral/10 text-coral"
        />
        <SummaryCard
          label="Total Commissions"
          value={formatCurrency(totalCommissionsAll)}
          hint="Creator payout balance"
          icon={Sparkles}
          iconClass="bg-indigo/10 text-indigo"
        />
      </section>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b pb-2 overflow-x-auto">
        <Button
          type="button"
          size="sm"
          variant={tabFilter === "ALL" ? "default" : "ghost"}
          onClick={() => setTabFilter("ALL")}
          className="h-8 rounded-lg text-xs font-bold"
        >
          All Partners ({creators.length})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tabFilter === "APPROVED" ? "default" : "ghost"}
          onClick={() => setTabFilter("APPROVED")}
          className="h-8 rounded-lg text-xs font-bold"
        >
          Approved ({approvedCreators.length})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tabFilter === "PENDING" ? "default" : "ghost"}
          onClick={() => setTabFilter("PENDING")}
          className={`h-8 rounded-lg text-xs font-bold relative ${
            pendingCreators.length > 0 && tabFilter !== "PENDING" ? "text-amber-600 font-bold" : ""
          }`}
        >
          Pending Review ({pendingCreators.length})
          {pendingCreators.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.2 text-[10px] font-extrabold rounded-full bg-amber-500 text-white">
              {pendingCreators.length}
            </span>
          )}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tabFilter === "AVAILABLE" ? "default" : "ghost"}
          onClick={() => setTabFilter("AVAILABLE")}
          className="h-8 rounded-lg text-xs font-bold"
        >
          Available in Directory ({availableCreators.length})
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 h-9 text-xs rounded-xl"
            placeholder={tabFilter === "AVAILABLE" ? "Search directory influencers..." : "Search creator by name, Instagram, or code..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-xl text-xs">
            <Link to="/store-admin/commissions">
              <BadgeIndianRupee className="h-4 w-4 mr-1 text-primary" /> Approve Commission Payouts
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-xl text-xs">
            <Link to="/store-admin/analytics">
              <Sparkles className="h-4 w-4 mr-1 text-primary" /> Multi-Platform Analytics
            </Link>
          </Button>
        </div>
      </div>

      <PageTable>
        <table className="w-full min-w-[980px] text-left text-xs">
          <thead className="border-y bg-muted/40 text-muted-foreground font-semibold">
            {tabFilter === "AVAILABLE" ? (
              <tr>
                <th className="px-5 py-3.5">Influencer Profile</th>
                <th className="px-5 py-3.5">Instagram</th>
                <th className="px-5 py-3.5">Bio / Location</th>
                <th className="px-5 py-3.5 text-right pr-6">Quick Action</th>
              </tr>
            ) : (
              <tr>
                <th className="px-5 py-3.5">Influencer Profile</th>
                <th className="px-5 py-3.5">Instagram</th>
                <th className="px-5 py-3.5">Creator Code</th>
                <th className="px-5 py-3.5 text-center">Approval Status</th>
                <th className="px-5 py-3.5 text-center">Deal Model</th>
                <th className="px-5 py-3.5 text-center">Commission Mode</th>
                <th className="px-5 py-3.5 text-right">Attributed GMV</th>
                <th className="px-5 py-3.5 text-center">Orders</th>
                <th className="px-5 py-3.5 text-right">Commissions</th>
                <th className="px-5 py-3.5 text-right pr-6">Quick Actions</th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-border/60">
            {tabFilter === "AVAILABLE" ? (
              availableQuery.isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td colSpan={4} className="px-5 py-4">
                      <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                    </td>
                  </tr>
                ))
              ) : filteredAvailable.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-muted-foreground">
                    No available influencers found matching your search.
                  </td>
                </tr>
              ) : (
                filteredAvailable.map((creator, index) => (
                  <tr key={creator.id} className="hover:bg-muted/15 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <CreatorAvatar name={creator.displayName} tone={tones[index % tones.length]} />
                        <div>
                          <p className="font-bold text-foreground text-xs">{creator.displayName}</p>
                          <p className="text-[11px] text-muted-foreground">{creator.email || "No email"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {creator.instagramUsername ? (
                        <div className="flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center gap-1 font-semibold text-xs text-pink-600 dark:text-pink-400">
                            <Instagram className="h-3.5 w-3.5" />
                            @{creator.instagramUsername}
                          </span>
                          {creator.termsAcceptedAt ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 gap-1 px-1.5 py-0 cursor-help"
                              title={`Legally agreed to Terms & Conditions (v${creator.termsVersion || "1.0"}) on ${new Date(creator.termsAcceptedAt).toLocaleString("en-IN")}`}
                            >
                              <ShieldCheck className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              Terms Agreed
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 gap-1 px-1.5 py-0 cursor-help"
                              title="Legal consent pending or not recorded"
                            >
                              <ShieldAlert className="h-2.5 w-2.5 text-amber-600 shrink-0" />
                              Terms Pending
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Not connected</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground text-xs">
                      {creator.influencerProfile?.city ? `📍 ${creator.influencerProfile.city} · ` : ""}
                      {creator.influencerProfile?.bio?.slice(0, 50) || "MegaInfluencer Verified Creator"}
                    </td>
                    <td className="px-5 py-3.5 text-right pr-6">
                      <Button
                        size="sm"
                        disabled={assignMutation.isPending}
                        onClick={() =>
                          assignMutation.mutate({
                            influencerId: creator.id,
                            compensationMode: "COMMISSION",
                          })
                        }
                        className="h-7 px-3 text-xs font-bold rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground gap-1"
                      >
                        <UserPlus className="h-3.5 w-3.5" /> Approve & Partner
                      </Button>
                    </td>
                  </tr>
                ))
              )
            ) : query.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td colSpan={9} className="px-5 py-4">
                    <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                  </td>
                </tr>
              ))
            ) : filteredCreators.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-12 text-center text-muted-foreground">
                  {tabFilter === "PENDING"
                    ? "No influencers currently waiting for approval."
                    : "No creators found. Click \"Add Creator Partner\" to add influencers to your store."}
                </td>
              </tr>
            ) : (
              filteredCreators.map((creator, index) => {
                const mode = creator.compensationMode || "COMMISSION";
                const isPending = creator.approvalStatus === "PENDING";

                return (
                  <tr key={creator.id} className="hover:bg-muted/15 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <CreatorAvatar name={creator.displayName} tone={tones[index % tones.length]} />
                        <div>
                          <p className="font-bold text-foreground text-xs">{creator.displayName}</p>
                          <p className="text-[11px] text-muted-foreground">{creator.email || "No email"}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      {creator.instagramUsername ? (
                        <div className="flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center gap-1 font-semibold text-xs text-pink-600 dark:text-pink-400">
                            <Instagram className="h-3.5 w-3.5" />
                            @{creator.instagramUsername}
                          </span>
                          {creator.termsAcceptedAt ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 gap-1 px-1.5 py-0 cursor-help"
                              title={`Legally agreed to Terms & Conditions (v${creator.termsVersion || "1.0"}) on ${new Date(creator.termsAcceptedAt).toLocaleString("en-IN")}`}
                            >
                              <ShieldCheck className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              Terms Agreed
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 gap-1 px-1.5 py-0 cursor-help"
                              title="Legal consent pending or not recorded"
                            >
                              <ShieldAlert className="h-2.5 w-2.5 text-amber-600 shrink-0" />
                              Terms Pending
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Not connected</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 font-mono font-semibold text-xs text-primary">
                      {creator.creatorCode ? `@${creator.creatorCode}` : "—"}
                    </td>

                    {/* Approval Status Badge */}
                    <td className="px-5 py-3.5 text-center">
                      {isPending ? (
                        <Badge variant="outline" className="text-[10px] font-bold bg-amber-500/10 text-amber-700 border-amber-300">
                          ⏳ Pending Review
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] font-bold bg-emerald-500/10 text-emerald-700 border-emerald-300">
                          ✓ Approved
                        </Badge>
                      )}
                    </td>

                    {/* 3-Way Deal Mode Selector */}
                    <td className="px-5 py-3.5 text-center">
                      <div className="inline-flex items-center">
                        <Select
                          value={mode}
                          disabled={compensationMutation.isPending || isPending}
                          onValueChange={(val: CompensationMode) =>
                            compensationMutation.mutate({
                              creatorId: creator.id,
                              compensationMode: val,
                            })
                          }
                        >
                          <SelectTrigger
                            className={`h-7 px-2.5 text-[11px] font-bold rounded-lg border ${
                              mode === "HYBRID"
                                ? "bg-indigo-500/10 text-indigo-600 border-indigo-300"
                                : mode === "BARTER"
                                ? "bg-amber-500/10 text-amber-700 border-amber-300"
                                : "bg-emerald-500/10 text-emerald-600 border-emerald-300"
                            }`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="COMMISSION">💵 Commission (15%)</SelectItem>
                            <SelectItem value="BARTER">🎁 Barter Only</SelectItem>
                            <SelectItem value="HYBRID">⚡ Hybrid (Gift + %)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </td>

                    {/* Influencer-wise Auto / Manual Commission On/Off Switch Button */}
                    <td className="px-5 py-3.5 text-center">
                      {mode === "BARTER" ? (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground bg-muted/40">
                          N/A (Barter)
                        </Badge>
                      ) : (
                        <div className="inline-flex flex-col items-center justify-center gap-1">
                          <div className="flex items-center gap-1.5">
                            <Switch
                              checked={creator.autoCommission ?? true}
                              disabled={autoCommissionMutation.isPending || isPending}
                              onCheckedChange={(checked) =>
                                autoCommissionMutation.mutate({
                                  creatorId: creator.id,
                                  autoCommission: checked,
                                })
                              }
                              className="data-[state=checked]:bg-emerald-600 scale-90"
                            />
                            <span
                              className={`text-[11px] font-bold ${
                                creator.autoCommission ?? true
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              {creator.autoCommission ?? true ? "⚡ Auto" : "🔒 Manual"}
                            </span>
                          </div>
                          <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                            {creator.autoCommission ?? true ? "Auto-approved" : "Admin review"}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right font-bold text-foreground font-mono">
                      {formatCurrency(creator.totalSales || 0)}
                    </td>

                    <td className="px-5 py-3.5 text-center font-semibold">
                      {creator.totalOrders || 0}
                    </td>

                    <td className="px-5 py-3.5 text-right font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {mode === "BARTER" ? (
                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 border-amber-300">
                          Product Gifted
                        </Badge>
                      ) : (
                        formatCurrency(creator.totalCommissions || 0)
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right pr-6">
                      {isPending ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            disabled={approveMutation.isPending}
                            onClick={() =>
                              approveMutation.mutate({
                                creatorId: creator.id,
                                compensationMode: mode,
                              })
                            }
                            className="h-7 px-2.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg gap-1 shadow-xs"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={rejectMutation.isPending}
                            onClick={() => rejectMutation.mutate(creator.id)}
                            className="h-7 px-2 text-[11px] font-semibold text-destructive hover:bg-destructive/10 rounded-lg"
                          >
                            <XCircle className="h-3.5 w-3.5 mr-0.5" /> Decline
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Sample Gift Button for Barter or Hybrid */}
                          {(mode === "BARTER" || mode === "HYBRID") && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenSampleModal(creator)}
                              className="h-7 px-2 text-[11px] font-semibold text-amber-700 border-amber-300 hover:bg-amber-50 rounded-lg"
                              title="Gift Product Sample & Track Courier"
                            >
                              <Gift className="h-3.5 w-3.5 mr-1 text-amber-600" />
                              {creator.sampleCount ? "Sample Sent" : "Gift Sample"}
                            </Button>
                          )}

                          {/* Impersonate Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={impersonateMutation.isPending || creator.status !== "ACTIVE"}
                            onClick={() => impersonateMutation.mutate(creator.id)}
                            className="h-7 px-2 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg"
                            title="Impersonate and view platform from this creator's perspective"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1 text-indigo-600 dark:text-indigo-400" />
                            Impersonate
                          </Button>

                          <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-primary font-semibold">
                            <Link to="/store-admin/creators/$creatorId" params={{ creatorId: creator.id }}>
                              Profile <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                            </Link>
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </PageTable>

      {/* Partner or Create Creator Dialog */}
      <Dialog open={partnerModalOpen} onOpenChange={setPartnerModalOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {modalMode === "CREATE" ? "Create & Onboard Influencer" : "Partner with Existing Creator"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {modalMode === "CREATE"
                ? "Manually add an influencer to your roster with their handle, contact details, and partnership deal."
                : "Select an influencer already registered in the platform directory."}
            </DialogDescription>
          </DialogHeader>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted/60 rounded-xl my-1 border">
            <Button
              type="button"
              size="sm"
              variant={modalMode === "CREATE" ? "default" : "ghost"}
              onClick={() => setModalMode("CREATE")}
              className="text-xs font-bold rounded-lg h-8"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Create New Creator
            </Button>
            <Button
              type="button"
              size="sm"
              variant={modalMode === "DIRECTORY" ? "default" : "ghost"}
              onClick={() => setModalMode("DIRECTORY")}
              className="text-xs font-bold rounded-lg h-8"
            >
              <Search className="h-3.5 w-3.5 mr-1" /> Select from Directory
            </Button>
          </div>

          {modalMode === "CREATE" ? (
            <div className="space-y-3 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Creator Full Name *</Label>
                  <Input
                    placeholder="e.g. Riya Sharma"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    className="h-8.5 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Instagram Handle</Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold">@</span>
                    <Input
                      placeholder="riyasharma_style"
                      value={newInstagram}
                      onChange={(e) => setNewInstagram(e.target.value.replace(/^@/, ""))}
                      className="h-8.5 text-xs pl-7"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Email Address</Label>
                  <Input
                    type="email"
                    placeholder="e.g. riya@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="h-8.5 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">Portal Password</Label>
                    
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 6 chars (for login)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-8.5 text-xs pr-8"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {newPassword.trim().length > 0 && newPassword.trim().length < 6 && (
                <p className="-mt-1.5 text-[11px] text-destructive">
                  Password must be at least 6 characters.
                </p>
              )}
              {newPassword.trim().length >= 6 && !newEmail.trim() && (
                <p className="-mt-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                  Please provide an email address so the creator can log into their portal with this password.
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Phone Number</Label>
                  <Input
                    placeholder="e.g. +91 98765 43210"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="h-8.5 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">City / Location</Label>
                  <Input
                    placeholder="e.g. Mumbai, Maharashtra"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="h-8.5 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Partnership Deal Type</Label>
                <Select value={newDealMode} onValueChange={(val: CompensationMode) => setNewDealMode(val)}>
                  <SelectTrigger className="h-8.5 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMMISSION">💵 15% Sales Commission Only</SelectItem>
                    <SelectItem value="BARTER">🎁 Barter (Free Product Samples)</SelectItem>
                    <SelectItem value="HYBRID">⚡ Hybrid (Free Sample + 15% Commission)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Niche & Bio Notes (Optional)</Label>
                <Input
                  placeholder="e.g. Skincare & fashion creator (85k followers)"
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  className="h-8.5 text-xs"
                />
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-2.5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-foreground">Auto-generate tracking link</p>
                  <p className="text-[11px] text-muted-foreground">Creates an initial storewide tracking link (/r/...) ready for the creator immediately.</p>
                </div>
                <Switch checked={autoCreateLink} onCheckedChange={setAutoCreateLink} />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 py-3">
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold">Select Influencer</Label>
                {availableQuery.isLoading ? (
                  <p className="text-xs text-muted-foreground">Loading available creators...</p>
                ) : (availableQuery.data?.length ?? 0) === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    All registered influencers are currently assigned to your store. Use the &ldquo;Create New Creator&rdquo; tab to onboard a new one!
                  </p>
                ) : (
                  <Select value={selectedInfluencerId} onValueChange={setSelectedInfluencerId}>
                    <SelectTrigger className="h-9 text-xs">
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

              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold">Partnership Deal Type</Label>
                <Select value={assignDealMode} onValueChange={(val: CompensationMode) => setAssignDealMode(val)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMMISSION">💵 15% Sales Commission Only</SelectItem>
                    <SelectItem value="BARTER">🎁 Barter (Free Product Samples)</SelectItem>
                    <SelectItem value="HYBRID">⚡ Hybrid (Free Sample + 15% Commission)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPartnerModalOpen(false)}>
              Cancel
            </Button>
            {modalMode === "CREATE" ? (
              <Button
                size="sm"
                disabled={
                  !newDisplayName.trim() ||
                  (Boolean(newPassword.trim()) && newPassword.trim().length < 6) ||
                  (Boolean(newPassword.trim()) && !newEmail.trim()) ||
                  createCreatorMutation.isPending
                }
                onClick={() =>
                  createCreatorMutation.mutate({
                    displayName: newDisplayName.trim(),
                    email: newEmail.trim() || null,
                    password: newPassword.trim() || null,
                    phone: newPhone.trim() || null,
                    instagramUsername: newInstagram.trim() || null,
                    city: newCity.trim() || null,
                    bio: newBio.trim() || null,
                    compensationMode: newDealMode,
                    autoCreateLink,
                  })
                }
                className="gap-1.5"
              >
                {createCreatorMutation.isPending ? "Creating..." : "Create & Add Partner"}
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={!selectedInfluencerId || assignMutation.isPending}
                onClick={() => selectedInfluencerId && assignMutation.mutate({ influencerId: selectedInfluencerId, compensationMode: assignDealMode })}
              >
                {assignMutation.isPending ? "Adding..." : "Partner with Creator"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Barter Product Sample Shipment Modal */}
      <Dialog open={sampleModalOpen} onOpenChange={setSampleModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-amber-500" />
              Gift Product Sample to {sampleCreator?.displayName}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Record the complimentary product sample shipped to this creator. The tracking number will appear live in their Creator Portal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Product Title / Sample Box</Label>
              <Input
                placeholder="e.g. Silk Embroidered Kurta Set (Size M)"
                value={sampleProductTitle}
                onChange={(e) => setSampleProductTitle(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Courier / Carrier</Label>
                <Select value={sampleCarrier} onValueChange={setSampleCarrier}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BlueDart">BlueDart Express</SelectItem>
                    <SelectItem value="Delhivery">Delhivery</SelectItem>
                    <SelectItem value="DTDC">DTDC</SelectItem>
                    <SelectItem value="FedEx">FedEx</SelectItem>
                    <SelectItem value="SpeedPost">India Post / SpeedPost</SelectItem>
                    <SelectItem value="Other">Other Courier</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tracking Number / AWB</Label>
                <Input
                  placeholder="e.g. BLU789456123"
                  value={sampleTrackingNumber}
                  onChange={(e) => setSampleTrackingNumber(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Creator Shipping Address (Optional)</Label>
              <Input
                placeholder="e.g. Flat 402, Mumbai, Maharashtra"
                value={sampleAddress}
                onChange={(e) => setSampleAddress(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSampleModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!sampleProductTitle.trim() || sampleMutation.isPending}
              onClick={() =>
                sampleCreator &&
                sampleMutation.mutate({
                  creatorId: sampleCreator.id,
                  productTitle: sampleProductTitle,
                  carrier: sampleCarrier,
                  trackingNumber: sampleTrackingNumber,
                  shippingAddress: sampleAddress,
                })
              }
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
            >
              {sampleMutation.isPending ? "Saving..." : "Confirm Sample Dispatch"}
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
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [platformModalOpen, setPlatformModalOpen] = useState(false);
  const [selectedPlatformLink, setSelectedPlatformLink] = useState<PlatformLinkItem | null>(null);
  const [search, setSearch] = useState("");
  const [linkType, setLinkType] = useState<"CREATOR" | "STORE">("CREATOR");
  const [creatorId, setCreatorId] = useState("");
  const [destinationType, setDestinationType] = useState<"STORE" | "PRODUCT" | "COLLECTION">("STORE");
  const [productId, setProductId] = useState("store");
  const [collectionId, setCollectionId] = useState("");
  // Kept while migrating old custom-product collection drafts; Shopify collections are now the active flow.
  const [collectionProductIds, setCollectionProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [commissionType, setCommissionType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">("PERCENTAGE");
  const [commissionRate, setCommissionRate] = useState("10");
  const [commissionAmount, setCommissionAmount] = useState("100");

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
  const collectionsQuery = useQuery({
    queryKey: ["store", "collections", "affiliate-link"],
    queryFn: () => getStoreCollections(),
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
      setDestinationType("STORE");
      setCollectionId("");
      setCommissionType("PERCENTAGE");
      setCommissionRate("10");
      setCommissionAmount("100");
      toast.success("Affiliate link created successfully");
    },
    onError: () => toast.error("Could not create the tracking link"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "PAUSED" }) =>
      updateAffiliateLink(id, { status }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["store", "affiliate-links"] });
      toast.success("Link status updated");
    },
    onError: () => toast.error("Could not update link status"),
  });

  // API clients in this app may return either the body directly or an Axios-style
  // `{ data: body }` envelope. Normalize it here so a valid API response is never
  // rendered as an empty state.
  const getLinksFromResponse = (response: any): any[] => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.links)) return response.links;
    return response?.data ? getLinksFromResponse(response.data) : [];
  };
  const links = getLinksFromResponse(linksQuery.data);
  const rawBase = typeof window !== "undefined" ? window.location.origin : "";

  const handleCopyLink = async (slug: string) => {
    try {
      await navigator.clipboard.writeText(`${rawBase}/r/${slug}`);
      toast.success("Tracking link copied to clipboard!");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleOpenPlatformHub = (link: any) => {
    setSelectedPlatformLink({
      id: link.id,
      baseUrl: `${rawBase}/r/${link.slug}`,
      productName: link.productTitle,
      creatorName: link.creatorName,
      creatorCode: link.creatorCode,
      storeName: link.storeName,
      commissionType: link.commissionType,
      commissionRate: link.commissionRate,
      commissionAmount: link.commissionAmount,
      slug: link.slug,
    });
    setPlatformModalOpen(true);
  };

  const allProducts = Array.isArray(productsQuery.data?.products) ? productsQuery.data.products : [];
  const filteredProducts = allProducts.filter((product: any) => String(product?.title ?? product?.name ?? "").toLowerCase().includes(productSearch.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Affiliate & Campaign Links"
        description="Create dedicated tracking links for creators, products, and platform campaigns with automated attribution."
        actions={
          <div className="flex gap-2">
            <Button onClick={() => setDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Create Tracking Link
            </Button>
          </div>
        }
      />

      <PageTable>
        <table className="w-full min-w-[800px] text-left text-xs">
          <thead className="border-y bg-muted/40 text-muted-foreground font-semibold">
            <tr>
              <th className="px-5 py-3.5">Slug & Destination</th>
              <th className="px-5 py-3.5">Creator</th>
              <th className="px-5 py-3.5">Commission</th>
              <th className="px-5 py-3.5 text-center">Clicks</th>
              <th className="px-5 py-3.5 text-center">Orders</th>
              <th className="px-5 py-3.5 text-right">GMV</th>
              <th className="px-5 py-3.5 text-right pr-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {linksQuery.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td colSpan={7} className="px-5 py-4">
                    <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                  </td>
                </tr>
              ))
            ) : links.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                  No affiliate links created yet. Click &ldquo;Create Tracking Link&rdquo; to generate one.
                </td>
              </tr>
            ) : (
              links.map((link) => (
                <tr key={link.id} className="hover:bg-muted/15 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="font-mono font-bold text-primary">/r/{link.slug}</span>
                    <p className="text-[11px] text-muted-foreground truncate max-w-xs">{link.product || link.productTitle || link.collection || (link.targetType === "COLLECTION" ? "Custom product collection" : "Storewide Link")}</p>
                  </td>
                  <td className="px-5 py-3.5 font-medium">{link.creator || link.creatorName || "Storewide"}</td>
                  <td className="px-5 py-3.5 font-semibold text-teal">
                    {link.commissionType === "FIXED_AMOUNT"
                      ? `₹${Number(link.commissionAmount ?? 0).toLocaleString()} (flat)`
                      : `${link.commissionRate}%`}
                  </td>
                  <td className="px-5 py-3.5 text-center font-mono">{Number(link.clicks ?? 0).toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-center font-mono font-bold">{Number(link.orders ?? 0)}</td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold">{formatCurrency(Number(link.revenue ?? 0))}</td>
                  <td className="px-5 py-3.5 text-right pr-6">
                    <div className="flex justify-end gap-1.5">
                      <Button size="sm" variant="ghost" onClick={() => handleCopyLink(link.slug)} className="h-7 px-2 text-xs">
                        <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleOpenPlatformHub(link)} className="h-7 px-2 text-xs font-bold text-primary border-primary/30">
                        <Share2 className="h-3.5 w-3.5 mr-1" /> Hub
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </PageTable>

      {/* Create Link Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Affiliate Tracking Link</DialogTitle>
            <DialogDescription>
              Generate a unique short URL with attached UTM parameters for creator and channel attribution.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label>Link Scope</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={linkType === "CREATOR" ? "default" : "outline"}
                  onClick={() => setLinkType("CREATOR")}
                  className="text-xs"
                >
                  Creator Specific
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={linkType === "STORE" ? "default" : "outline"}
                  onClick={() => {
                    setLinkType("STORE");
                    setCreatorId("");
                  }}
                  className="text-xs"
                >
                  General / Storewide
                </Button>
              </div>
            </div>

            {linkType === "CREATOR" && (
              <div className="space-y-1.5">
                <Label>Select Creator Partner *</Label>
                <Select value={creatorId} onValueChange={setCreatorId}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Choose creator..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(creatorsQuery.data ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.displayName} {c.creatorCode ? `(@${c.creatorCode})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Target Destination *</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["STORE", "PRODUCT", "COLLECTION"] as const).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    size="sm"
                    variant={destinationType === type ? "default" : "outline"}
                    className="text-[11px]"
                    onClick={() => {
                      setDestinationType(type);
                      if (type !== "PRODUCT") setProductId("store");
                      if (type !== "COLLECTION") setCollectionId("");
                    }}
                  >
                    {type === "STORE" ? "Entire Store" : type === "PRODUCT" ? "One Product" : "Collection"}
                  </Button>
                ))}
              </div>
            </div>

            {destinationType === "PRODUCT" && (
              <div className="space-y-1.5">
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Choose a product" />
                </SelectTrigger>
                <SelectContent>
                  {allProducts.map((p: any) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      📦 {p.title || p.name} ({p.price ? `₹${p.price}` : "Product"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              </div>
            )}

            {destinationType === "COLLECTION" && (
              <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-2.5">
                <Label className="text-xs">Select synced Shopify collection *</Label>
                <Select value={collectionId} onValueChange={setCollectionId}>
                  <SelectTrigger className="bg-background text-xs"><SelectValue placeholder="Choose a Shopify collection" /></SelectTrigger>
                  <SelectContent>
                    {(collectionsQuery.data ?? []).map((collection) => (
                      <SelectItem key={collection.id} value={collection.id} className="text-xs">
                        {collection.title} ({collection.productCount} products)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">The link opens Shopify's collection page and credits orders containing its synced products.</p>
              </div>
            )}

            {false && destinationType === "COLLECTION" && (
              <div className="space-y-2 rounded-lg border p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs">Select collection products *</Label>
                  <span className="text-[11px] text-muted-foreground">{collectionProductIds.length} selected</span>
                </div>
                <Input
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  placeholder="Search products..."
                  className="h-8 text-xs"
                />
                <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
                  {filteredProducts.map((product: any) => {
                    const selected = collectionProductIds.includes(product.id);
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => setCollectionProductIds((ids) => selected ? ids.filter((id) => id !== product.id) : [...ids, product.id])}
                        className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs ${selected ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
                      >
                        <span className="truncate">{product.title || product.name || "Untitled product"}</span>
                        <span className="ml-2 shrink-0">{selected ? "✓" : "+"}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground">Orders are counted only when they contain one of these products.</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Commission Reward Type *</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={commissionType === "PERCENTAGE" ? "default" : "outline"}
                  onClick={() => setCommissionType("PERCENTAGE")}
                  className="text-xs"
                >
                  % Percentage of Order
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={commissionType === "FIXED_AMOUNT" ? "default" : "outline"}
                  onClick={() => setCommissionType("FIXED_AMOUNT")}
                  className="text-xs"
                >
                  ₹ Flat Amount per Sale
                </Button>
              </div>
            </div>

            {commissionType === "PERCENTAGE" ? (
              <div className="space-y-1.5">
                <Label>Commission Rate (%)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    className="text-xs font-mono pr-7"
                    placeholder="10"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Creator earns {commissionRate || 0}% of qualifying order subtotal.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Flat Commission Amount (₹)</Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">₹</span>
                  <Input
                    type="number"
                    min="0"
                    value={commissionAmount}
                    onChange={(e) => setCommissionAmount(e.target.value)}
                    className="text-xs font-mono pl-7"
                    placeholder="100"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">Creator earns a fixed ₹{commissionAmount || 0} payout on each successful attributed sale.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} size="sm">
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={createMutation.isPending || (linkType === "CREATOR" && !creatorId) || (destinationType === "PRODUCT" && productId === "store") || (destinationType === "COLLECTION" && !collectionId)}
              onClick={() => {
                createMutation.mutate({
                  creatorId: linkType === "CREATOR" ? creatorId : null,
                  productId: destinationType === "PRODUCT" ? productId : null,
                  collectionId: destinationType === "COLLECTION" ? collectionId : null,
                  commissionType,
                  commissionRate: commissionType === "PERCENTAGE" ? (Number(commissionRate) || 10) : 0,
                  commissionAmount: commissionType === "FIXED_AMOUNT" ? (Number(commissionAmount) || 0) : null,
                });
              }}
            >
              {createMutation.isPending ? "Creating..." : "Create Tracking Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PlatformLinkGeneratorModal open={platformModalOpen} onOpenChange={setPlatformModalOpen} linkItem={selectedPlatformLink} />
    </div>
  );
}

// -------------------------------------------------------------
// 3. SHOPIFY COLLECTIONS PAGE
// -------------------------------------------------------------
export function CollectionsPage() {
  const [search, setSearch] = useState("");
  const client = useQueryClient();
  const collectionsQuery = useQuery({ queryKey: ["store", "collections", search], queryFn: () => getStoreCollections(search) });
  const syncMutation = useMutation({
    mutationFn: syncStoreCollections,
    onSuccess: (result) => {
      toast.success(result.alreadyRunning ? "Collection sync is already in progress" : "Shopify collection sync started");
      window.setTimeout(() => client.invalidateQueries({ queryKey: ["store", "collections"] }), 1800);
    },
    onError: () => toast.error("Could not start the Shopify collection sync"),
  });
  const collections = collectionsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shopify Collections"
        description="Sync your Shopify collections, see their products, and create trackable creator links for each collection."
        actions={<Button size="sm" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} className="gap-1.5"><RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />{syncMutation.isPending ? "Starting sync..." : "Sync collections"}</Button>}
      />
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-background to-teal/5 p-4 text-sm">
        <div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary"><Layers className="h-5 w-5" /></span><div><p className="font-semibold">Use Shopify collections as affiliate destinations</p><p className="mt-0.5 text-xs text-muted-foreground">A collection link opens the collection on your Shopify storefront and only attributes orders containing products currently synced into that collection.</p></div></div>
      </div>
      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="h-9 pl-9 text-xs" placeholder="Search Shopify collections..." /></div>
      <PageTable>
        <table className="w-full min-w-[760px] text-left text-xs"><thead className="border-y bg-muted/40 text-muted-foreground font-semibold"><tr><th className="px-5 py-3.5">Collection</th><th className="px-5 py-3.5">Shopify handle</th><th className="px-5 py-3.5 text-center">Products</th><th className="px-5 py-3.5 text-center">Active links</th><th className="px-5 py-3.5 text-right pr-6">Action</th></tr></thead><tbody className="divide-y divide-border/60">
          {collectionsQuery.isLoading ? Array.from({ length: 4 }).map((_, index) => <tr key={index}><td colSpan={5} className="px-5 py-4"><div className="h-5 w-2/3 animate-pulse rounded bg-muted" /></td></tr>) : collections.length === 0 ? <tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">No synced collections yet. Sync Shopify collections to start creating collection affiliate links.</td></tr> : collections.map((collection: StoreCollection) => <tr key={collection.id} className="hover:bg-muted/15"><td className="px-5 py-3.5"><div className="flex items-center gap-3">{collection.imageUrl ? <img src={collection.imageUrl} alt="" className="h-9 w-9 rounded-lg object-cover" /> : <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><Layers className="h-4 w-4" /></span>}<div><p className="font-semibold text-foreground">{collection.title}</p><p className="text-[11px] text-muted-foreground">Synced {new Date(collection.syncedAt).toLocaleDateString("en-IN")}</p></div></div></td><td className="px-5 py-3.5 font-mono text-muted-foreground">/collections/{collection.handle || "—"}</td><td className="px-5 py-3.5 text-center font-semibold">{collection.productCount}</td><td className="px-5 py-3.5 text-center">{collection.activeLinksCount}</td><td className="px-5 py-3.5 text-right pr-6"><Button asChild size="sm" variant="outline" className="h-7 text-xs"><Link to="/store-admin/affiliate"><Link2 className="mr-1 h-3.5 w-3.5" />Create link</Link></Button></td></tr>)}
        </tbody></table>
      </PageTable>
    </div>
  );
}

// -------------------------------------------------------------
// 4. CAMPAIGNS PAGE
// -------------------------------------------------------------
export function CampaignsPage() {
  const query = useQuery({ queryKey: ["store", "campaigns"], queryFn: getStoreCampaigns });
  const campaigns = query.data ?? [];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Creator Campaigns"
        description="Launch fixed-fee, barter product exchange, and commission campaigns for the influencer community."
        actions={
          <Button asChild size="sm">
            <Link to="/store-admin/campaigns/new">
              <Plus className="h-4 w-4 mr-1" /> Create Campaign
            </Link>
          </Button>
        }
      />
    </div>
  );
}

// -------------------------------------------------------------
// 4. COMMISSIONS PAGE (100% Live with 1-Click Bulk Approval & Explanations)
// -------------------------------------------------------------
export function CommissionsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "PAID" | "REVERSED">("ALL");

  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["store", "commissions", statusFilter, search],
    queryFn: () => getStoreCommissions(statusFilter, search),
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

  const bulkApproveMutation = useMutation({
    mutationFn: bulkApproveCommissions,
    onSuccess: (data) => {
      client.invalidateQueries({ queryKey: ["store", "commissions"] });
      toast.success(data.message || `Approved all pending commissions!`);
    },
    onError: () => toast.error("Failed to approve commissions"),
  });

  const commissions = query.data?.commissions ?? [];
  const metrics = query.data?.metrics ?? {
    pendingAmount: 0,
    approvedAmount: 0,
    paidAmount: 0,
    totalCount: 0,
    pendingCount: 0,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Creator Commission Payouts"
        description="Review attributed earnings, approve pending payouts, and settle creator commissions."
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => bulkApproveMutation.mutate()}
              disabled={metrics.pendingCount === 0 || bulkApproveMutation.isPending}
              className="gap-1.5 font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
              size="sm"
            >
              <CheckCircle2 className="h-4 w-4" />
              {bulkApproveMutation.isPending ? "Approving..." : `Approve All Pending (${metrics.pendingCount})`}
            </Button>
          </div>
        }
      />

      {/* Explainer Banner for Store Admin */}
      <div className="rounded-2xl border border-teal/20 bg-gradient-to-r from-teal/5 via-background to-primary/5 p-4 text-xs text-foreground flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-teal/15 text-teal flex items-center justify-center font-bold shrink-0">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-sm">Why are customer sales marked as "Pending"?</p>
            <p className="text-muted-foreground mt-0.5">
              New sales start as <strong>PENDING</strong> to protect your store against customer returns or cancellations. Once an order is delivered, click <strong>Approve</strong> to release the payout to the creator.
            </p>
          </div>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Pending Approval"
          value={query.isLoading ? "..." : formatCurrency(metrics.pendingAmount)}
          hint={`${metrics.pendingCount} orders awaiting confirmation`}
          icon={BadgeIndianRupee}
          iconClass="bg-amber-500/10 text-amber-600"
        />
        <SummaryCard
          label="Approved to Settle"
          value={query.isLoading ? "..." : formatCurrency(metrics.approvedAmount)}
          hint="Ready for creator withdrawal"
          icon={CheckCircle2}
          iconClass="bg-teal/10 text-teal"
        />
        <SummaryCard
          label="Settled & Paid"
          value={query.isLoading ? "..." : formatCurrency(metrics.paidAmount)}
          hint="Total paid to creators"
          icon={UsersRound}
          iconClass="bg-primary/10 text-primary"
        />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 h-9 text-xs rounded-xl"
            placeholder="Search by creator name, Instagram handle, or order #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex rounded-xl border bg-muted/30 p-1">
          {(
            [
              { id: "ALL", label: "All" },
              { id: "PENDING", label: `Pending (${metrics.pendingCount})` },
              { id: "APPROVED", label: "Approved" },
              { id: "PAID", label: "Paid" },
              { id: "REVERSED", label: "Reversed" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setStatusFilter(t.id)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
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
        <table className="w-full min-w-[820px] text-left text-xs">
          <thead className="border-y bg-muted/40 text-muted-foreground font-semibold">
            <tr>
              <th className="px-5 py-3.5">Influencer</th>
              <th className="px-5 py-3.5">Shopify Order</th>
              <th className="px-5 py-3.5">Deal Type</th>
              <th className="px-5 py-3.5">Order GMV</th>
              <th className="px-5 py-3.5">Rate</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Commission</th>
              <th className="px-5 py-3.5 text-right pr-6">Quick Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {query.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td colSpan={8} className="px-5 py-4">
                    <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                  </td>
                </tr>
              ))
            ) : commissions.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">
                  No commission records found. Orders driven by creator affiliate links or promo codes will appear here automatically.
                </td>
              </tr>
            ) : (
              commissions.map((comm) => (
                <tr key={comm.id} className="hover:bg-muted/15 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <CreatorAvatar name={comm.creator?.name ?? "Creator"} />
                      <div>
                        <p className="font-bold text-foreground text-xs">{comm.creator?.name ?? "Store Partner"}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
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
                    {comm.orderName}
                    <p className="text-[11px] font-normal text-muted-foreground">
                      {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(comm.createdAt))}
                    </p>
                  </td>

                  <td className="px-5 py-3.5">
                    <Badge variant="outline" className={`text-[10px] font-bold ${comm.creatorMode === "HYBRID" ? "bg-indigo-500/10 text-indigo-600 border-indigo-300" : "bg-emerald-500/10 text-emerald-600 border-emerald-300"}`}>
                      {comm.creatorMode === "HYBRID" ? "⚡ Hybrid" : "💵 Commission"}
                    </Badge>
                  </td>

                  <td className="px-5 py-3.5 font-bold font-mono text-foreground">{formatCurrency(comm.orderAmount)}</td>
                  <td className="px-5 py-3.5 text-muted-foreground font-semibold">{comm.commissionRate}%</td>
                  <td className="px-5 py-3.5">
                    <Badge
                      className={
                        comm.status === "PAID"
                          ? "bg-teal/15 text-teal border-teal/30 font-bold"
                          : comm.status === "APPROVED"
                          ? "bg-emerald-600 text-white font-bold"
                          : comm.status === "REVERSED"
                          ? "bg-muted text-muted-foreground"
                          : "border-amber-500/40 bg-amber-500/10 text-amber-600 font-bold"
                      }
                    >
                      {comm.status}
                    </Badge>
                  </td>

                  <td className="px-5 py-3.5 text-right font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(comm.amount)}
                  </td>

                  <td className="px-5 py-3.5 text-right pr-6">
                    <div className="flex justify-end gap-1.5">
                      {comm.status === "PENDING" ? (
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg"
                          disabled={updateMutation.isPending}
                          onClick={() => updateMutation.mutate({ id: comm.id, status: "APPROVED" })}
                        >
                          Approve
                        </Button>
                      ) : null}

                      {comm.status === "APPROVED" ? (
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-teal hover:bg-teal/90 text-teal-foreground font-bold rounded-lg"
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
                          className="h-7 text-xs text-muted-foreground hover:text-destructive rounded-lg"
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
