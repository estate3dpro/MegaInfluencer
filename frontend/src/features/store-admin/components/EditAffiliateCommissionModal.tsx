import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Switch } from "@/components/ui/switch";
import {
  Percent,
  BadgeIndianRupee,
  Sparkles,
  Loader2,
  Check,
  Link2,
  User,
  Package,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { updateAffiliateLink } from "../api/affiliate-links.api";

export interface EditableAffiliateLink {
  id: string;
  slug: string;
  creator?: string | null;
  creatorName?: string | null;
  creatorCode?: string | null;
  product?: string | null;
  productTitle?: string | null;
  collection?: string | null;
  targetType?: string;
  commissionType?: "PERCENTAGE" | "FIXED_AMOUNT";
  commissionRate: number;
  commissionAmount?: number | null;
  status?: "ACTIVE" | "PAUSED";
}

interface EditAffiliateCommissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  link: EditableAffiliateLink | null;
  onSuccess?: () => void;
}

export function EditAffiliateCommissionModal({
  open,
  onOpenChange,
  link,
  onSuccess,
}: EditAffiliateCommissionModalProps) {
  const queryClient = useQueryClient();

  const [commissionType, setCommissionType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">("PERCENTAGE");
  const [commissionRate, setCommissionRate] = useState<string>("10");
  const [commissionAmount, setCommissionAmount] = useState<string>("100");
  const [status, setStatus] = useState<"ACTIVE" | "PAUSED">("ACTIVE");

  useEffect(() => {
    if (link && open) {
      setCommissionType(link.commissionType === "FIXED_AMOUNT" ? "FIXED_AMOUNT" : "PERCENTAGE");
      setCommissionRate(String(link.commissionRate ?? 10));
      setCommissionAmount(link.commissionAmount ? String(link.commissionAmount) : "100");
      setStatus(link.status === "PAUSED" ? "PAUSED" : "ACTIVE");
    }
  }, [link, open]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!link) return;
      const rateNum = Number(commissionRate);
      const amountNum = Number(commissionAmount);

      return updateAffiliateLink(link.id, {
        commissionType,
        commissionRate: commissionType === "PERCENTAGE" ? (isNaN(rateNum) ? 10 : rateNum) : 0,
        commissionAmount: commissionType === "FIXED_AMOUNT" ? (isNaN(amountNum) ? 0 : amountNum) : null,
        status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store", "affiliate-links"] });
      queryClient.invalidateQueries({ queryKey: ["store", "creators"] });
      queryClient.invalidateQueries({ queryKey: ["store", "product"] });
      queryClient.invalidateQueries({ queryKey: ["store", "products"] });

      toast.success(
        commissionType === "PERCENTAGE"
          ? `Affiliate commission updated to ${commissionRate}% for /r/${link?.slug}`
          : `Affiliate commission updated to flat ₹${commissionAmount} for /r/${link?.slug}`
      );
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || "Could not update affiliate link commission.";
      toast.error(msg);
    },
  });

  if (!link) return null;

  const creatorDisplay = link.creator || link.creatorName || (link.creatorCode ? `@${link.creatorCode}` : "Storewide / General");
  const destinationDisplay = link.product || link.productTitle || link.collection || (link.targetType === "COLLECTION" ? "Shopify Collection" : "Entire Storefront");

  const parsedRate = Number(commissionRate) || 0;
  const parsedAmount = Number(commissionAmount) || 0;

  const isValid =
    commissionType === "PERCENTAGE"
      ? !isNaN(parsedRate) && parsedRate >= 0 && parsedRate <= 100
      : !isNaN(parsedAmount) && parsedAmount > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle className="text-base font-bold">Edit Affiliate Commission</DialogTitle>
              <DialogDescription className="text-xs">
                Update the commission payout rule for link{" "}
                <span className="font-mono font-semibold text-primary">/r/{link.slug}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Link summary pill card */}
        <div className="rounded-xl border bg-muted/40 p-3 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Link2 className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono font-bold text-foreground">/r/{link.slug}</span>
            </div>
            <Badge
              variant={status === "ACTIVE" ? "default" : "secondary"}
              className="text-[10px] uppercase font-semibold"
            >
              {status}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground pt-1 border-t border-border/40">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="text-foreground font-medium">{creatorDisplay}</span>
            </span>
            <span className="flex items-center gap-1">
              {link.targetType === "COLLECTION" ? (
                <Layers className="h-3 w-3" />
              ) : (
                <Package className="h-3 w-3" />
              )}
              <span className="text-foreground font-medium truncate max-w-[180px]">
                {destinationDisplay}
              </span>
            </span>
          </div>
        </div>

        <div className="space-y-4 py-2">
          {/* Commission Mode Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Commission Reward Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCommissionType("PERCENTAGE")}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  commissionType === "PERCENTAGE"
                    ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                    : "border-border/60 hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 font-semibold text-xs text-foreground">
                  <Percent className="h-3.5 w-3.5 text-primary" />
                  <span>Percentage (%)</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Creator earns % of qualifying cart subtotal
                </p>
              </button>

              <button
                type="button"
                onClick={() => setCommissionType("FIXED_AMOUNT")}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  commissionType === "FIXED_AMOUNT"
                    ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                    : "border-border/60 hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 font-semibold text-xs text-foreground">
                  <BadgeIndianRupee className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Flat Amount (₹)</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Creator earns fixed ₹ payout per sale
                </p>
              </button>
            </div>
          </div>

          {/* Value Inputs & Presets */}
          {commissionType === "PERCENTAGE" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Commission Rate (%)</Label>
                <span className="text-[11px] text-muted-foreground">0% – 100%</span>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="font-mono text-sm pr-8 h-9"
                  placeholder="10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                  %
                </span>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] text-muted-foreground font-medium mr-1">Quick presets:</span>
                {[5, 10, 15, 20, 25].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setCommissionRate(String(rate))}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                      commissionRate === String(rate)
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>

              {/* Live Preview */}
              <div className="rounded-lg bg-teal/10 border border-teal/20 p-2.5 text-xs text-teal-900 dark:text-teal-200">
                <p className="font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-teal" />
                  Live Payout Preview
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  On a ₹1,000 referred order, the creator earns{" "}
                  <span className="font-bold text-foreground">
                    ₹{((1000 * parsedRate) / 100).toFixed(0)}
                  </span>
                  .
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Flat Commission Amount (₹)</Label>
                <span className="text-[11px] text-muted-foreground">Per order</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                  ₹
                </span>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={commissionAmount}
                  onChange={(e) => setCommissionAmount(e.target.value)}
                  className="font-mono text-sm pl-7 h-9"
                  placeholder="100"
                />
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] text-muted-foreground font-medium mr-1">Quick presets:</span>
                {[50, 100, 200, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCommissionAmount(String(amt))}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                      commissionAmount === String(amt)
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              {/* Live Preview */}
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                <p className="font-semibold flex items-center gap-1.5">
                  <BadgeIndianRupee className="h-3.5 w-3.5 text-emerald-600" />
                  Fixed Rate Guarantee
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Creator earns a guaranteed{" "}
                  <span className="font-bold text-foreground">₹{parsedAmount}</span> payout on every
                  successful order, irrespective of order size.
                </p>
              </div>
            </div>
          )}

          {/* Status Toggle */}
          <div className="flex items-center justify-between rounded-xl border p-3 bg-card">
            <div>
              <p className="text-xs font-semibold text-foreground">Link Tracking Status</p>
              <p className="text-[11px] text-muted-foreground">
                {status === "ACTIVE"
                  ? "Active and tracking visits, orders, and commissions"
                  : "Paused — clicks won't generate commission payouts"}
              </p>
            </div>
            <Switch
              checked={status === "ACTIVE"}
              onCheckedChange={(checked) => setStatus(checked ? "ACTIVE" : "PAUSED")}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!isValid || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="font-semibold gap-1.5"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" /> Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
