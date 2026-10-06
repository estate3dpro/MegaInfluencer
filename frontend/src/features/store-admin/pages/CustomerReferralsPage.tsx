import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Gift,
  Users2,
  ShoppingCart,
  DollarSign,
  MousePointerClick,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Check,
  Search,
  SlidersHorizontal,
  ExternalLink,
  Sparkles,
  Coins,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Percent,
  Wallet,
  Store,
  RefreshCw,
  Eye,
  AlertCircle,
  Save,
  QrCode,
  Share2,
  Plus,
  Edit2,
  Trash2,
  Tag,
  ToggleLeft,
  ToggleRight,
  Trophy,
  Award,
  Crown,
  Medal,
  Calendar,
  Flame,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import {
  customerReferralsApi,
  type CustomerAdvocate,
  type CustomerReferralOrder,
  type CustomerClaim,
  type CustomerReferralOffer,
  type StoreRewardItem,
  type StoreReferralMilestone,
  type CustomerLeaderboardItem,
} from "../api/customer-referrals.api";
import { referralSettingsApi, type StoreReferralConfig } from "../api/referral-settings.api";

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const number = new Intl.NumberFormat("en-IN");

type TabType = "overview" | "offers" | "advocates" | "orders" | "leaderboard" | "milestones" | "rewards" | "settings";

export function CustomerReferralsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [rewardsSubTab, setRewardsSubTab] = useState<"catalog" | "claims">("catalog");
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedAdvocate, setSelectedAdvocate] = useState<CustomerAdvocate | null>(null);

  // Search and filter states
  const [advocateSearch, setAdvocateSearch] = useState("");
  const [advocateTierFilter, setAdvocateTierFilter] = useState("ALL");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("ALL");
  const [orderSearch, setOrderSearch] = useState("");
  const [claimStatusFilter, setClaimStatusFilter] = useState<string>("ALL");
  const [offerSearch, setOfferSearch] = useState("");
  const [offerStatusFilter, setOfferStatusFilter] = useState("ALL");
  const [rewardSearch, setRewardSearch] = useState("");
  const [rewardTypeFilter, setRewardTypeFilter] = useState("ALL");
  const [rewardStatusFilter, setRewardStatusFilter] = useState("ALL");
  const [leaderboardTimeframe, setLeaderboardTimeframe] = useState<"THIS_MONTH" | "ALL_TIME">("THIS_MONTH");
  const [milestoneStatusFilter, setMilestoneStatusFilter] = useState("ALL");

  // Offer Modal State
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [offerForm, setOfferForm] = useState<Partial<CustomerReferralOffer>>({
    title: "",
    description: "",
    rewardMode: "POINTS",
    advocateRewardRate: 10,
    friendDiscountType: "PERCENTAGE",
    friendDiscountValue: 10,
    status: "ACTIVE",
    isFeatured: false,
    badgeText: "",
    bannerText: "",
  });

  // Reward Modal State
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [rewardForm, setRewardForm] = useState<Partial<StoreRewardItem>>({
    title: "",
    description: "",
    type: "DISCOUNT_CODE",
    pointsCost: 500,
    rewardValue: 500,
    category: "VOUCHER",
    badge: "POPULAR",
    icon: "Gift",
    codeTemplate: "",
    couponCode: "",
    productName: "",
    productLink: "",
    stockQuantity: null,
    status: "ACTIVE",
    minTier: null,
  });

  // Milestone Modal State
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [milestoneForm, setMilestoneForm] = useState<Partial<StoreReferralMilestone>>({
    title: "",
    description: "",
    targetType: "REFERRAL_COUNT",
    targetValue: 5,
    rewardType: "POINTS",
    pointsBonus: 500,
    rewardValue: 500,
    badgeText: "BRONZE MILESTONE",
    icon: "Users",
    status: "ACTIVE",
  });

  // Queries
  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ["store-customer-referrals-overview"],
    queryFn: customerReferralsApi.getOverview,
  });

  const { data: offersData, isLoading: offersLoading } = useQuery({
    queryKey: ["store-customer-referrals-offers"],
    queryFn: customerReferralsApi.getOffers,
  });

  const { data: rewardsData, isLoading: rewardsLoading } = useQuery({
    queryKey: ["store-customer-referrals-rewards"],
    queryFn: customerReferralsApi.getRewards,
  });

  const { data: advocatesData, isLoading: advocatesLoading } = useQuery({
    queryKey: ["store-customer-referrals-advocates"],
    queryFn: customerReferralsApi.getAdvocates,
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["store-customer-referrals-orders", orderStatusFilter],
    queryFn: () => customerReferralsApi.getOrders(orderStatusFilter),
  });

  const { data: claimsData, isLoading: claimsLoading } = useQuery({
    queryKey: ["store-customer-referrals-claims"],
    queryFn: customerReferralsApi.getClaims,
  });

  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery({
    queryKey: ["store-customer-referrals-leaderboard", leaderboardTimeframe],
    queryFn: () => customerReferralsApi.getLeaderboard(leaderboardTimeframe),
  });

  const { data: milestonesData, isLoading: milestonesLoading } = useQuery({
    queryKey: ["store-customer-referrals-milestones"],
    queryFn: customerReferralsApi.getMilestones,
  });

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ["store-referral-settings"],
    queryFn: referralSettingsApi.getSettings,
  });

  // Settings local form state
  const [configForm, setConfigForm] = useState<Partial<StoreReferralConfig>>({});
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  React.useEffect(() => {
    if (settingsData?.config && !isFormInitialized) {
      setConfigForm(settingsData.config);
      setIsFormInitialized(true);
    }
  }, [settingsData, isFormInitialized]);

  // Mutations
  const createOfferMutation = useMutation({
    mutationFn: customerReferralsApi.createOffer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-customer-referrals-offers"] });
      queryClient.invalidateQueries({ queryKey: ["store-customer-referrals-overview"] });
      toast.success("New referral offer created successfully!");
      setIsOfferModalOpen(false);
      resetOfferForm();
    },
    onError: () => {
      toast.error("Failed to create offer.");
    },
  });

  const updateOfferMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CustomerReferralOffer> }) =>
      customerReferralsApi.updateOffer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-customer-referrals-offers"] });
      queryClient.invalidateQueries({ queryKey: ["store-customer-referrals-overview"] });
      toast.success("Referral offer updated!");
      setIsOfferModalOpen(false);
      resetOfferForm();
    },
    onError: () => {
      toast.error("Failed to update offer.");
    },
  });

  const deleteOfferMutation = useMutation({
    mutationFn: customerReferralsApi.deleteOffer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-customer-referrals-offers"] });
      toast.success("Offer deleted.");
    },
    onError: () => {
      toast.error("Failed to delete offer.");
    },
  });

  const createRewardMutation = useMutation({
    mutationFn: customerReferralsApi.createReward,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-customer-referrals-rewards"] });
      toast.success("New reward item created successfully!");
      setIsRewardModalOpen(false);
      resetRewardForm();
    },
    onError: () => {
      toast.error("Failed to create reward item.");
    },
  });

  const updateRewardMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StoreRewardItem> }) =>
      customerReferralsApi.updateReward(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-customer-referrals-rewards"] });
      toast.success("Reward item updated successfully!");
      setIsRewardModalOpen(false);
      resetRewardForm();
    },
    onError: () => {
      toast.error("Failed to update reward item.");
    },
  });

  const deleteRewardMutation = useMutation({
    mutationFn: customerReferralsApi.deleteReward,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-customer-referrals-rewards"] });
      toast.success("Reward item deleted.");
    },
    onError: () => {
      toast.error("Failed to delete reward item.");
    },
  });

  const createMilestoneMutation = useMutation({
    mutationFn: customerReferralsApi.createMilestone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-customer-referrals-milestones"] });
      toast.success("Referral milestone created successfully!");
      setIsMilestoneModalOpen(false);
      resetMilestoneForm();
    },
    onError: () => {
      toast.error("Failed to create milestone.");
    },
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StoreReferralMilestone> }) =>
      customerReferralsApi.updateMilestone(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-customer-referrals-milestones"] });
      toast.success("Referral milestone updated!");
      setIsMilestoneModalOpen(false);
      resetMilestoneForm();
    },
    onError: () => {
      toast.error("Failed to update milestone.");
    },
  });

  const deleteMilestoneMutation = useMutation({
    mutationFn: customerReferralsApi.deleteMilestone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-customer-referrals-milestones"] });
      toast.success("Milestone deleted.");
    },
    onError: () => {
      toast.error("Failed to delete milestone.");
    },
  });

  const resetMilestoneForm = () => {
    setEditingMilestoneId(null);
    setMilestoneForm({
      title: "",
      description: "",
      targetType: "REFERRAL_COUNT",
      targetValue: 5,
      rewardType: "POINTS",
      pointsBonus: 500,
      rewardValue: 500,
      badgeText: "BRONZE MILESTONE",
      icon: "Users",
      status: "ACTIVE",
    });
  };

  const openCreateMilestoneModal = () => {
    resetMilestoneForm();
    setIsMilestoneModalOpen(true);
  };

  const openEditMilestoneModal = (milestone: StoreReferralMilestone) => {
    setEditingMilestoneId(milestone.id);
    setMilestoneForm({
      title: milestone.title,
      description: milestone.description || "",
      targetType: milestone.targetType,
      targetValue: milestone.targetValue,
      rewardType: milestone.rewardType,
      pointsBonus: milestone.pointsBonus,
      rewardValue: milestone.rewardValue,
      badgeText: milestone.badgeText || "",
      icon: milestone.icon || "Users",
      status: milestone.status,
    });
    setIsMilestoneModalOpen(true);
  };

  const handleSaveMilestone = () => {
    if (!milestoneForm.title?.trim()) {
      toast.error("Please provide a milestone title.");
      return;
    }

    if (editingMilestoneId) {
      updateMilestoneMutation.mutate({ id: editingMilestoneId, data: milestoneForm });
    } else {
      createMilestoneMutation.mutate(milestoneForm);
    }
  };

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "APPROVED" | "REJECTED" | "PAID" | "PENDING" }) =>
      customerReferralsApi.updateOrderStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["store-customer-referrals-orders"] });
      queryClient.invalidateQueries({ queryKey: ["store-customer-referrals-overview"] });
      queryClient.invalidateQueries({ queryKey: ["store-customer-referrals-advocates"] });
      if (variables.status === "APPROVED") {
        toast.success("Order commission approved! Points/earnings credited to advocate.");
      } else if (variables.status === "PAID") {
        toast.success("Order commission marked as paid.");
      } else if (variables.status === "REJECTED") {
        toast.error("Order commission rejected.");
      }
    },
    onError: () => {
      toast.error("Failed to update order status.");
    },
  });

  const updateClaimStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "COMPLETED" | "REJECTED" | "PENDING" }) =>
      customerReferralsApi.updateClaimStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-customer-referrals-claims"] });
      queryClient.invalidateQueries({ queryKey: ["store-customer-referrals-overview"] });
      toast.success("Reward claim status updated successfully.");
    },
    onError: () => {
      toast.error("Failed to update claim status.");
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: referralSettingsApi.updateSettings,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["store-referral-settings"] });
      queryClient.invalidateQueries({ queryKey: ["store-customer-referrals-overview"] });
      setConfigForm(data.config);
      toast.success("Customer referral program rules saved successfully!");
    },
    onError: () => {
      toast.error("Failed to save program rules.");
    },
  });

  const resetOfferForm = () => {
    setEditingOfferId(null);
    setOfferForm({
      title: "",
      description: "",
      rewardMode: "POINTS",
      advocateRewardRate: 10,
      friendDiscountType: "PERCENTAGE",
      friendDiscountValue: 10,
      status: "ACTIVE",
      isFeatured: false,
      badgeText: "",
      bannerText: "",
    });
  };

  const resetRewardForm = () => {
    setEditingRewardId(null);
    setRewardForm({
      title: "",
      description: "",
      type: "DISCOUNT_CODE",
      pointsCost: 500,
      rewardValue: 500,
      category: "VOUCHER",
      badge: "POPULAR",
      icon: "Gift",
      codeTemplate: "",
      couponCode: "",
      productName: "",
      productLink: "",
      stockQuantity: null,
      status: "ACTIVE",
      minTier: null,
    });
  };

  const openCreateOfferModal = () => {
    resetOfferForm();
    setIsOfferModalOpen(true);
  };

  const openEditOfferModal = (offer: CustomerReferralOffer) => {
    setEditingOfferId(offer.id);
    setOfferForm({
      title: offer.title,
      description: offer.description || "",
      rewardMode: offer.rewardMode,
      advocateRewardRate: offer.advocateRewardRate,
      friendDiscountType: offer.friendDiscountType,
      friendDiscountValue: offer.friendDiscountValue,
      status: offer.status,
      isFeatured: offer.isFeatured,
      badgeText: offer.badgeText || "",
      bannerText: offer.bannerText || "",
    });
    setIsOfferModalOpen(true);
  };

  const openCreateRewardModal = () => {
    resetRewardForm();
    setIsRewardModalOpen(true);
  };

  const openEditRewardModal = (reward: StoreRewardItem) => {
    setEditingRewardId(reward.id);
    setRewardForm({
      title: reward.title,
      description: reward.description || "",
      type: reward.type,
      pointsCost: reward.pointsCost,
      rewardValue: reward.rewardValue,
      category: reward.category,
      badge: reward.badge || "",
      icon: reward.icon || "Gift",
      codeTemplate: reward.codeTemplate || "",
      couponCode: reward.couponCode || "",
      productName: reward.productName || "",
      productLink: reward.productLink || "",
      stockQuantity: reward.stockQuantity,
      status: reward.status,
      minTier: reward.minTier,
    });
    setIsRewardModalOpen(true);
  };

  const handleSaveReward = () => {
    if (!rewardForm.title?.trim()) {
      toast.error("Please provide a reward title.");
      return;
    }

    if (editingRewardId) {
      updateRewardMutation.mutate({ id: editingRewardId, data: rewardForm });
    } else {
      createRewardMutation.mutate(rewardForm);
    }
  };

  const handleSaveOffer = () => {
    if (!offerForm.title?.trim()) {
      toast.error("Please provide an offer title.");
      return;
    }

    if (editingOfferId) {
      updateOfferMutation.mutate({ id: editingOfferId, data: offerForm });
    } else {
      createOfferMutation.mutate(offerForm);
    }
  };

  const metrics = overviewData?.metrics || {
    totalAdvocates: 0,
    totalSales: 0,
    totalOrders: 0,
    totalClicks: 0,
    conversionRate: 0,
    pendingOrdersCount: 0,
    pendingPayoutsCount: 0,
    totalPaidRewards: 0,
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Filtered Offers
  const allOffers = offersData?.offers || [];
  const filteredOffers = allOffers.filter((offer) => {
    const matchesSearch =
      offer.title.toLowerCase().includes(offerSearch.toLowerCase()) ||
      (offer.description && offer.description.toLowerCase().includes(offerSearch.toLowerCase()));
    const matchesStatus = offerStatusFilter === "ALL" || offer.status === offerStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Rewards
  const allRewards = rewardsData?.rewards || [];
  const filteredRewards = allRewards.filter((reward) => {
    const matchesSearch =
      reward.title.toLowerCase().includes(rewardSearch.toLowerCase()) ||
      (reward.description && reward.description.toLowerCase().includes(rewardSearch.toLowerCase()));
    const matchesType = rewardTypeFilter === "ALL" || reward.type === rewardTypeFilter;
    const matchesStatus = rewardStatusFilter === "ALL" || reward.status === rewardStatusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Filtered Advocates
  const filteredAdvocates = (advocatesData?.advocates || []).filter((adv) => {
    const matchesSearch =
      adv.name.toLowerCase().includes(advocateSearch.toLowerCase()) ||
      adv.email.toLowerCase().includes(advocateSearch.toLowerCase()) ||
      adv.creatorCode.toLowerCase().includes(advocateSearch.toLowerCase());
    const matchesTier = advocateTierFilter === "ALL" || adv.tier === advocateTierFilter;
    return matchesSearch && matchesTier;
  });

  // Filtered Orders
  const filteredOrders = (ordersData?.orders || []).filter((order) => {
    const matchesSearch =
      order.orderName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.advocateName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.advocateCode.toLowerCase().includes(orderSearch.toLowerCase());
    return matchesSearch;
  });

  // Filtered Claims
  const allClaims = claimsData?.claims || [];
  const filteredClaims = allClaims.filter((claim) => {
    if (claimStatusFilter === "ALL") return true;
    return claim.status === claimStatusFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Page Header */}
      <PageHeader
        title="Customer Referrals & Advocate Management"
        description="Grow word-of-mouth sales by letting shoppers refer friends for points, cash commissions, or store discount vouchers."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const customerPortalUrl = "http://localhost:5174";
                window.open(customerPortalUrl, "_blank");
              }}
            >
              <ExternalLink className="h-4 w-4 mr-1.5" /> Customer Portal
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openCreateMilestoneModal}
            >
              <Award className="h-4 w-4 mr-1.5" /> Create Milestone
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openCreateRewardModal}
            >
              <Gift className="h-4 w-4 mr-1.5" /> Create Reward
            </Button>
            <Button
              size="sm"
              onClick={openCreateOfferModal}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Create Referral Offer
            </Button>
          </div>
        }
      />

      {/* 2. Top Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-3">
        <Button
          variant={activeTab === "overview" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("overview")}
          className="rounded-lg text-xs"
        >
          <TrendingUp className="h-4 w-4 mr-1.5" /> Overview
        </Button>

        <Button
          variant={activeTab === "offers" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("offers")}
          className="rounded-lg text-xs"
        >
          <Tag className="h-4 w-4 mr-1.5" /> Referral Offers List
          <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
            {allOffers.length}
          </Badge>
        </Button>

        <Button
          variant={activeTab === "advocates" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("advocates")}
          className="rounded-lg text-xs"
        >
          <Users2 className="h-4 w-4 mr-1.5" /> Advocates Directory
          <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
            {metrics.totalAdvocates}
          </Badge>
        </Button>

        <Button
          variant={activeTab === "orders" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("orders")}
          className="rounded-lg text-xs"
        >
          <ShoppingCart className="h-4 w-4 mr-1.5" /> Referral Orders
          {metrics.pendingOrdersCount > 0 ? (
            <Badge className="ml-1.5 bg-amber-500 text-white text-[10px] px-1.5 py-0">
              {metrics.pendingOrdersCount} pending
            </Badge>
          ) : (
            <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
              {metrics.totalOrders}
            </Badge>
          )}
        </Button>

        <Button
          variant={activeTab === "leaderboard" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("leaderboard")}
          className="rounded-lg text-xs"
        >
          <Trophy className="h-4 w-4 mr-1.5" /> Leaderboard
          <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
            Top {leaderboardData?.leaderboard?.length || 0}
          </Badge>
        </Button>

        <Button
          variant={activeTab === "milestones" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("milestones")}
          className="rounded-lg text-xs"
        >
          <Award className="h-4 w-4 mr-1.5" /> Milestone Rewards
          <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
            {milestonesData?.milestones?.length || 0}
          </Badge>
        </Button>

        <Button
          variant={activeTab === "rewards" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("rewards")}
          className="rounded-lg text-xs"
        >
          <Gift className="h-4 w-4 mr-1.5" /> Rewards & Claims
          {allClaims.filter((c) => c.status === "PENDING").length > 0 ? (
            <Badge className="ml-1.5 bg-coral text-white text-[10px] px-1.5 py-0">
              {allClaims.filter((c) => c.status === "PENDING").length} pending
            </Badge>
          ) : (
            <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
              {allRewards.length}
            </Badge>
          )}
        </Button>

        <Button
          variant={activeTab === "settings" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("settings")}
          className="rounded-lg text-xs"
        >
          <SlidersHorizontal className="h-4 w-4 mr-1.5" /> Program Rules & UI
        </Button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: OVERVIEW */}
      {/* ========================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Active Referral Hero Card */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-indigo/5 shadow-card">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary font-semibold text-xs">
                      {allOffers.filter((o) => o.status === "ACTIVE").length} Active Referral Offers
                    </Badge>
                    <span className="text-xs text-muted-foreground">• {overviewData?.store?.name}</span>
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    {overviewData?.config?.programTitle || "Customer Advocate & Referral Rewards"}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Shoppers give their friends{" "}
                    <span className="font-semibold text-coral">
                      {overviewData?.config?.friendDiscountValue || 10}% OFF
                    </span>{" "}
                    and earn{" "}
                    <span className="font-semibold text-primary">
                      {overviewData?.config?.commissionRate || 10}% {overviewData?.config?.rewardMode === "CASHBACK_COMMISSION" ? "cash commissions" : "rewards"}
                    </span>{" "}
                    on every approved purchase.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("offers")}
                    className="w-full sm:w-auto"
                  >
                    <Tag className="h-4 w-4 mr-1.5" /> Manage Offers ({allOffers.length})
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setActiveTab("orders")}
                    className="w-full sm:w-auto"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" /> Review Pending Orders
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics Grid */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Active Advocates"
              value={number.format(metrics.totalAdvocates)}
              hint="Registered customer referrers"
              icon={Users2}
              accent="primary"
            />
            <StatCard
              label="Attributed Revenue"
              value={money.format(metrics.totalSales)}
              hint={`${metrics.totalOrders} referred orders`}
              icon={DollarSign}
              accent="teal"
            />
            <StatCard
              label="Link Clicks & Traffic"
              value={number.format(metrics.totalClicks)}
              hint={`${metrics.conversionRate}% conversion rate`}
              icon={MousePointerClick}
              accent="indigo"
            />
            <StatCard
              label="Rewards / Commissions"
              value={money.format(metrics.totalPaidRewards)}
              hint={`${metrics.pendingOrdersCount} orders waiting approval`}
              icon={Wallet}
              accent="coral"
            />
          </section>

          {/* 2-Column: Recent Orders Approval & Top Advocates */}
          <section className="grid gap-6 xl:grid-cols-3">
            {/* Recent Orders Queue */}
            <Card className="shadow-card xl:col-span-2">
              <CardHeader className="flex-row items-center justify-between space-y-0 p-5 pb-3">
                <div>
                  <CardTitle>Recent Referral Orders</CardTitle>
                  <CardDescription>Customer purchases waiting for validation & reward approval</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab("orders")}>
                  View all <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 p-5 pt-1">
                {(overviewData?.recentOrders || []).length === 0 ? (
                  <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                    No referral orders placed yet. As customers share their links, orders will appear here for approval.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {overviewData?.recentOrders.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border bg-card hover:bg-muted/30 transition-colors gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-teal/10 text-teal flex items-center justify-center shrink-0 font-bold">
                            <ShoppingCart className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-foreground">{item.orderName}</div>
                            <div className="text-xs text-muted-foreground">
                              Advocate: <span className="font-medium text-foreground">{item.advocateName}</span> ({item.advocateCode}) • {item.customerMasked}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-xs font-semibold text-primary">
                              +{money.format(item.rewardAmount)}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              Order: {money.format(item.orderAmount)}
                            </div>
                          </div>

                          {item.status === "PENDING" ? (
                            <div className="flex items-center gap-1.5">
                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => updateOrderStatusMutation.mutate({ id: item.id, status: "APPROVED" })}
                                disabled={updateOrderStatusMutation.isPending}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-destructive hover:bg-destructive/10"
                                onClick={() => updateOrderStatusMutation.mutate({ id: item.id, status: "REJECTED" })}
                                disabled={updateOrderStatusMutation.isPending}
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <Badge
                              variant={item.status === "APPROVED" || item.status === "PAID" ? "default" : "secondary"}
                              className="text-[10px]"
                            >
                              {item.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Advocates Snapshot */}
            <Card className="shadow-card">
              <CardHeader className="flex-row items-center justify-between space-y-0 p-5 pb-3">
                <div>
                  <CardTitle>Top Advocates</CardTitle>
                  <CardDescription>Highest revenue customer referrers</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab("advocates")}>
                  View all <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 p-5 pt-1">
                {(overviewData?.topAdvocates || []).length === 0 ? (
                  <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
                    No advocates recorded yet.
                  </div>
                ) : (
                  overviewData?.topAdvocates.map((adv) => (
                    <div
                      key={adv.id}
                      className="flex items-center justify-between p-3 rounded-xl border bg-muted/20"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                            {initials(adv.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs truncate">{adv.name}</p>
                          <p className="text-[11px] text-muted-foreground font-mono truncate">
                            #{adv.creatorCode} • {adv.orders} orders
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-semibold text-foreground">
                          {money.format(adv.sales)}
                        </div>
                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                          {adv.tier}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: REFERRAL OFFERS LIST & MANAGEMENT */}
      {/* ========================================================= */}
      {activeTab === "offers" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search referral offers…"
                value={offerSearch}
                onChange={(e) => setOfferSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <Select value={offerStatusFilter} onValueChange={setOfferStatusFilter}>
                <SelectTrigger className="h-9 text-xs w-36">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active Only</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                </SelectContent>
              </Select>

              <Button size="sm" onClick={openCreateOfferModal} className="h-9 text-xs">
                <Plus className="h-4 w-4 mr-1.5" /> New Offer
              </Button>
            </div>
          </div>

          <Card className="shadow-card">
            <CardContent className="p-0">
              {filteredOffers.length === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground space-y-3">
                  <Tag className="h-10 w-10 text-muted-foreground mx-auto" />
                  <div className="font-semibold text-foreground">No referral offers found</div>
                  <p className="text-xs">Create multiple promotional referral offers with custom discount rates and reward rules for your shoppers.</p>
                  <Button size="sm" onClick={openCreateOfferModal}>
                    <Plus className="h-4 w-4 mr-1.5" /> Create First Offer
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b bg-muted/40 text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">Offer Title & Details</th>
                        <th className="py-3 px-4">Reward Mode</th>
                        <th className="py-3 px-4">Friend Discount</th>
                        <th className="py-3 px-4">Advocate Reward</th>
                        <th className="py-3 px-4">Usage & Sales</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredOffers.map((offer) => (
                        <tr key={offer.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground text-sm">{offer.title}</span>
                              {offer.isFeatured && (
                                <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] px-1.5 py-0">
                                  Featured
                                </Badge>
                              )}
                            </div>
                            {offer.description && (
                              <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{offer.description}</p>
                            )}
                            {offer.badgeText && (
                              <Badge variant="outline" className="text-[9px] mt-1">
                                {offer.badgeText}
                              </Badge>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-medium">
                            <Badge variant="secondary" className="text-[10px]">
                              {offer.rewardMode}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-coral text-xs">
                              {offer.friendDiscountValue}
                              {offer.friendDiscountType === "PERCENTAGE" ? "% OFF" : " ₹ OFF"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-primary text-xs">
                              {offer.advocateRewardRate}%{" "}
                              {offer.rewardMode === "CASHBACK_COMMISSION"
                                ? "Cash"
                                : offer.rewardMode === "POINTS"
                                ? "Points"
                                : "Rewards"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-foreground">{money.format(offer.totalSales || 0)}</div>
                            <div className="text-[10px] text-muted-foreground">{offer.usageCount || 0} orders</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={offer.status === "ACTIVE" ? "default" : "secondary"}
                                className={offer.status === "ACTIVE" ? "bg-emerald-600 text-white text-[10px]" : "text-[10px]"}
                              >
                                {offer.status}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                onClick={() =>
                                  updateOfferMutation.mutate({
                                    id: offer.id,
                                    data: { status: offer.status === "ACTIVE" ? "PAUSED" : "ACTIVE" },
                                  })
                                }
                                title={offer.status === "ACTIVE" ? "Pause Offer" : "Activate Offer"}
                              >
                                {offer.status === "ACTIVE" ? (
                                  <ToggleRight className="h-4 w-4 text-emerald-600" />
                                ) : (
                                  <ToggleLeft className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => openEditOfferModal(offer)}
                              >
                                <Edit2 className="h-3 w-3 mr-1" /> Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this referral offer?")) {
                                    deleteOfferMutation.mutate(offer.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: ADVOCATES DIRECTORY */}
      {/* ========================================================= */}
      {activeTab === "advocates" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search advocate by name, email, or code…"
                value={advocateSearch}
                onChange={(e) => setAdvocateSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <Select value={advocateTierFilter} onValueChange={setAdvocateTierFilter}>
                <SelectTrigger className="h-9 text-xs w-36">
                  <SelectValue placeholder="All Tiers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All VIP Tiers</SelectItem>
                  <SelectItem value="BRONZE">Bronze</SelectItem>
                  <SelectItem value="SILVER">Silver</SelectItem>
                  <SelectItem value="GOLD">Gold</SelectItem>
                  <SelectItem value="PLATINUM">Platinum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="shadow-card">
            <CardContent className="p-0">
              {filteredAdvocates.length === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground space-y-2">
                  <Users2 className="h-10 w-10 text-muted-foreground mx-auto" />
                  <div className="font-semibold text-foreground">No customer advocates found</div>
                  <p className="text-xs">Customers who create referral links or share codes will appear in this directory.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b bg-muted/40 text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">Advocate</th>
                        <th className="py-3 px-4">Referral Code / Slug</th>
                        <th className="py-3 px-4">Clicks</th>
                        <th className="py-3 px-4">Orders</th>
                        <th className="py-3 px-4">Attributed Sales</th>
                        <th className="py-3 px-4">Reward Balance</th>
                        <th className="py-3 px-4">VIP Tier</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredAdvocates.map((adv) => (
                        <tr key={adv.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                                  {initials(adv.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold text-foreground">{adv.name}</div>
                                <div className="text-[11px] text-muted-foreground">{adv.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-mono text-xs font-semibold text-primary">#{adv.creatorCode}</div>
                            {adv.linkSlug && (
                              <div className="text-[10px] text-muted-foreground font-mono">/r/{adv.linkSlug}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-medium">{number.format(adv.clicks)}</td>
                          <td className="py-3.5 px-4 font-mono font-medium">{number.format(adv.orders)}</td>
                          <td className="py-3.5 px-4 font-semibold text-foreground">{money.format(adv.sales)}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-primary">{adv.pointsBalance} pts</div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              Total: {money.format(adv.totalEarned)}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant="outline" className="font-semibold text-[10px]">
                              {adv.tier}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => setSelectedAdvocate(adv)}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> View Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: REFERRAL ORDERS & APPROVALS */}
      {/* ========================================================= */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search orders, customers, advocates…"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {(["ALL", "PENDING", "APPROVED", "PAID", "REJECTED"] as const).map((st) => (
                <Button
                  key={st}
                  variant={orderStatusFilter === st ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOrderStatusFilter(st)}
                  className="h-8 text-xs"
                >
                  {st === "ALL" ? "All Orders" : st}
                  {st === "PENDING" && metrics.pendingOrdersCount > 0 && (
                    <Badge className="ml-1.5 bg-amber-500 text-white text-[9px] px-1 py-0">
                      {metrics.pendingOrdersCount}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          <Card className="shadow-card">
            <CardContent className="p-0">
              {filteredOrders.length === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground space-y-2">
                  <ShoppingCart className="h-10 w-10 text-muted-foreground mx-auto" />
                  <div className="font-semibold text-foreground">No referral orders found</div>
                  <p className="text-xs">When customers purchase using advocate links or promo codes, they will appear here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b bg-muted/40 text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">Order / ID</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Advocate Referrer</th>
                        <th className="py-3 px-4">Order Total</th>
                        <th className="py-3 px-4">Advocate Commission</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-right">Approval Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-foreground">{order.orderName}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">{order.orderId}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-mono text-muted-foreground">{order.customerMasked}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-foreground">{order.advocateName}</div>
                            <div className="text-[10px] text-primary font-mono">#{order.advocateCode}</div>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-foreground">
                            {money.format(order.orderAmount)}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-primary">+{money.format(order.rewardAmount)}</div>
                            <div className="text-[10px] text-muted-foreground">{order.commissionRate}% reward</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge
                              variant={order.status === "APPROVED" || order.status === "PAID" ? "default" : "secondary"}
                              className="text-[10px]"
                            >
                              {order.status}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-muted-foreground">
                            {new Date(order.date).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {order.status === "PENDING" ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                  onClick={() => updateOrderStatusMutation.mutate({ id: order.id, status: "APPROVED" })}
                                  disabled={updateOrderStatusMutation.isPending}
                                >
                                  <Check className="h-3.5 w-3.5 mr-1" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs text-destructive hover:bg-destructive/10"
                                  onClick={() => updateOrderStatusMutation.mutate({ id: order.id, status: "REJECTED" })}
                                  disabled={updateOrderStatusMutation.isPending}
                                >
                                  <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                                </Button>
                              </div>
                            ) : order.status === "APPROVED" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-teal hover:bg-teal/10"
                                onClick={() => updateOrderStatusMutation.mutate({ id: order.id, status: "PAID" })}
                                disabled={updateOrderStatusMutation.isPending}
                              >
                                Mark Paid
                              </Button>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: LEADERBOARD */}
      {/* ========================================================= */}
      {activeTab === "leaderboard" && (
        <div className="space-y-6">
          {/* Header & Timeframe Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20 p-4 rounded-2xl border">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                <h3 className="font-bold text-base text-foreground">Advocate Rankings & Top Performers</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time leaderboard of customer advocates ranked by referred order volume & GMV sales.
              </p>
            </div>

            <div className="flex items-center rounded-xl bg-background p-1 border shadow-sm">
              <button
                onClick={() => setLeaderboardTimeframe("THIS_MONTH")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  leaderboardTimeframe === "THIS_MONTH"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>This Month</span>
              </button>
              <button
                onClick={() => setLeaderboardTimeframe("ALL_TIME")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  leaderboardTimeframe === "ALL_TIME"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Flame className="h-3.5 w-3.5 text-amber-400" />
                <span>All Time</span>
              </button>
            </div>
          </div>

          {/* Podium Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-2">
            {/* 2nd Place */}
            {leaderboardData?.podium?.[1] ? (
              <Card className="border-border shadow-card p-5 flex flex-col items-center text-center">
                <div className="relative mb-3">
                  <Avatar className="h-16 w-16 border-2 border-slate-400 shadow-md">
                    {leaderboardData.podium[1].avatarUrl && <AvatarImage src={leaderboardData.podium[1].avatarUrl} />}
                    <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-base">
                      {initials(leaderboardData.podium[1].fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-400 text-slate-900 font-bold text-xs shadow">
                    2
                  </div>
                </div>
                <div className="font-bold text-sm text-foreground">{leaderboardData.podium[1].name}</div>
                <div className="text-xs text-muted-foreground font-mono">#{leaderboardData.podium[1].creatorCode}</div>
                <div className="grid grid-cols-2 gap-2 w-full mt-3 pt-3 border-t text-center">
                  <div className="bg-muted/40 p-2 rounded-lg">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Orders</span>
                    <span className="text-xs font-bold">{leaderboardData.podium[1].totalReferrals}</span>
                  </div>
                  <div className="bg-muted/40 p-2 rounded-lg">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Sales GMV</span>
                    <span className="text-xs font-bold">{money.format(leaderboardData.podium[1].totalSales)}</span>
                  </div>
                </div>
                <Badge className="mt-3 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px]">
                  🥈 {leaderboardData.podium[1].prize || "+₹1,000 Bonus Perk"}
                </Badge>
              </Card>
            ) : (
              <div className="p-8 border border-dashed rounded-2xl text-center text-xs text-muted-foreground">
                Rank #2 Spot Open
              </div>
            )}

            {/* 1st Place (Champion) */}
            {leaderboardData?.podium?.[0] ? (
              <Card className="border-amber-400/80 bg-gradient-to-b from-amber-500/10 via-card to-card shadow-lg p-6 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-2 right-2 text-amber-500">
                  <Crown className="h-5 w-5 fill-amber-500" />
                </div>
                <div className="relative mb-3">
                  <Avatar className="h-20 w-20 border-4 border-amber-400 shadow-xl">
                    {leaderboardData.podium[0].avatarUrl && <AvatarImage src={leaderboardData.podium[0].avatarUrl} />}
                    <AvatarFallback className="bg-amber-500 text-white font-black text-xl">
                      {initials(leaderboardData.podium[0].fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white font-black text-xs shadow-md border-2 border-background">
                    1
                  </div>
                </div>
                <div className="font-bold text-base text-foreground">{leaderboardData.podium[0].name}</div>
                <div className="text-xs text-muted-foreground font-mono">#{leaderboardData.podium[0].creatorCode}</div>
                <div className="grid grid-cols-2 gap-2 w-full mt-3 pt-3 border-t text-center">
                  <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold block">Orders</span>
                    <span className="text-sm font-bold">{leaderboardData.podium[0].totalReferrals}</span>
                  </div>
                  <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold block">Sales GMV</span>
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{money.format(leaderboardData.podium[0].totalSales)}</span>
                  </div>
                </div>
                <Badge className="mt-3 bg-amber-500 text-white text-xs font-bold">
                  👑 {leaderboardData.podium[0].prize || "+₹2,500 Champion Bonus"}
                </Badge>
              </Card>
            ) : (
              <div className="p-8 border border-dashed rounded-2xl text-center text-xs text-muted-foreground">
                Rank #1 Champion Spot Open
              </div>
            )}

            {/* 3rd Place */}
            {leaderboardData?.podium?.[2] ? (
              <Card className="border-border shadow-card p-5 flex flex-col items-center text-center">
                <div className="relative mb-3">
                  <Avatar className="h-16 w-16 border-2 border-amber-700 shadow-md">
                    {leaderboardData.podium[2].avatarUrl && <AvatarImage src={leaderboardData.podium[2].avatarUrl} />}
                    <AvatarFallback className="bg-amber-800/20 text-amber-800 dark:text-amber-200 font-bold text-base">
                      {initials(leaderboardData.podium[2].fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-700 text-amber-100 font-bold text-xs shadow">
                    3
                  </div>
                </div>
                <div className="font-bold text-sm text-foreground">{leaderboardData.podium[2].name}</div>
                <div className="text-xs text-muted-foreground font-mono">#{leaderboardData.podium[2].creatorCode}</div>
                <div className="grid grid-cols-2 gap-2 w-full mt-3 pt-3 border-t text-center">
                  <div className="bg-muted/40 p-2 rounded-lg">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Orders</span>
                    <span className="text-xs font-bold">{leaderboardData.podium[2].totalReferrals}</span>
                  </div>
                  <div className="bg-muted/40 p-2 rounded-lg">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Sales GMV</span>
                    <span className="text-xs font-bold">{money.format(leaderboardData.podium[2].totalSales)}</span>
                  </div>
                </div>
                <Badge className="mt-3 bg-amber-800/20 text-amber-800 dark:text-amber-300 text-[10px]">
                  🥉 {leaderboardData.podium[2].prize || "+₹500 Bonus Perk"}
                </Badge>
              </Card>
            ) : (
              <div className="p-8 border border-dashed rounded-2xl text-center text-xs text-muted-foreground">
                Rank #3 Spot Open
              </div>
            )}
          </div>

          {/* Full Leaderboard Table */}
          <Card className="shadow-card">
            <CardHeader className="p-5 pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Full Advocate Rankings</CardTitle>
                  <CardDescription>Live revenue rankings with assigned monthly reward drop bonuses</CardDescription>
                </div>
                <div className="text-xs text-muted-foreground">
                  Showing {leaderboardData?.leaderboard?.length || 0} participants
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] font-semibold border-b">
                    <tr>
                      <th className="py-3 px-4 text-center w-16">Rank</th>
                      <th className="py-3 px-4">Advocate</th>
                      <th className="py-3 px-4 text-center">VIP Tier</th>
                      <th className="py-3 px-4 text-right">Referral Orders</th>
                      <th className="py-3 px-4 text-right">Sales Volume</th>
                      <th className="py-3 px-4 text-right">Rewards Earned</th>
                      <th className="py-3 px-4 text-center">Perk Drop</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(leaderboardData?.leaderboard || []).map((adv) => (
                      <tr key={adv.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4 text-center font-bold">
                          {adv.rank === 1 ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white text-xs">
                              1
                            </span>
                          ) : adv.rank === 2 ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-400 text-white text-xs">
                              2
                            </span>
                          ) : adv.rank === 3 ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-700 text-white text-xs">
                              3
                            </span>
                          ) : (
                            <span className="text-muted-foreground font-mono">#{adv.rank}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-7 w-7">
                              {adv.avatarUrl && <AvatarImage src={adv.avatarUrl} />}
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                                {initials(adv.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold text-foreground">{adv.name}</div>
                              <div className="text-[10px] text-muted-foreground font-mono">#{adv.creatorCode}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Badge variant="outline" className="text-[9px] uppercase">
                            {adv.tier}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium">{adv.totalReferrals}</td>
                        <td className="py-3.5 px-4 text-right font-semibold text-foreground">
                          {money.format(adv.totalSales)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                          {money.format(adv.totalEarned)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {adv.prize ? (
                            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              {adv.prize}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: REFERRAL MILESTONES MANAGEMENT */}
      {/* ========================================================= */}
      {activeTab === "milestones" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-foreground">Referral Milestone Roadmap</h3>
              <p className="text-xs text-muted-foreground">
                Create structured progressive goals (e.g. 1st order win, 5 referrals, ₹25k volume) that award instant bonuses.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Select value={milestoneStatusFilter} onValueChange={setMilestoneStatusFilter}>
                <SelectTrigger className="h-9 text-xs w-36">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Milestones</SelectItem>
                  <SelectItem value="ACTIVE">Active Only</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                </SelectContent>
              </Select>

              <Button size="sm" onClick={openCreateMilestoneModal} className="h-9 text-xs">
                <Plus className="h-4 w-4 mr-1.5" /> New Milestone
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(milestonesData?.milestones || [])
              .filter((m) => milestoneStatusFilter === "ALL" || m.status === milestoneStatusFilter)
              .map((m) => (
                <Card
                  key={m.id}
                  className={`relative overflow-hidden transition-all shadow-card ${
                    m.status === "ACTIVE" ? "border-primary/20 hover:border-primary/50" : "opacity-60 border-dashed"
                  }`}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">
                          {m.targetType === "SALES_AMOUNT" ? (
                            <DollarSign className="h-4 w-4" />
                          ) : (
                            <Users2 className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                            {m.title}
                          </div>
                          {m.badgeText && (
                            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {m.badgeText}
                            </span>
                          )}
                        </div>
                      </div>

                      <Badge
                        variant={m.status === "ACTIVE" ? "default" : "secondary"}
                        className={m.status === "ACTIVE" ? "bg-emerald-600 text-white text-[9px]" : "text-[9px]"}
                      >
                        {m.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-2 space-y-3">
                    {m.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{m.description}</p>
                    )}

                    <div className="p-2.5 rounded-xl bg-muted/30 border space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Target Qualification:</span>
                        <span className="font-bold text-foreground">
                          {m.targetType === "REFERRAL_COUNT"
                            ? `${m.targetValue} referral orders`
                            : money.format(m.targetValue)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Points Reward Perk:</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          +{m.pointsBonus.toLocaleString()} pts
                        </span>
                      </div>
                      {m.rewardType === "CASH_PAYOUT" && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Cash Value:</span>
                          <span className="font-bold text-emerald-500">{money.format(m.rewardValue)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() =>
                          updateMilestoneMutation.mutate({
                            id: m.id,
                            data: { status: m.status === "ACTIVE" ? "PAUSED" : "ACTIVE" },
                          })
                        }
                      >
                        {m.status === "ACTIVE" ? (
                          <>
                            <ToggleRight className="h-4 w-4 mr-1 text-emerald-600" /> Active
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-4 w-4 mr-1" /> Paused
                          </>
                        )}
                      </Button>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => openEditMilestoneModal(m)}
                        >
                          <Edit2 className="h-3 w-3 mr-1" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this milestone?")) {
                              deleteMilestoneMutation.mutate(m.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

            {(milestonesData?.milestones || []).length === 0 && (
              <div className="col-span-full p-12 text-center border border-dashed rounded-2xl space-y-3">
                <Award className="h-10 w-10 text-muted-foreground mx-auto" />
                <div className="font-semibold text-foreground">No referral milestones created</div>
                <p className="text-xs text-muted-foreground">
                  Set up milestone goals to motivate advocates to refer more shoppers.
                </p>
                <Button size="sm" onClick={openCreateMilestoneModal}>
                  <Plus className="h-4 w-4 mr-1.5" /> Create First Milestone
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 7: REWARDS MANAGEMENT & CLAIMS */}
      {/* ========================================================= */}
      {activeTab === "rewards" && (
        <div className="space-y-4">
          {/* Sub Navigation Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20 p-3 rounded-xl border">
            <div className="flex items-center gap-2">
              <Button
                variant={rewardsSubTab === "catalog" ? "default" : "outline"}
                size="sm"
                onClick={() => setRewardsSubTab("catalog")}
                className="h-8 text-xs font-semibold"
              >
                <Gift className="h-3.5 w-3.5 mr-1.5" /> Rewards Catalog
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                  {allRewards.length}
                </Badge>
              </Button>
              <Button
                variant={rewardsSubTab === "claims" ? "default" : "outline"}
                size="sm"
                onClick={() => setRewardsSubTab("claims")}
                className="h-8 text-xs font-semibold"
              >
                <Wallet className="h-3.5 w-3.5 mr-1.5" /> Redemption Claims Queue
                {allClaims.filter((c) => c.status === "PENDING").length > 0 ? (
                  <Badge className="ml-1.5 bg-coral text-white text-[10px] px-1.5 py-0">
                    {allClaims.filter((c) => c.status === "PENDING").length}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                    {allClaims.length}
                  </Badge>
                )}
              </Button>
            </div>

            {rewardsSubTab === "catalog" && (
              <Button size="sm" onClick={openCreateRewardModal} className="h-8 text-xs">
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Create Reward Item
              </Button>
            )}
          </div>

          {/* Sub-tab 1: Rewards Catalog */}
          {rewardsSubTab === "catalog" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative max-w-sm flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search rewards by name or description…"
                    value={rewardSearch}
                    onChange={(e) => setRewardSearch(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Select value={rewardTypeFilter} onValueChange={setRewardTypeFilter}>
                    <SelectTrigger className="h-9 text-xs w-40">
                      <SelectValue placeholder="All Reward Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Types</SelectItem>
                      <SelectItem value="DISCOUNT_CODE">Discount Code</SelectItem>
                      <SelectItem value="GIFT_CARD">Store Gift Card</SelectItem>
                      <SelectItem value="CASH_PAYOUT">Cash Payout / UPI</SelectItem>
                      <SelectItem value="STORE_CREDIT">Store Credit</SelectItem>
                      <SelectItem value="PRODUCT_GIFT">Product Gift / Perk</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={rewardStatusFilter} onValueChange={setRewardStatusFilter}>
                    <SelectTrigger className="h-9 text-xs w-32">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="PAUSED">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Card className="shadow-card">
                <CardContent className="p-0">
                  {filteredRewards.length === 0 ? (
                    <div className="p-12 text-center text-sm text-muted-foreground space-y-3">
                      <Gift className="h-10 w-10 text-muted-foreground mx-auto" />
                      <div className="font-semibold text-foreground">No rewards found</div>
                      <p className="text-xs">Create discount vouchers, store credit, gift cards, or cash rewards for advocates to redeem with their points.</p>
                      <Button size="sm" onClick={openCreateRewardModal}>
                        <Plus className="h-4 w-4 mr-1.5" /> Create First Reward
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b bg-muted/40 text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
                            <th className="py-3 px-4">Reward Item</th>
                            <th className="py-3 px-4">Reward Type</th>
                            <th className="py-3 px-4">Points Cost</th>
                            <th className="py-3 px-4">Monetary Value</th>
                            <th className="py-3 px-4">Min Tier</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {filteredRewards.map((reward) => (
                            <tr key={reward.id} className="hover:bg-muted/30 transition-colors">
                              <td className="py-3.5 px-4 max-w-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-foreground text-sm">{reward.title}</span>
                                  {reward.badge && (
                                    <Badge variant="secondary" className="bg-primary/10 text-primary text-[9px] px-1.5 py-0 uppercase">
                                      {reward.badge}
                                    </Badge>
                                  )}
                                </div>
                                {reward.description && (
                                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{reward.description}</p>
                                )}
                                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                  {reward.couponCode && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                      <Tag className="h-2.5 w-2.5" />
                                      {reward.couponCode}
                                    </span>
                                  )}
                                  {reward.productLink && (
                                    <a
                                      href={reward.productLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[10px] text-teal hover:underline bg-teal/10 px-1.5 py-0.5 rounded"
                                    >
                                      <ExternalLink className="h-2.5 w-2.5" />
                                      {reward.productName || "Product Link"}
                                    </a>
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <Badge variant="outline" className="text-[10px]">
                                  {reward.type}
                                </Badge>
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold text-primary">
                                {reward.pointsCost} pts
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-foreground">
                                {reward.type === "DISCOUNT_CODE" && reward.rewardValue <= 100
                                  ? `${reward.rewardValue}% OFF`
                                  : money.format(reward.rewardValue)}
                              </td>
                              <td className="py-3.5 px-4">
                                <Badge variant="secondary" className="text-[10px]">
                                  {reward.minTier || "ALL TIERS"}
                                </Badge>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={reward.status === "ACTIVE" ? "default" : "secondary"}
                                    className={reward.status === "ACTIVE" ? "bg-emerald-600 text-white text-[10px]" : "text-[10px]"}
                                  >
                                    {reward.status}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                    onClick={() =>
                                      updateRewardMutation.mutate({
                                        id: reward.id,
                                        data: { status: reward.status === "ACTIVE" ? "PAUSED" : "ACTIVE" },
                                      })
                                    }
                                    title={reward.status === "ACTIVE" ? "Pause Reward" : "Activate Reward"}
                                  >
                                    {reward.status === "ACTIVE" ? (
                                      <ToggleRight className="h-4 w-4 text-emerald-600" />
                                    ) : (
                                      <ToggleLeft className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => openEditRewardModal(reward)}
                                  >
                                    <Edit2 className="h-3 w-3 mr-1" /> Edit
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                    onClick={() => {
                                      if (confirm("Are you sure you want to delete this reward item?")) {
                                        deleteRewardMutation.mutate(reward.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Sub-tab 2: Redemption Claims Queue */}
          {rewardsSubTab === "claims" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  Review and fulfill customer reward redemptions, coupon claims, and UPI cash payouts.
                </div>

                <div className="flex items-center gap-1.5">
                  {(["ALL", "PENDING", "COMPLETED", "REJECTED"] as const).map((st) => (
                    <Button
                      key={st}
                      variant={claimStatusFilter === st ? "default" : "outline"}
                      size="sm"
                      onClick={() => setClaimStatusFilter(st)}
                      className="h-8 text-xs"
                    >
                      {st === "ALL" ? "All Claims" : st}
                    </Button>
                  ))}
                </div>
              </div>

              <Card className="shadow-card">
                <CardContent className="p-0">
                  {filteredClaims.length === 0 ? (
                    <div className="p-12 text-center text-sm text-muted-foreground space-y-2">
                      <Wallet className="h-10 w-10 text-muted-foreground mx-auto" />
                      <div className="font-semibold text-foreground">No reward claims found</div>
                      <p className="text-xs">When advocates submit reward redemptions or cash withdrawal requests, they will show up here.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b bg-muted/40 text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
                            <th className="py-3 px-4">Advocate</th>
                            <th className="py-3 px-4">Reward / Type</th>
                            <th className="py-3 px-4">Value</th>
                            <th className="py-3 px-4">Points Cost</th>
                            <th className="py-3 px-4">Payout Account / Code</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {filteredClaims.map((claim) => (
                            <tr key={claim.id} className="hover:bg-muted/30 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="font-semibold text-foreground">{claim.advocateName}</div>
                                <div className="text-[11px] text-muted-foreground">{claim.advocateEmail}</div>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-semibold text-foreground">{claim.rewardTitle}</div>
                                <Badge variant="outline" className="text-[9px] uppercase mt-0.5">
                                  {claim.rewardType}
                                </Badge>
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-primary">
                                {money.format(claim.rewardValue)}
                              </td>
                              <td className="py-3.5 px-4 font-mono font-medium">
                                {claim.pointsCost > 0 ? `${claim.pointsCost} pts` : "Cash Wallet"}
                              </td>
                              <td className="py-3.5 px-4 font-mono text-xs">
                                {claim.code || (claim.details?.payoutAccount ? `UPI: ${claim.details.payoutAccount}` : "Auto Generated")}
                              </td>
                              <td className="py-3.5 px-4">
                                <Badge
                                  variant={claim.status === "COMPLETED" ? "default" : "secondary"}
                                  className={claim.status === "COMPLETED" ? "bg-emerald-600 text-white text-[10px]" : "text-[10px]"}
                                >
                                  {claim.status}
                                </Badge>
                              </td>
                              <td className="py-3.5 px-4 text-muted-foreground">
                                {new Date(claim.createdAt).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                {claim.status === "PENDING" ? (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <Button
                                      size="sm"
                                      className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                      onClick={() => updateClaimStatusMutation.mutate({ id: claim.id, status: "COMPLETED" })}
                                      disabled={updateClaimStatusMutation.isPending}
                                    >
                                      Process & Complete
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs text-destructive hover:bg-destructive/10"
                                      onClick={() => updateClaimStatusMutation.mutate({ id: claim.id, status: "REJECTED" })}
                                      disabled={updateClaimStatusMutation.isPending}
                                    >
                                      Reject
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-xs">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: PROGRAM RULES & UI CONTROLS */}
      {/* ========================================================= */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <Card className="shadow-card">
            <CardHeader className="p-6 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Program Engine & UI Visibility Settings</CardTitle>
                  <CardDescription>
                    Control baseline reward values, welcome bonuses, payout thresholds, and choose which pages appear on the customer portal.
                  </CardDescription>
                </div>

                <Button
                  onClick={() => saveSettingsMutation.mutate(configForm)}
                  disabled={saveSettingsMutation.isPending}
                  className="shrink-0"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveSettingsMutation.isPending ? "Saving Settings…" : "Save Program Rules"}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6 pt-2 space-y-8">
              {/* 1. Rates & Values */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="welcomeBonus" className="text-xs font-semibold">
                    Welcome Bonus Points
                  </Label>
                  <Input
                    id="welcomeBonus"
                    type="number"
                    min={0}
                    value={configForm.welcomeBonusPoints ?? 100}
                    onChange={(e) => setConfigForm((p) => ({ ...p, welcomeBonusPoints: Number(e.target.value) }))}
                  />
                  <p className="text-[11px] text-muted-foreground">Free starting points upon signup.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pointsPerCurrency" className="text-xs font-semibold">
                    Points per ₹1 Spent
                  </Label>
                  <Input
                    id="pointsPerCurrency"
                    type="number"
                    min={1}
                    value={configForm.pointsPerCurrency ?? 1}
                    onChange={(e) => setConfigForm((p) => ({ ...p, pointsPerCurrency: Number(e.target.value) }))}
                  />
                  <p className="text-[11px] text-muted-foreground">Points multiplier on order volume.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minPayout" className="text-xs font-semibold">
                    Min Payout Threshold (₹)
                  </Label>
                  <Input
                    id="minPayout"
                    type="number"
                    min={50}
                    value={configForm.minPayoutAmount ?? 500}
                    onChange={(e) => setConfigForm((p) => ({ ...p, minPayoutAmount: Number(e.target.value) }))}
                  />
                  <p className="text-[11px] text-muted-foreground">Minimum balance needed for cash payout.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="programTitle" className="text-xs font-semibold">
                    Program Title
                  </Label>
                  <Input
                    id="programTitle"
                    value={configForm.programTitle ?? ""}
                    onChange={(e) => setConfigForm((p) => ({ ...p, programTitle: e.target.value }))}
                    placeholder="Customer Advocate Program"
                  />
                  <p className="text-[11px] text-muted-foreground">Title displayed in customer portal.</p>
                </div>
              </div>

              {/* 2. Customer Portal UI Visibility Switches */}
              <div className="space-y-3 pt-4 border-t">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Customer Portal Component Visibility</h4>
                  <p className="text-xs text-muted-foreground">
                    Customize which sections and navigation tabs customer advocates see.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-semibold">VIP Tier Roadmap</Label>
                      <p className="text-[11px] text-muted-foreground">
                        Show Bronze/Silver/Gold/Platinum progression bar and perks.
                      </p>
                    </div>
                    <Switch
                      checked={configForm.showTierRoadmap ?? true}
                      onCheckedChange={(checked) => setConfigForm((p) => ({ ...p, showTierRoadmap: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-semibold">Performance Trends Chart</Label>
                      <p className="text-[11px] text-muted-foreground">
                        Show monthly earnings & click traffic area charts.
                      </p>
                    </div>
                    <Switch
                      checked={configForm.showPerformanceCharts ?? true}
                      onCheckedChange={(checked) => setConfigForm((p) => ({ ...p, showPerformanceCharts: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-semibold">Rewards Store & Catalog</Label>
                      <p className="text-[11px] text-muted-foreground">
                        Allow advocates to browse reward vouchers & claims tab.
                      </p>
                    </div>
                    <Switch
                      checked={configForm.showRewardsStore ?? true}
                      onCheckedChange={(checked) => setConfigForm((p) => ({ ...p, showRewardsStore: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/20">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-semibold">Recent Friend Purchases Stream</Label>
                      <p className="text-[11px] text-muted-foreground">
                        Show live attributed orders placed by friends on dashboard.
                      </p>
                    </div>
                    <Switch
                      checked={configForm.showRecentPurchases ?? true}
                      onCheckedChange={(checked) => setConfigForm((p) => ({ ...p, showRecentPurchases: checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* 3. Branding & Custom Messaging */}
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Program Branding & Share Templates</h4>
                  <p className="text-xs text-muted-foreground">
                    Define the heading and default WhatsApp / social sharing message for customers.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="customShareMessage" className="text-xs font-semibold">
                      WhatsApp / Social Share Message Template
                    </Label>
                    <Input
                      id="customShareMessage"
                      value={configForm.customShareMessage ?? ""}
                      onChange={(e) => setConfigForm((p) => ({ ...p, customShareMessage: e.target.value }))}
                      placeholder="Get {friendDiscount} with my link {shareUrl} or code {code}!"
                    />
                    <p className="text-[10px] text-muted-foreground font-mono">
                      Variables: {"{friendDiscount}"}, {"{storeName}"}, {"{shareUrl}"}, {"{code}"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create / Edit Offer Dialog */}
      <Dialog open={isOfferModalOpen} onOpenChange={setIsOfferModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingOfferId ? "Edit Referral Offer" : "Create New Referral Offer"}</DialogTitle>
            <DialogDescription>
              Create a targeted referral campaign with custom friend discounts and advocate commissions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="offerTitle" className="text-xs font-semibold">
                Offer Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="offerTitle"
                placeholder="e.g. Summer Special 15% OFF Referral"
                value={offerForm.title || ""}
                onChange={(e) => setOfferForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="offerDesc" className="text-xs font-semibold">
                Description / Pitch
              </Label>
              <Textarea
                id="offerDesc"
                rows={2}
                placeholder="Share your link with friends to give them 15% off and get 10% in cash rewards."
                value={offerForm.description || ""}
                onChange={(e) => setOfferForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Reward Mechanism</Label>
                <Select
                  value={offerForm.rewardMode || "POINTS"}
                  onValueChange={(val: any) => setOfferForm((prev) => ({ ...prev, rewardMode: val }))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="POINTS">Points & Loyalty</SelectItem>
                    <SelectItem value="CASHBACK_COMMISSION">Cash Commission</SelectItem>
                    <SelectItem value="DISCOUNT_ONLY">Store Discounts Only</SelectItem>
                    <SelectItem value="HYBRID">Hybrid (Points + Cash)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Badge Highlight (Optional)</Label>
                <Input
                  placeholder="e.g. Limited Time Offer"
                  value={offerForm.badgeText || ""}
                  onChange={(e) => setOfferForm((prev) => ({ ...prev, badgeText: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/20 border">
              <div className="space-y-1.5">
                <Label htmlFor="friendDiscountVal" className="text-xs font-semibold">
                  Friend Discount (%)
                </Label>
                <div className="relative">
                  <Input
                    id="friendDiscountVal"
                    type="number"
                    min={1}
                    max={100}
                    value={offerForm.friendDiscountValue ?? 10}
                    onChange={(e) => setOfferForm((prev) => ({ ...prev, friendDiscountValue: Number(e.target.value) }))}
                    className="h-9 text-xs pr-7"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="advocateRateVal" className="text-xs font-semibold">
                  Advocate Reward (%)
                </Label>
                <div className="relative">
                  <Input
                    id="advocateRateVal"
                    type="number"
                    min={1}
                    max={100}
                    value={offerForm.advocateRewardRate ?? 10}
                    onChange={(e) => setOfferForm((prev) => ({ ...prev, advocateRewardRate: Number(e.target.value) }))}
                    className="h-9 text-xs pr-7"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold">Feature on Customer Carousel</Label>
                <p className="text-[11px] text-muted-foreground">Prioritize this offer slide in customer dashboards.</p>
              </div>
              <Switch
                checked={offerForm.isFeatured ?? false}
                onCheckedChange={(checked) => setOfferForm((prev) => ({ ...prev, isFeatured: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsOfferModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveOffer}
              disabled={createOfferMutation.isPending || updateOfferMutation.isPending}
            >
              {editingOfferId ? "Update Offer" : "Create Offer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Advocate Details Dialog */}
      <Dialog open={!!selectedAdvocate} onOpenChange={(open) => !open && setSelectedAdvocate(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Advocate Profile</DialogTitle>
            <DialogDescription>Performance breakdown and details for this customer referrer.</DialogDescription>
          </DialogHeader>
          {selectedAdvocate && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {initials(selectedAdvocate.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-sm">{selectedAdvocate.name}</div>
                  <div className="text-xs text-muted-foreground">{selectedAdvocate.email}</div>
                  <Badge variant="outline" className="mt-1 text-[10px]">
                    {selectedAdvocate.tier} TIER
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border bg-card">
                  <div className="text-muted-foreground">Promo Code</div>
                  <div className="font-mono font-bold text-primary text-sm mt-0.5">#{selectedAdvocate.creatorCode}</div>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <div className="text-muted-foreground">Total Attributed Sales</div>
                  <div className="font-bold text-foreground text-sm mt-0.5">{money.format(selectedAdvocate.sales)}</div>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <div className="text-muted-foreground">Referred Orders</div>
                  <div className="font-bold text-foreground text-sm mt-0.5">{selectedAdvocate.orders}</div>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <div className="text-muted-foreground">Reward Balance</div>
                  <div className="font-bold text-primary text-sm mt-0.5">{selectedAdvocate.pointsBalance} pts</div>
                </div>
              </div>

              {selectedAdvocate.linkSlug && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Referral Link</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={`http://localhost:5173/r/${selectedAdvocate.linkSlug}`}
                      className="font-mono text-xs bg-muted/50"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(`http://localhost:5173/r/${selectedAdvocate.linkSlug}`)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create / Edit Reward Dialog */}
      <Dialog open={isRewardModalOpen} onOpenChange={setIsRewardModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRewardId ? "Edit Reward Item" : "Create New Reward Item"}</DialogTitle>
            <DialogDescription>
              Configure reward perks that customer advocates can redeem using their earned loyalty points.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="rewardTitle" className="text-xs font-semibold">
                Reward Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="rewardTitle"
                placeholder="e.g. ₹500 Store Gift Card or 15% Off Coupon"
                value={rewardForm.title || ""}
                onChange={(e) => setRewardForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rewardDesc" className="text-xs font-semibold">
                Description / Details
              </Label>
              <Textarea
                id="rewardDesc"
                rows={2}
                placeholder="Redeem your referral points for an instant store shopping gift card."
                value={rewardForm.description || ""}
                onChange={(e) => setRewardForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Reward Type</Label>
                <Select
                  value={rewardForm.type || "DISCOUNT_CODE"}
                  onValueChange={(val: any) => setRewardForm((prev) => ({ ...prev, type: val }))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DISCOUNT_CODE">Discount Coupon Code</SelectItem>
                    <SelectItem value="PRODUCT_LINK">Assigned Product / Item Link</SelectItem>
                    <SelectItem value="GIFT_CARD">Store Gift Card</SelectItem>
                    <SelectItem value="CASH_PAYOUT">Cash Payout / UPI</SelectItem>
                    <SelectItem value="STORE_CREDIT">Store Credit</SelectItem>
                    <SelectItem value="PRODUCT_GIFT">Mystery Box / Gift Perk</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Badge Highlight</Label>
                <Input
                  placeholder="e.g. POPULAR, HOT, VIP"
                  value={rewardForm.badge || ""}
                  onChange={(e) => setRewardForm((prev) => ({ ...prev, badge: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Promo / Coupon Code Assignment */}
            <div className="space-y-1.5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-amber-500" />
                <Label htmlFor="couponCodeInput" className="text-xs font-semibold text-foreground">
                  Assigned Discount Coupon Code (Optional)
                </Label>
              </div>
              <Input
                id="couponCodeInput"
                placeholder="e.g. SAVE20, VIP500, FREESHIP"
                value={rewardForm.couponCode || ""}
                onChange={(e) => setRewardForm((prev) => ({ ...prev, couponCode: e.target.value.toUpperCase() }))}
                className="h-9 text-xs font-mono font-bold tracking-wider"
              />
              <p className="text-[11px] text-muted-foreground">
                Revealed with a celebratory unlock animation when the customer advocate purchases this reward with points.
              </p>
            </div>

            {/* Product Item / Direct Link Assignment */}
            <div className="space-y-2.5 p-3 rounded-xl bg-teal/5 border border-teal/20">
              <div className="flex items-center gap-1.5">
                <ExternalLink className="h-3.5 w-3.5 text-teal" />
                <Label className="text-xs font-semibold text-foreground">
                  Assigned Store Product / Destination Link (Optional)
                </Label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label htmlFor="prodNameInput" className="text-[11px] font-medium text-muted-foreground">
                    Product Title
                  </Label>
                  <Input
                    id="prodNameInput"
                    placeholder="e.g. Wireless Noise Canceling Headphones"
                    value={rewardForm.productName || ""}
                    onChange={(e) => setRewardForm((prev) => ({ ...prev, productName: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="prodLinkInput" className="text-[11px] font-medium text-muted-foreground">
                    Store Product URL / Redeem Link
                  </Label>
                  <Input
                    id="prodLinkInput"
                    placeholder="https://yourstore.com/products/headphones"
                    value={rewardForm.productLink || ""}
                    onChange={(e) => setRewardForm((prev) => ({ ...prev, productLink: e.target.value }))}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Gives the customer an instant clickable button to visit and claim this product after unlocking the reward.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/20 border">
              <div className="space-y-1.5">
                <Label htmlFor="pointsCostVal" className="text-xs font-semibold">
                  Points Cost (Pts)
                </Label>
                <Input
                  id="pointsCostVal"
                  type="number"
                  min={10}
                  value={rewardForm.pointsCost ?? 500}
                  onChange={(e) => setRewardForm((prev) => ({ ...prev, pointsCost: Number(e.target.value) }))}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rewardValAmount" className="text-xs font-semibold">
                  Reward Value (₹ or %)
                </Label>
                <Input
                  id="rewardValAmount"
                  type="number"
                  min={1}
                  value={rewardForm.rewardValue ?? 500}
                  onChange={(e) => setRewardForm((prev) => ({ ...prev, rewardValue: Number(e.target.value) }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Minimum VIP Tier Required</Label>
                <Select
                  value={rewardForm.minTier || "ALL"}
                  onValueChange={(val: any) => setRewardForm((prev) => ({ ...prev, minTier: val === "ALL" ? null : val }))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Tiers (Bronze+)</SelectItem>
                    <SelectItem value="SILVER">Silver and above</SelectItem>
                    <SelectItem value="GOLD">Gold and above</SelectItem>
                    <SelectItem value="PLATINUM">Platinum only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Status</Label>
                <Select
                  value={rewardForm.status || "ACTIVE"}
                  onValueChange={(val: any) => setRewardForm((prev) => ({ ...prev, status: val }))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active in Rewards Vault</SelectItem>
                    <SelectItem value="PAUSED">Paused (Hidden)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsRewardModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveReward}
              disabled={createRewardMutation.isPending || updateRewardMutation.isPending}
            >
              {editingRewardId ? "Update Reward" : "Create Reward"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Milestone Dialog */}
      <Dialog open={isMilestoneModalOpen} onOpenChange={setIsMilestoneModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingMilestoneId ? "Edit Referral Milestone" : "Create Referral Milestone"}</DialogTitle>
            <DialogDescription>
              Set up milestone criteria that automatically awards points or special cash perks to active advocates.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="milestoneTitle" className="text-xs font-semibold">
                Milestone Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="milestoneTitle"
                placeholder="e.g. 5 Friends Referred or ₹25,000 Sales Volume Milestone"
                value={milestoneForm.title || ""}
                onChange={(e) => setMilestoneForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="milestoneDesc" className="text-xs font-semibold">
                Description / Details
              </Label>
              <Textarea
                id="milestoneDesc"
                rows={2}
                placeholder="Successfully refer 5 shopping friends to unlock massive bonus points."
                value={milestoneForm.description || ""}
                onChange={(e) => setMilestoneForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Target Criteria Type</Label>
                <Select
                  value={milestoneForm.targetType || "REFERRAL_COUNT"}
                  onValueChange={(val: any) => setMilestoneForm((prev) => ({ ...prev, targetType: val }))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REFERRAL_COUNT">Referral Orders Count</SelectItem>
                    <SelectItem value="SALES_AMOUNT">Total Sales Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="targetValNum" className="text-xs font-semibold">
                  Target Value Goal
                </Label>
                <Input
                  id="targetValNum"
                  type="number"
                  min={1}
                  placeholder={milestoneForm.targetType === "REFERRAL_COUNT" ? "5 (orders)" : "25000 (₹)"}
                  value={milestoneForm.targetValue ?? 5}
                  onChange={(e) => setMilestoneForm((prev) => ({ ...prev, targetValue: Number(e.target.value) }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/20 border">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Reward Perk Type</Label>
                <Select
                  value={milestoneForm.rewardType || "POINTS"}
                  onValueChange={(val: any) => setMilestoneForm((prev) => ({ ...prev, rewardType: val }))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="POINTS">Bonus Points Only</SelectItem>
                    <SelectItem value="CASH_PAYOUT">Cash Payout + Points</SelectItem>
                    <SelectItem value="GIFT_CARD">Store Gift Card</SelectItem>
                    <SelectItem value="PRODUCT_GIFT">Exclusive Product Hamper</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bonusPtsNum" className="text-xs font-semibold">
                  Bonus Points Awarded
                </Label>
                <Input
                  id="bonusPtsNum"
                  type="number"
                  min={0}
                  value={milestoneForm.pointsBonus ?? 500}
                  onChange={(e) => setMilestoneForm((prev) => ({ ...prev, pointsBonus: Number(e.target.value) }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Badge Highlight</Label>
                <Input
                  placeholder="e.g. BRONZE MILESTONE, DIAMOND CLUB"
                  value={milestoneForm.badgeText || ""}
                  onChange={(e) => setMilestoneForm((prev) => ({ ...prev, badgeText: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Status</Label>
                <Select
                  value={milestoneForm.status || "ACTIVE"}
                  onValueChange={(val: any) => setMilestoneForm((prev) => ({ ...prev, status: val }))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active Milestone</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsMilestoneModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveMilestone}
              disabled={createMilestoneMutation.isPending || updateMilestoneMutation.isPending}
            >
              {editingMilestoneId ? "Update Milestone" : "Create Milestone"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
