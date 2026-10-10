import React, { useState, useEffect } from "react";
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
  Coins,
  DollarSign,
  Gift,
  Layers,
  Percent,
  Sliders,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Eye,
  CheckCircle2,
  XCircle,
  Calculator,
  ArrowRight,
  ShoppingBag,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  getStoreReferralSettings,
  updateStoreReferralSettings,
  type ReferralRewardMode,
  type MultiProductCommissionMode,
  type StoreReferralConfig,
} from "../api/referral-settings.api";

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

  // Program Master State
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [rewardMode, setRewardMode] = useState<ReferralRewardMode>("POINTS");

  // Multi-Product Commission Calculation Policy
  const [multiProductCommissionMode, setMultiProductCommissionMode] = useState<MultiProductCommissionMode>("STORE_WIDE");
  const [fallbackCommissionRate, setFallbackCommissionRate] = useState<number>(0);

  // Rule 1: Fixed Flat Tokens Per Order (Inactivable)
  const [fixedTokensEnabled, setFixedTokensEnabled] = useState<boolean>(false);
  const [fixedTokensPerOrder, setFixedTokensPerOrder] = useState<number>(50);

  // Rule 2: Token Spend Ratio (X tokens per Y spent) (Inactivable)
  const [spendTokensEnabled, setSpendTokensEnabled] = useState<boolean>(false);
  const [spendTokensRate, setSpendTokensRate] = useState<number>(10);
  const [spendTokensAmount, setSpendTokensAmount] = useState<number>(100);

  // Rule 3: Percentage of Order Rule (Inactivable)
  const [percentageEnabled, setPercentageEnabled] = useState<boolean>(true);
  const [commissionRate, setCommissionRate] = useState<number>(10);
  const [pointsPerCurrency, setPointsPerCurrency] = useState<number>(1);

  // Rule 4: Welcome / Signup Bonus (Inactivable)
  const [welcomeBonusEnabled, setWelcomeBonusEnabled] = useState<boolean>(true);
  const [welcomeBonusPoints, setWelcomeBonusPoints] = useState<number>(100);

  // Rule 5: Friend Discount Offer (Inactivable)
  const [friendDiscountEnabled, setFriendDiscountEnabled] = useState<boolean>(true);
  const [friendDiscountType, setFriendDiscountType] = useState<"PERCENTAGE" | "FIXED" | "FREE_SHIPPING">("PERCENTAGE");
  const [friendDiscountValue, setFriendDiscountValue] = useState<number>(10);

  // Payout & UI display settings
  const [minPayoutAmount, setMinPayoutAmount] = useState<number>(500);
  const [showTierRoadmap, setShowTierRoadmap] = useState<boolean>(true);
  const [showPerformanceCharts, setShowPerformanceCharts] = useState<boolean>(true);
  const [showRewardsStore, setShowRewardsStore] = useState<boolean>(true);
  const [showRecentPurchases, setShowRecentPurchases] = useState<boolean>(true);

  // Branding
  const [programTitle, setProgramTitle] = useState<string>("");
  const [customShareMessage, setCustomShareMessage] = useState<string>("");

  // Live Simulation Test Amount
  const [testOrderAmount, setTestOrderAmount] = useState<number>(500);

  useEffect(() => {
    if (data?.config) {
      const c = data.config;
      setIsEnabled(c.isEnabled ?? true);
      setRewardMode(c.rewardMode || "POINTS");
      setMultiProductCommissionMode(c.multiProductCommissionMode || "STORE_WIDE");
      setFallbackCommissionRate(c.fallbackCommissionRate ?? 0);

      setFixedTokensEnabled(c.fixedTokensEnabled ?? false);
      setFixedTokensPerOrder(c.fixedTokensPerOrder ?? 50);

      setSpendTokensEnabled(c.spendTokensEnabled ?? false);
      setSpendTokensRate(c.spendTokensRate ?? 10);
      setSpendTokensAmount(c.spendTokensAmount ?? 100);

      setPercentageEnabled(c.percentageEnabled ?? true);
      setCommissionRate(c.commissionRate ?? 10);
      setPointsPerCurrency(c.pointsPerCurrency ?? 1);

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
  }, [data]);

  const mutation = useMutation({
    mutationFn: (payload: Partial<StoreReferralConfig>) => updateStoreReferralSettings(payload),
    onSuccess: () => {
      toast.success("Referral token rules & program settings saved successfully!");
      void queryClient.invalidateQueries({ queryKey: ["store", "referral-settings"] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update referral settings.");
    },
  });

  const handleSave = () => {
    mutation.mutate({
      isEnabled,
      rewardMode,
      multiProductCommissionMode,
      fallbackCommissionRate,
      fixedTokensEnabled,
      fixedTokensPerOrder,
      spendTokensEnabled,
      spendTokensRate,
      spendTokensAmount,
      percentageEnabled,
      commissionRate,
      pointsPerCurrency,
      welcomeBonusEnabled,
      welcomeBonusPoints,
      minPayoutAmount,
      friendDiscountEnabled,
      friendDiscountType,
      friendDiscountValue,
      showTierRoadmap,
      showPerformanceCharts,
      showRewardsStore,
      showRecentPurchases,
      programTitle,
      customShareMessage,
    });
  };

  // Live simulation calculation
  const simulationResults = React.useMemo(() => {
    let totalTokens = 0;
    let cashReward = 0;
    const activeRules: { title: string; reward: string }[] = [];

    if (!isEnabled) {
      return { totalTokens: 0, cashReward: 0, activeRules: [] };
    }

    if (fixedTokensEnabled && fixedTokensPerOrder > 0) {
      totalTokens += fixedTokensPerOrder;
      activeRules.push({
        title: "Per Order Fixed Tokens",
        reward: `+${fixedTokensPerOrder} tokens (flat)`,
      });
    }

    if (spendTokensEnabled && spendTokensRate > 0 && spendTokensAmount > 0) {
      const units = Math.floor(testOrderAmount / spendTokensAmount);
      const earned = units * spendTokensRate;
      totalTokens += earned;
      activeRules.push({
        title: `Spend Ratio (${spendTokensRate} pts / ₹${spendTokensAmount})`,
        reward: `+${earned} tokens (${units} × ${spendTokensRate})`,
      });
    }

    if (percentageEnabled && commissionRate > 0) {
      const commCash = (testOrderAmount * commissionRate) / 100;
      cashReward += commCash;
      const pts = Math.round(commCash * (pointsPerCurrency || 1));
      totalTokens += pts;
      activeRules.push({
        title: `Order Percentage (${commissionRate}%)`,
        reward: `+${pts} tokens (₹${commCash.toFixed(2)} val)`,
      });
    }

    return { totalTokens, cashReward, activeRules };
  }, [
    isEnabled,
    testOrderAmount,
    fixedTokensEnabled,
    fixedTokensPerOrder,
    spendTokensEnabled,
    spendTokensRate,
    spendTokensAmount,
    percentageEnabled,
    commissionRate,
    pointsPerCurrency,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Sliders className="h-5 w-5 text-primary" />
              <span>Customer Referral Rules & Token Engine</span>
            </DialogTitle>
            <Badge
              variant={isEnabled ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => setIsEnabled(!isEnabled)}
            >
              {isEnabled ? "● Program Active" : "○ Program Paused"}
            </Badge>
          </div>
          <DialogDescription>
            Configure dynamic earning rules for your advocates. Enable or inactivate each token rule independently based on your store strategy.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground animate-pulse">
            Loading store referral configuration...
          </div>
        ) : (
          <div className="space-y-6 py-2">
            {/* 1. REWARD SYSTEM MODE */}
            <div className="space-y-3 rounded-xl border p-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-semibold flex items-center gap-1.5">
                    <Coins className="h-4 w-4 text-primary" />
                    <span>Store Reward Strategy</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Select the high-level reward redemption system for your advocates.
                  </p>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  {rewardMode}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setRewardMode("POINTS")}
                  className={`flex flex-col text-left p-3 rounded-lg border transition-all ${
                    rewardMode === "POINTS"
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-xs text-foreground">Points & Rewards Store</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Advocates earn points, unlock VIP tiers (Bronze/Silver/Gold), and claim vouchers.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRewardMode("CASHBACK_COMMISSION")}
                  className={`flex flex-col text-left p-3 rounded-lg border transition-all ${
                    rewardMode === "CASHBACK_COMMISSION"
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    <span className="font-semibold text-xs text-foreground">Direct Cash Commission</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Advocates earn cash commissions directly withdrawable to UPI or Bank accounts.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRewardMode("DISCOUNT_ONLY")}
                  className={`flex flex-col text-left p-3 rounded-lg border transition-all ${
                    rewardMode === "DISCOUNT_ONLY"
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-coral" />
                    <span className="font-semibold text-xs text-foreground">Store Coupons Only</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Advocates receive instant store discount coupons to shop on your brand.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRewardMode("HYBRID")}
                  className={`flex flex-col text-left p-3 rounded-lg border transition-all ${
                    rewardMode === "HYBRID"
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-violet-600" />
                    <span className="font-semibold text-xs text-foreground">Hybrid (Points + Cash)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Advocates earn points and can redeem for either store vouchers or cash payouts.
                  </p>
                </button>
              </div>
            </div>

            {/* 2. DYNAMIC & INACTIVABLE TOKEN RULES MANAGER */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span>Dynamic Token Earning Rules</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Each rule can be activated or inactivated independently with its own toggle.
                  </p>
                </div>
              </div>

              {/* RULE CARD 1: FIXED TOKENS PER ORDER */}
              <div className={`rounded-xl border transition-all p-4 ${fixedTokensEnabled ? "bg-amber-500/5 border-amber-500/30" : "bg-muted/10 border-border opacity-70"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${fixedTokensEnabled ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-muted text-muted-foreground"}`}>
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">Fixed Flat Tokens Per Order</span>
                        <Badge variant={fixedTokensEnabled ? "default" : "outline"} className="text-[10px] h-4 px-1.5 font-medium">
                          {fixedTokensEnabled ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Award a fixed token amount for every completed referral order regardless of total.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFixedTokensEnabled(!fixedTokensEnabled)}
                    className="h-8 gap-1.5 text-xs font-semibold"
                  >
                    {fixedTokensEnabled ? (
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

                {fixedTokensEnabled && (
                  <div className="mt-3 pt-3 border-t border-amber-500/20 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Tokens Awarded Per Order</Label>
                      <Input
                        type="number"
                        min="1"
                        value={fixedTokensPerOrder}
                        onChange={(e) => setFixedTokensPerOrder(Number(e.target.value))}
                        placeholder="e.g. 50"
                        className="text-xs h-9"
                      />
                      <p className="text-[10px] text-muted-foreground">e.g. Advocate gets 50 tokens on every order.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* RULE CARD 2: TOKENS PER AMOUNT SPENT RATIO */}
              <div className={`rounded-xl border transition-all p-4 ${spendTokensEnabled ? "bg-emerald-500/5 border-emerald-500/30" : "bg-muted/10 border-border opacity-70"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${spendTokensEnabled ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                      <Coins className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">Tokens Per Amount Spent (Spend Ratio)</span>
                        <Badge variant={spendTokensEnabled ? "default" : "outline"} className="text-[10px] h-4 px-1.5 font-medium">
                          {spendTokensEnabled ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Award X tokens for every specific currency amount spent (e.g. 10 tokens per ₹100 spent).
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSpendTokensEnabled(!spendTokensEnabled)}
                    className="h-8 gap-1.5 text-xs font-semibold"
                  >
                    {spendTokensEnabled ? (
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

                {spendTokensEnabled && (
                  <div className="mt-3 pt-3 border-t border-emerald-500/20 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Tokens to Award (X Tokens)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={spendTokensRate}
                        onChange={(e) => setSpendTokensRate(Number(e.target.value))}
                        placeholder="e.g. 10"
                        className="text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">For Every Amount Spent (₹ / $ Y)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={spendTokensAmount}
                        onChange={(e) => setSpendTokensAmount(Number(e.target.value))}
                        placeholder="e.g. 100"
                        className="text-xs h-9"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground sm:col-span-2">
                      💡 <strong>Formula:</strong> A ₹500 order awards <strong>{Math.floor(500 / (spendTokensAmount || 1)) * spendTokensRate} tokens</strong> ({spendTokensRate} tokens × {Math.floor(500 / (spendTokensAmount || 1))} steps).
                    </p>
                  </div>
                )}
              </div>

              {/* RULE CARD 3: PERCENTAGE OF ORDER VALUE */}
              <div className={`rounded-xl border transition-all p-4 ${percentageEnabled ? "bg-primary/5 border-primary/30" : "bg-muted/10 border-border opacity-70"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${percentageEnabled ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                      <Percent className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">Percentage Commission / Tokens</span>
                        <Badge variant={percentageEnabled ? "default" : "outline"} className="text-[10px] h-4 px-1.5 font-medium">
                          {percentageEnabled ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Award a direct percentage commission of the total referred order value.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPercentageEnabled(!percentageEnabled)}
                    className="h-8 gap-1.5 text-xs font-semibold"
                  >
                    {percentageEnabled ? (
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

                {percentageEnabled && (
                  <div className="mt-3 pt-3 border-t border-primary/20 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Commission Rate (%)</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={commissionRate}
                            onChange={(e) => setCommissionRate(Number(e.target.value))}
                            className="pr-7 text-xs h-9"
                          />
                          <Percent className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Points Conversion Multiplier</Label>
                        <Input
                          type="number"
                          min="1"
                          value={pointsPerCurrency}
                          onChange={(e) => setPointsPerCurrency(Number(e.target.value))}
                          className="text-xs h-9"
                        />
                      </div>
                    </div>

                    {/* Multi-Product Cart Purchase Policy */}
                    <div className="pt-2 border-t border-border/40 space-y-3">
                      <div>
                        <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-primary" />
                          <span>Multi-Product Cart Commission Policy</span>
                        </Label>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          How commission is calculated when a customer buys multiple items in one order.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setMultiProductCommissionMode("STORE_WIDE")}
                          className={`p-3 rounded-xl border text-left text-xs transition-all duration-200 flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            multiProductCommissionMode === "STORE_WIDE"
                              ? "border-primary bg-primary/10 shadow-sm font-semibold"
                              : "border-border hover:border-primary/40 hover:bg-muted/30 opacity-80"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1.5 w-full">
                            <span className="font-semibold text-foreground">Whole Order (Storewide)</span>
                            {multiProductCommissionMode === "STORE_WIDE" && (
                              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                            Pay commission on entire order total regardless of items bought.
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setMultiProductCommissionMode("ASSIGNED_PRODUCTS_ONLY")}
                          className={`p-3 rounded-xl border text-left text-xs transition-all duration-200 flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            multiProductCommissionMode === "ASSIGNED_PRODUCTS_ONLY"
                              ? "border-primary bg-primary/10 shadow-sm font-semibold"
                              : "border-border hover:border-primary/40 hover:bg-muted/30 opacity-80"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1.5 w-full">
                            <span className="font-semibold text-foreground">Assigned Products Only</span>
                            {multiProductCommissionMode === "ASSIGNED_PRODUCTS_ONLY" && (
                              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                            Only pay commission on line items matching assigned products.
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setMultiProductCommissionMode("GATE_REQUIRED")}
                          className={`p-3 rounded-xl border text-left text-xs transition-all duration-200 flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            multiProductCommissionMode === "GATE_REQUIRED"
                              ? "border-primary bg-primary/10 shadow-sm font-semibold"
                              : "border-border hover:border-primary/40 hover:bg-muted/30 opacity-80"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1.5 w-full">
                            <span className="font-semibold text-foreground">Assigned Product Gated</span>
                            {multiProductCommissionMode === "GATE_REQUIRED" && (
                              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                            Earn on whole cart ONLY IF at least one assigned product is in cart.
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setMultiProductCommissionMode("HYBRID_FALLBACK")}
                          className={`p-3 rounded-xl border text-left text-xs transition-all duration-200 flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            multiProductCommissionMode === "HYBRID_FALLBACK"
                              ? "border-primary bg-primary/10 shadow-sm font-semibold"
                              : "border-border hover:border-primary/40 hover:bg-muted/30 opacity-80"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1.5 w-full">
                            <span className="font-semibold text-foreground">Tiered / Fallback Rate</span>
                            {multiProductCommissionMode === "HYBRID_FALLBACK" && (
                              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                            Full rate on assigned items + fallback rate on unassigned items.
                          </div>
                        </button>
                      </div>

                      {multiProductCommissionMode === "HYBRID_FALLBACK" && (
                        <div className="space-y-1 pt-1">
                          <Label className="text-xs font-medium">Unassigned Products Fallback Rate (%)</Label>
                          <div className="relative max-w-xs">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={fallbackCommissionRate}
                              onChange={(e) => setFallbackCommissionRate(Number(e.target.value))}
                              className="pr-7 text-xs h-9"
                            />
                            <Percent className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Commission percentage applied to line items NOT assigned to the influencer.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* RULE CARD 4: WELCOME SIGNUP BONUS */}
              <div className={`rounded-xl border transition-all p-4 ${welcomeBonusEnabled ? "bg-violet-500/5 border-violet-500/30" : "bg-muted/10 border-border opacity-70"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${welcomeBonusEnabled ? "bg-violet-500/20 text-violet-600 dark:text-violet-400" : "bg-muted text-muted-foreground"}`}>
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">Welcome / Signup Bonus</span>
                        <Badge variant={welcomeBonusEnabled ? "default" : "outline"} className="text-[10px] h-4 px-1.5 font-medium">
                          {welcomeBonusEnabled ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Instant bonus tokens granted when a new advocate joins your program.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setWelcomeBonusEnabled(!welcomeBonusEnabled)}
                    className="h-8 gap-1.5 text-xs font-semibold"
                  >
                    {welcomeBonusEnabled ? (
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

                {welcomeBonusEnabled && (
                  <div className="mt-3 pt-3 border-t border-violet-500/20 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Signup Bonus Tokens</Label>
                      <Input
                        type="number"
                        min="0"
                        value={welcomeBonusPoints}
                        onChange={(e) => setWelcomeBonusPoints(Number(e.target.value))}
                        placeholder="e.g. 100"
                        className="text-xs h-9"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* RULE CARD 5: FRIEND DISCOUNT OFFER */}
              <div className={`rounded-xl border transition-all p-4 ${friendDiscountEnabled ? "bg-teal/5 border-teal/30" : "bg-muted/10 border-border opacity-70"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${friendDiscountEnabled ? "bg-teal/20 text-teal" : "bg-muted text-muted-foreground"}`}>
                      <Gift className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">Friend Discount Incentive</span>
                        <Badge variant={friendDiscountEnabled ? "default" : "outline"} className="text-[10px] h-4 px-1.5 font-medium">
                          {friendDiscountEnabled ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Discount given at checkout to referred buyers who use the advocate link.
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
                  <div className="mt-3 pt-3 border-t border-teal/20 grid grid-cols-2 gap-3">
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
                          <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                          <SelectItem value="FIXED">Fixed Amount (₹)</SelectItem>
                          <SelectItem value="FREE_SHIPPING">Free Shipping</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Discount Value</Label>
                      <Input
                        type="number"
                        min="1"
                        value={friendDiscountValue}
                        onChange={(e) => setFriendDiscountValue(Number(e.target.value))}
                        disabled={friendDiscountType === "FREE_SHIPPING"}
                        className="text-xs h-9"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. LIVE SIMULATION & PREVIEW CALCULATOR */}
            <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-background to-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Live Calculation Preview
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Test Order:</Label>
                  <Input
                    type="number"
                    value={testOrderAmount}
                    onChange={(e) => setTestOrderAmount(Number(e.target.value))}
                    className="w-24 h-7 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-lg border bg-background/80 space-y-1.5">
                  <span className="text-[11px] font-medium text-muted-foreground block">
                    Total Tokens Earned on ₹{testOrderAmount} Order:
                  </span>
                  <div className="text-2xl font-bold text-primary flex items-baseline gap-1">
                    <span>{simulationResults.totalTokens}</span>
                    <span className="text-xs font-normal text-muted-foreground">Tokens</span>
                  </div>
                  <div className="space-y-1 pt-1">
                    {simulationResults.activeRules.length === 0 ? (
                      <span className="text-[11px] text-muted-foreground italic flex items-center gap-1">
                        <XCircle className="h-3 w-3 text-rose-500" /> No active earning rules enabled.
                      </span>
                    ) : (
                      simulationResults.activeRules.map((r, i) => (
                        <div key={i} className="text-[11px] flex items-center justify-between text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-teal" /> {r.title}:
                          </span>
                          <span className="font-semibold text-foreground">{r.reward}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-lg border bg-background/80 space-y-1.5">
                  <span className="text-[11px] font-medium text-muted-foreground block">
                    Cash Commission Value:
                  </span>
                  <div className="text-2xl font-bold text-emerald-600 flex items-baseline gap-1">
                    <span>₹{simulationResults.cashReward.toFixed(2)}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-1">
                    Min Payout Threshold: <strong>₹{minPayoutAmount}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* 4. PORTAL DISPLAY CONTROLS */}
            <div className="space-y-3 rounded-xl border p-4 bg-muted/20">
              <div>
                <Label className="text-sm font-semibold flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-primary" />
                  <span>Advocate Portal Visibility Controls</span>
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choose which modules and sections appear on the customer advocate portal.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="flex items-center justify-between p-2.5 rounded-lg border bg-background text-xs">
                  <div>
                    <span className="font-semibold block">VIP Tier Roadmap</span>
                    <span className="text-[10px] text-muted-foreground">Show Bronze/Silver/Gold tiers</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTierRoadmap(!showTierRoadmap)}
                    className="h-7 px-1.5"
                  >
                    {showTierRoadmap ? (
                      <ToggleRight className="h-5 w-5 text-teal" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg border bg-background text-xs">
                  <div>
                    <span className="font-semibold block">Performance Area Chart</span>
                    <span className="text-[10px] text-muted-foreground">6-month clicks & orders graph</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPerformanceCharts(!showPerformanceCharts)}
                    className="h-7 px-1.5"
                  >
                    {showPerformanceCharts ? (
                      <ToggleRight className="h-5 w-5 text-teal" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg border bg-background text-xs">
                  <div>
                    <span className="font-semibold block">Rewards Store Tab</span>
                    <span className="text-[10px] text-muted-foreground">Voucher & Gift Card catalog</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRewardsStore(!showRewardsStore)}
                    className="h-7 px-1.5"
                  >
                    {showRewardsStore ? (
                      <ToggleRight className="h-5 w-5 text-teal" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg border bg-background text-xs">
                  <div>
                    <span className="font-semibold block">Recent Purchases Feed</span>
                    <span className="text-[10px] text-muted-foreground">Friend orders breakdown</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRecentPurchases(!showRecentPurchases)}
                    className="h-7 px-1.5"
                  >
                    {showRecentPurchases ? (
                      <ToggleRight className="h-5 w-5 text-teal" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* 5. BRANDING & COPY */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Program Title</Label>
                <Input
                  value={programTitle}
                  onChange={(e) => setProgramTitle(e.target.value)}
                  placeholder="e.g. Brand Advocate Club"
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Custom Share Message / Slogan</Label>
                <Input
                  value={customShareMessage}
                  onChange={(e) => setCustomShareMessage(e.target.value)}
                  placeholder="e.g. Shop with my link to get 10% off and support me!"
                  className="text-xs h-9"
                />
              </div>
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
            className="bg-primary text-primary-foreground"
          >
            {mutation.isPending ? "Saving..." : "Save Program Rules & Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
