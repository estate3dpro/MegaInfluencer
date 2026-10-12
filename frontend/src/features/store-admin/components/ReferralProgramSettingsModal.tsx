import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BadgeIndianRupee,
  Coins,
  Gift,
  Layers,
  Percent,
  Sliders,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Eye,
  CheckCircle2,
  Calculator,
  ShoppingBag,
  Zap,
  Wallet,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  getStoreReferralSettings,
  updateStoreReferralSettings,
  type ReferralRewardMode,
  type MultiProductCommissionMode,
  type StoreReferralConfig,
} from "../api/referral-settings.api";
import {
  getCreatorSettings,
  updateCreatorSettings,
} from "../api/creators.api";

interface ReferralProgramSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReferralProgramSettingsModal: React.FC<ReferralProgramSettingsModalProps> = ({
  open,
  onOpenChange,
}) => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["store", "referral-settings"],
    queryFn: getStoreReferralSettings,
    enabled: open,
  });

  const { data: creatorSettings } = useQuery({
    queryKey: ["store", "creators", "settings"],
    queryFn: getCreatorSettings,
    enabled: open,
  });

  // Master Program Switch
  const [isEnabled, setIsEnabled] = useState<boolean>(true);

  // Auto-Approve Influencers Switch
  const [autoApproveInfluencers, setAutoApproveInfluencers] = useState<boolean>(true);

  // 1. Commission Model: Flat Rate in Rupees vs Percentage vs Both
  const [commissionType, setCommissionType] = useState<"FLAT_RUPEES" | "PERCENTAGE" | "BOTH">("FLAT_RUPEES");
  const [flatCommissionAmount, setFlatCommissionAmount] = useState<number>(100);
  const [commissionRate, setCommissionRate] = useState<number>(10);

  // 2. Reward Mode (Cash vs Points Store vs Coupons vs Hybrid)
  const [rewardMode, setRewardMode] = useState<ReferralRewardMode>("CASHBACK_COMMISSION");
  const [pointsPerCurrency, setPointsPerCurrency] = useState<number>(1);

  // 3. Friend Discount Incentive
  const [friendDiscountEnabled, setFriendDiscountEnabled] = useState<boolean>(true);
  const [friendDiscountType, setFriendDiscountType] = useState<"PERCENTAGE" | "FIXED" | "FREE_SHIPPING">("PERCENTAGE");
  const [friendDiscountValue, setFriendDiscountValue] = useState<number>(10);

  // 4. Welcome / Signup Bonus
  const [welcomeBonusEnabled, setWelcomeBonusEnabled] = useState<boolean>(true);
  const [welcomeBonusPoints, setWelcomeBonusPoints] = useState<number>(100);

  // Advanced: Multi-Product Cart Policy
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [multiProductCommissionMode, setMultiProductCommissionMode] = useState<MultiProductCommissionMode>("STORE_WIDE");
  const [fallbackCommissionRate, setFallbackCommissionRate] = useState<number>(0);
  const [minPayoutAmount, setMinPayoutAmount] = useState<number>(500);

  // Portal Display Controls
  const [showTierRoadmap, setShowTierRoadmap] = useState<boolean>(true);
  const [showPerformanceCharts, setShowPerformanceCharts] = useState<boolean>(true);
  const [showRewardsStore, setShowRewardsStore] = useState<boolean>(true);
  const [showRecentPurchases, setShowRecentPurchases] = useState<boolean>(true);

  // Branding & Messaging
  const [programTitle, setProgramTitle] = useState<string>("");
  const [customShareMessage, setCustomShareMessage] = useState<string>("");

  // Live Calculator Test Order
  const [testOrderAmount, setTestOrderAmount] = useState<number>(1000);

  useEffect(() => {
    if (data?.config) {
      const c = data.config;
      setIsEnabled(c.isEnabled ?? true);

      // Derive clean commission type from config
      const isFlat = Boolean(c.fixedTokensEnabled && !c.percentageEnabled);
      const isBoth = Boolean(c.fixedTokensEnabled && c.percentageEnabled);
      const initialType = c.commissionType || (isFlat ? "FLAT_RUPEES" : isBoth ? "BOTH" : "PERCENTAGE");

      setCommissionType(initialType);
      setFlatCommissionAmount(c.flatCommissionAmount ?? c.fixedTokensPerOrder ?? 100);
      setCommissionRate(c.commissionRate ?? 10);

      setRewardMode(c.rewardMode || "CASHBACK_COMMISSION");
      setPointsPerCurrency(c.pointsPerCurrency ?? 1);

      setMultiProductCommissionMode(c.multiProductCommissionMode || "STORE_WIDE");
      setFallbackCommissionRate(c.fallbackCommissionRate ?? 0);

      setWelcomeBonusEnabled(c.welcomeBonusEnabled ?? true);
      setWelcomeBonusPoints(c.welcomeBonusPoints ?? 100);

      setMinPayoutAmount(c.minPayoutAmount ?? 500);

      setFriendDiscountEnabled(c.friendDiscountEnabled ?? true);
      setFriendDiscountType(c.friendDiscountType || "PERCENTAGE");
      setFriendDiscountValue(c.friendDiscountValue ?? 10);

      setShowTierRoadmap(c.showTierRoadmap ?? true);
      setShowPerformanceCharts(c.showPerformanceCharts ?? true);
      setShowRewardsStore(c.showRewardsStore ?? true);
      setShowRecentPurchases(c.showRecentPurchases ?? true);

      setProgramTitle(c.programTitle || "Customer Advocate & Referral Rewards");
      setCustomShareMessage(c.customShareMessage || "Get 10% off with my link, and support me!");
    }
    if (creatorSettings) {
      setAutoApproveInfluencers(creatorSettings.autoApproveCreators ?? true);
    }
  }, [data, creatorSettings]);

  const mutation = useMutation({
    mutationFn: async (payload: Partial<StoreReferralConfig>) => {
      await updateStoreReferralSettings(payload);
      await updateCreatorSettings(autoApproveInfluencers).catch(() => {});
    },
    onSuccess: () => {
      toast.success("Referral commission rules & program settings saved successfully!");
      void queryClient.invalidateQueries({ queryKey: ["store", "referral-settings"] });
      void queryClient.invalidateQueries({ queryKey: ["store", "creators", "settings"] });
      void queryClient.invalidateQueries({ queryKey: ["store", "creators"] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update referral settings.");
    },
  });

  const handleSave = () => {
    const isFlat = commissionType === "FLAT_RUPEES";
    const isBoth = commissionType === "BOTH";
    const isPerc = commissionType === "PERCENTAGE";

    mutation.mutate({
      isEnabled,
      rewardMode,
      commissionType,
      flatCommissionAmount: Number(flatCommissionAmount),
      percentageEnabled: isPerc || isBoth,
      commissionRate: Number(commissionRate),
      fixedTokensEnabled: isFlat || isBoth,
      fixedTokensPerOrder: Math.round(Number(flatCommissionAmount)),
      multiProductCommissionMode,
      fallbackCommissionRate: Number(fallbackCommissionRate),
      pointsPerCurrency: Number(pointsPerCurrency),
      welcomeBonusEnabled,
      welcomeBonusPoints: Number(welcomeBonusPoints),
      minPayoutAmount: Number(minPayoutAmount),
      friendDiscountEnabled,
      friendDiscountType,
      friendDiscountValue: Number(friendDiscountValue),
      showTierRoadmap,
      showPerformanceCharts,
      showRewardsStore,
      showRecentPurchases,
      programTitle,
      customShareMessage,
    });
  };

  // Live simulation calculation for real-time preview
  const simulation = useMemo(() => {
    if (!isEnabled) {
      return {
        friendDiscountAmt: 0,
        orderPaidByFriend: testOrderAmount,
        advocateEarningsCash: 0,
        advocateEarningsPoints: 0,
        breakdown: "Program is currently paused",
      };
    }

    // 1. Calculate friend discount
    let discount = 0;
    if (friendDiscountEnabled) {
      if (friendDiscountType === "PERCENTAGE") {
        discount = (testOrderAmount * friendDiscountValue) / 100;
      } else if (friendDiscountType === "FIXED") {
        discount = Math.min(friendDiscountValue, testOrderAmount);
      }
    }
    const orderPaid = Math.max(0, testOrderAmount - discount);

    // 2. Calculate advocate commission
    let cashEarned = 0;
    const parts: string[] = [];

    if (commissionType === "FLAT_RUPEES" || commissionType === "BOTH") {
      cashEarned += Number(flatCommissionAmount || 0);
      parts.push(`₹${Number(flatCommissionAmount || 0).toFixed(0)} flat`);
    }

    if (commissionType === "PERCENTAGE" || commissionType === "BOTH") {
      const percEarned = (orderPaid * Number(commissionRate || 0)) / 100;
      cashEarned += percEarned;
      parts.push(`₹${percEarned.toFixed(2)} (${commissionRate}%)`);
    }

    const pointsEarned = Math.round(cashEarned * (pointsPerCurrency || 1));

    return {
      friendDiscountAmt: discount,
      orderPaidByFriend: orderPaid,
      advocateEarningsCash: cashEarned,
      advocateEarningsPoints: pointsEarned,
      breakdown: parts.join(" + ") || "₹0.00",
    };
  }, [
    isEnabled,
    testOrderAmount,
    commissionType,
    flatCommissionAmount,
    commissionRate,
    friendDiscountEnabled,
    friendDiscountType,
    friendDiscountValue,
    pointsPerCurrency,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2.5 text-lg font-bold text-foreground">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <BadgeIndianRupee className="h-5 w-5" />
              </div>
              <span>Referral Program & Commission Settings</span>
            </DialogTitle>
            <Badge
              variant={isEnabled ? "default" : "secondary"}
              className="cursor-pointer text-xs"
              onClick={() => setIsEnabled(!isEnabled)}
            >
              {isEnabled ? "● Program Active" : "○ Program Paused"}
            </Badge>
          </div>
          <DialogDescription>
            Configure how your advocates earn commission and what discounts referred friends receive.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground animate-pulse">
            Loading referral settings...
          </div>
        ) : (
          <div className="space-y-6 py-2">
            {/* ========================================================================= */}
            {/* STEP 1: ADVOCATE COMMISSION MODEL (SIMPLE & INTUITIVE) */}
            {/* ========================================================================= */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <BadgeIndianRupee className="h-4 w-4 text-emerald-600" />
                    <span>How Advocates Earn Commission</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Choose whether advocates earn a flat rupee rate per referral sale or a percentage of the order.
                  </p>
                </div>
                <Badge variant="outline" className="text-xs font-semibold uppercase tracking-wider text-primary border-primary/30">
                  {commissionType === "FLAT_RUPEES"
                    ? "Flat Rate in ₹"
                    : commissionType === "PERCENTAGE"
                    ? "Percentage %"
                    : "Combined ₹ + %"}
                </Badge>
              </div>

              {/* Commission Type Selector Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Option 1: Flat Rate in Rupees */}
                <button
                  type="button"
                  onClick={() => setCommissionType("FLAT_RUPEES")}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    commissionType === "FLAT_RUPEES"
                      ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      <BadgeIndianRupee className="h-4 w-4 text-emerald-600" />
                      Flat Rate (Rupees)
                    </span>
                    {commissionType === "FLAT_RUPEES" && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                    Advocate gets a <strong>fixed rupee amount</strong> (e.g. ₹100) per completed referral order.
                  </p>
                </button>

                {/* Option 2: Percentage of Order */}
                <button
                  type="button"
                  onClick={() => setCommissionType("PERCENTAGE")}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    commissionType === "PERCENTAGE"
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      <Percent className="h-4 w-4 text-primary" />
                      Percentage (%)
                    </span>
                    {commissionType === "PERCENTAGE" && (
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                    Advocate gets a <strong>percentage</strong> (e.g. 10%) of the total order value.
                  </p>
                </button>

                {/* Option 3: Both (Combined) */}
                <button
                  type="button"
                  onClick={() => setCommissionType("BOTH")}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    commissionType === "BOTH"
                      ? "border-indigo bg-indigo/10 shadow-sm"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-indigo" />
                      Combined (₹ + %)
                    </span>
                    {commissionType === "BOTH" && (
                      <CheckCircle2 className="h-4 w-4 text-indigo shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                    Advocate gets a <strong>flat base amount plus a percentage</strong> on every order.
                  </p>
                </button>
              </div>

              {/* Commission Amount Inputs */}
              <div className="pt-2 border-t border-border/60">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Flat Rate Rupee Input */}
                  {(commissionType === "FLAT_RUPEES" || commissionType === "BOTH") && (
                    <div className="space-y-1.5 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                        <span>Flat Commission per Order (₹)</span>
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                          Rupees
                        </Badge>
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-600">
                          ₹
                        </span>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={flatCommissionAmount}
                          onChange={(e) => setFlatCommissionAmount(Number(e.target.value))}
                          placeholder="100"
                          className="pl-8 text-sm font-bold text-foreground h-10"
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Advocate earns <strong>₹{flatCommissionAmount || 0} flat</strong> every time a referred customer buys.
                      </p>
                    </div>
                  )}

                  {/* Percentage Rate Input */}
                  {(commissionType === "PERCENTAGE" || commissionType === "BOTH") && (
                    <div className="space-y-1.5 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                        <span>Commission Percentage (%)</span>
                        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                          Percent
                        </Badge>
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={commissionRate}
                          onChange={(e) => setCommissionRate(Number(e.target.value))}
                          placeholder="10"
                          className="pr-8 text-sm font-bold text-foreground h-10"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-primary">
                          %
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Advocate earns <strong>{commissionRate || 0}%</strong> of the order subtotal.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* STEP 2: REWARD DELIVERY (HOW ADVOCATES RECEIVE EARNINGS) */}
            {/* ========================================================================= */}
            <div className="rounded-xl border border-border p-4 bg-card space-y-3 shadow-sm">
              <div>
                <Label className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  <span>Reward Payout Method</span>
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  How advocates receive and redeem their earned commission.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setRewardMode("CASHBACK_COMMISSION")}
                  className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                    rewardMode === "CASHBACK_COMMISSION"
                      ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                      <BadgeIndianRupee className="h-4 w-4 text-emerald-600" />
                      Direct Cash Payouts
                    </span>
                    {rewardMode === "CASHBACK_COMMISSION" && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Advocates accumulate real cash in their wallet and withdraw directly to UPI or Bank accounts.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRewardMode("POINTS")}
                  className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                    rewardMode === "POINTS"
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                      <Coins className="h-4 w-4 text-primary" />
                      Points & Rewards Store
                    </span>
                    {rewardMode === "POINTS" && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Advocates earn points (₹1 = {pointsPerCurrency || 1} pt) to redeem store discount codes, vouchers & gifts.
                  </p>
                </button>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* STEP 3: FRIEND DISCOUNT INCENTIVE */}
            {/* ========================================================================= */}
            <div className={`rounded-xl border p-4 transition-all ${friendDiscountEnabled ? "border-coral/40 bg-coral/5" : "border-border bg-muted/10 opacity-75"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${friendDiscountEnabled ? "bg-coral/20 text-coral" : "bg-muted text-muted-foreground"}`}>
                    <Gift className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">Friend Discount at Checkout</span>
                      <Badge variant={friendDiscountEnabled ? "default" : "outline"} className="text-[10px] h-4 px-1.5 font-medium">
                        {friendDiscountEnabled ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      The discount given to friends who click the advocate&apos;s link or use their coupon code.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFriendDiscountEnabled(!friendDiscountEnabled)}
                  className="h-8 gap-1.5 text-xs font-semibold"
                >
                  {friendDiscountEnabled ? (
                    <>
                      <ToggleRight className="h-5 w-5 text-teal" /> Enabled
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="h-5 w-5 text-muted-foreground" /> Inactive
                    </>
                  )}
                </Button>
              </div>

              {friendDiscountEnabled && (
                <div className="mt-3 pt-3 border-t border-coral/20 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Discount Type</Label>
                    <Select
                      value={friendDiscountType}
                      onValueChange={(val: any) => setFriendDiscountType(val)}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">Percentage (%) OFF</SelectItem>
                        <SelectItem value="FIXED">Flat Rupees (₹) OFF</SelectItem>
                        <SelectItem value="FREE_SHIPPING">Free Shipping</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Discount Value</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="1"
                        value={friendDiscountValue}
                        onChange={(e) => setFriendDiscountValue(Number(e.target.value))}
                        disabled={friendDiscountType === "FREE_SHIPPING"}
                        className="text-xs h-9 pr-8"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                        {friendDiscountType === "PERCENTAGE" ? "%" : friendDiscountType === "FIXED" ? "₹" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* STEP 4: LIVE CALCULATION PREVIEW */}
            {/* ========================================================================= */}
            <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-background to-primary/5 p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Live Calculation Preview
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Sample Order:</Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                      ₹
                    </span>
                    <Input
                      type="number"
                      value={testOrderAmount}
                      onChange={(e) => setTestOrderAmount(Number(e.target.value))}
                      className="w-28 h-8 text-xs font-bold pl-6"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* Friend Pays */}
                <div className="p-3 rounded-lg border bg-background/90 space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground block">
                    Referred Friend Pays:
                  </span>
                  <div className="text-xl font-bold text-foreground">
                    ₹{simulation.orderPaidByFriend.toFixed(2)}
                  </div>
                  {friendDiscountEnabled && simulation.friendDiscountAmt > 0 && (
                    <span className="text-[10px] text-coral font-medium block">
                      Saved ₹{simulation.friendDiscountAmt.toFixed(2)} with code
                    </span>
                  )}
                </div>

                {/* Advocate Cash */}
                <div className="p-3 rounded-lg border bg-background/90 space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground block">
                    Advocate Commission:
                  </span>
                  <div className="text-xl font-bold text-emerald-600">
                    ₹{simulation.advocateEarningsCash.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-muted-foreground block font-mono">
                    {simulation.breakdown}
                  </span>
                </div>

                {/* Points Equivalent */}
                <div className="p-3 rounded-lg border bg-background/90 space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground block">
                    Points Equivalent:
                  </span>
                  <div className="text-xl font-bold text-primary">
                    {simulation.advocateEarningsPoints} pts
                  </div>
                  <span className="text-[10px] text-muted-foreground block">
                    {rewardMode === "CASHBACK_COMMISSION" ? "Direct cash wallet payout" : "Redeemable for store perks"}
                  </span>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* STEP 5: OPTIONAL BONUSES & ADVANCED POLICY (COLLAPSIBLE) */}
            {/* ========================================================================= */}
            <div className="rounded-xl border border-border p-3 bg-muted/20">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between text-xs font-semibold text-foreground py-1"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-primary" />
                  <span>Advanced Settings, Welcome Bonus & Portal Controls</span>
                </div>
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {showAdvanced && (
                <div className="space-y-4 pt-3 mt-2 border-t border-border/60">
                  {/* Welcome Bonus */}
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-background">
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <div>
                        <span className="text-xs font-semibold text-foreground block">
                          Instant Welcome Bonus for New Advocates
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Award new advocates bonus on signup/first activation.
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {welcomeBonusEnabled && (
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            min="0"
                            value={welcomeBonusPoints}
                            onChange={(e) => setWelcomeBonusPoints(Number(e.target.value))}
                            className="w-20 h-7 text-xs font-bold"
                          />
                          <span className="text-xs text-muted-foreground">pts</span>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setWelcomeBonusEnabled(!welcomeBonusEnabled)}
                        className="h-7 px-1.5"
                      >
                        {welcomeBonusEnabled ? (
                          <ToggleRight className="h-5 w-5 text-teal" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Multi-Product Cart Policy */}
                  <div className="p-3 rounded-lg border bg-background space-y-2">
                    <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-primary" />
                      <span>Multi-Product Cart Commission Policy</span>
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Controls how commission is earned when a customer buys multiple items in one checkout.
                    </p>
                    <Select
                      value={multiProductCommissionMode}
                      onValueChange={(val: any) => setMultiProductCommissionMode(val)}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STORE_WIDE">Whole Order (Storewide) - Standard & Recommended</SelectItem>
                        <SelectItem value="ASSIGNED_PRODUCTS_ONLY">Assigned Products Only - Only pay for designated items</SelectItem>
                        <SelectItem value="GATE_REQUIRED">Gated by Assigned Product - Cart must include target item</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Minimum Payout Threshold */}
                  <div className="p-3 rounded-lg border bg-background flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-foreground block">Minimum Withdrawal Threshold</span>
                      <span className="text-[11px] text-muted-foreground">Min balance required before cash withdrawal</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        min="0"
                        value={minPayoutAmount}
                        onChange={(e) => setMinPayoutAmount(Number(e.target.value))}
                        className="w-24 h-8 text-xs font-bold"
                      />
                    </div>
                  </div>

                  {/* Portal Displays */}
                  <div className="space-y-2 pt-1">
                    <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-primary" />
                      <span>Advocate Portal Visibility Controls</span>
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-lg border bg-background">
                        <span>VIP Tier Roadmap</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowTierRoadmap(!showTierRoadmap)}
                          className="h-6 px-1"
                        >
                          {showTierRoadmap ? <ToggleRight className="h-5 w-5 text-teal" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg border bg-background">
                        <span>Performance Charts</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPerformanceCharts(!showPerformanceCharts)}
                          className="h-6 px-1"
                        >
                          {showPerformanceCharts ? <ToggleRight className="h-5 w-5 text-teal" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg border bg-background">
                        <span>Rewards Store Catalog</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowRewardsStore(!showRewardsStore)}
                          className="h-6 px-1"
                        >
                          {showRewardsStore ? <ToggleRight className="h-5 w-5 text-teal" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg border bg-background">
                        <span>Recent Purchases Feed</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowRecentPurchases(!showRecentPurchases)}
                          className="h-6 px-1"
                        >
                          {showRecentPurchases ? <ToggleRight className="h-5 w-5 text-teal" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg border bg-background">
                        <div>
                          <span className="font-semibold text-xs block">Auto-Approve Influencers</span>
                          <span className="text-[10px] text-muted-foreground block">
                            {autoApproveInfluencers ? "Instant partnership approval" : "Manual review required"}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setAutoApproveInfluencers(!autoApproveInfluencers)}
                          className="h-6 px-1"
                        >
                          {autoApproveInfluencers ? <ToggleRight className="h-5 w-5 text-teal" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Program Title & Share Message */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label className="text-xs">Program Title</Label>
                      <Input
                        value={programTitle}
                        onChange={(e) => setProgramTitle(e.target.value)}
                        placeholder="Customer Advocate & Referral Rewards"
                        className="text-xs h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Share Message</Label>
                      <Input
                        value={customShareMessage}
                        onChange={(e) => setCustomShareMessage(e.target.value)}
                        placeholder="Get 10% off with my link, and support me!"
                        className="text-xs h-8"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={mutation.isPending || isLoading}
            className="bg-primary text-primary-foreground font-semibold"
          >
            {mutation.isPending ? "Saving..." : "Save Commission Rules & Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
