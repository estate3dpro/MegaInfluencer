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
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  getStoreReferralSettings,
  updateStoreReferralSettings,
  type ReferralRewardMode,
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

  const [rewardMode, setRewardMode] = useState<ReferralRewardMode>("POINTS");
  const [commissionRate, setCommissionRate] = useState<number>(10);
  const [pointsPerCurrency, setPointsPerCurrency] = useState<number>(1);
  const [welcomeBonusPoints, setWelcomeBonusPoints] = useState<number>(100);
  const [minPayoutAmount, setMinPayoutAmount] = useState<number>(500);

  const [friendDiscountEnabled, setFriendDiscountEnabled] = useState<boolean>(true);
  const [friendDiscountType, setFriendDiscountType] = useState<"PERCENTAGE" | "FIXED" | "FREE_SHIPPING">("PERCENTAGE");
  const [friendDiscountValue, setFriendDiscountValue] = useState<number>(10);

  const [showTierRoadmap, setShowTierRoadmap] = useState<boolean>(true);
  const [showPerformanceCharts, setShowPerformanceCharts] = useState<boolean>(true);
  const [showRewardsStore, setShowRewardsStore] = useState<boolean>(true);
  const [showRecentPurchases, setShowRecentPurchases] = useState<boolean>(true);

  const [programTitle, setProgramTitle] = useState<string>("");
  const [customShareMessage, setCustomShareMessage] = useState<string>("");

  useEffect(() => {
    if (data?.config) {
      const c = data.config;
      setRewardMode(c.rewardMode || "POINTS");
      setCommissionRate(c.commissionRate ?? 10);
      setPointsPerCurrency(c.pointsPerCurrency ?? 1);
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
      toast.success("Referral program & portal settings updated successfully!");
      void queryClient.invalidateQueries({ queryKey: ["store", "referral-settings"] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update referral settings.");
    },
  });

  const handleSave = () => {
    mutation.mutate({
      rewardMode,
      commissionRate,
      pointsPerCurrency,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sliders className="h-5 w-5 text-primary" />
            <span>Customer Referral Program & Portal Settings</span>
          </DialogTitle>
          <DialogDescription>
            Control how customer advocates earn rewards, configure point vs. cash systems, and customize what appears on their portal.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground animate-pulse">
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
                    <span>Store Reward Mode</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Choose how advocates are compensated on referred orders.
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
                    Advocates earn points, unlock VIP tiers (Bronze/Silver/Gold), and claim gift cards.
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
                    No points system. Advocates earn direct ₹/USD cash and withdraw via UPI or Bank.
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

            {/* 2. PROGRAM RATES & VALUES */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Advocate Reward Rate (%)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    className="pr-7 text-xs"
                  />
                  <Percent className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <p className="text-[10px] text-muted-foreground">Commission on referred cart totals.</p>
              </div>

              {rewardMode === "POINTS" || rewardMode === "HYBRID" ? (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Points per ₹1</Label>
                    <Input
                      type="number"
                      min="1"
                      value={pointsPerCurrency}
                      onChange={(e) => setPointsPerCurrency(Number(e.target.value))}
                      className="text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground">Points awarded per currency unit.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Welcome Bonus Points</Label>
                    <Input
                      type="number"
                      min="0"
                      value={welcomeBonusPoints}
                      onChange={(e) => setWelcomeBonusPoints(Number(e.target.value))}
                      className="text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground">Granted on advocate signup.</p>
                  </div>
                </>
              ) : (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Minimum Payout Amount (₹)</Label>
                  <Input
                    type="number"
                    min="100"
                    value={minPayoutAmount}
                    onChange={(e) => setMinPayoutAmount(Number(e.target.value))}
                    className="text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">Minimum balance required for cash withdrawal.</p>
                </div>
              )}
            </div>

            {/* 3. FRIEND DISCOUNT INCENTIVE */}
            <div className="space-y-3 rounded-xl border p-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-semibold">Friend Incentive Offer</Label>
                  <p className="text-xs text-muted-foreground">
                    The discount given to referred buyers who use the advocate's link or code.
                  </p>
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
                      <ToggleLeft className="h-5 w-5 text-muted-foreground" /> Disabled
                    </>
                  )}
                </Button>
              </div>

              {friendDiscountEnabled ? (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Discount Type</Label>
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

                  <div className="space-y-1.5">
                    <Label className="text-xs">Discount Value</Label>
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
              ) : null}
            </div>

            {/* 4. PORTAL VISIBILITY CONTROLS (WHAT TO SHOW AND WHAT NOT TO SHOW) */}
            <div className="space-y-3 rounded-xl border p-4 bg-muted/20">
              <div>
                <Label className="text-sm font-semibold flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-primary" />
                  <span>Customer Portal UI Display Controls</span>
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Customize which modules and navigation tabs are visible to your advocates.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex items-center justify-between p-2.5 rounded-lg border bg-background text-xs">
                  <div>
                    <span className="font-semibold block">VIP Tier Roadmap</span>
                    <span className="text-[10px] text-muted-foreground">Show Bronze/Silver/Gold rank</span>
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
                  placeholder="e.g. Urban Threads Advocate Club"
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
            {mutation.isPending ? "Saving..." : "Save Program Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
