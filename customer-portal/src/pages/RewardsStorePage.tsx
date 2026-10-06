import React, { useState } from 'react';
import {
  Gift,
  Wallet,
  Sparkles,
  Tag,
  Check,
  Copy,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  ShoppingBag,
  Lock,
  Unlock,
  PartyPopper,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PageHeader } from '@/components/app/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { type RewardItem, type RewardClaim } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';

const number = new Intl.NumberFormat('en-IN');

interface RewardsStorePageProps {
  pointsBalance: number;
  catalog: RewardItem[];
  claims: RewardClaim[];
  onClaimReward: (
    item: RewardItem,
    payoutAccount?: string
  ) => Promise<{
    claim: RewardClaim;
    unlockedData?: {
      couponCode: string | null;
      productName: string | null;
      productLink: string | null;
      rewardType: string;
      rewardTitle: string;
      rewardValue: number;
    };
    newPointsBalance: number;
  }>;
}

export const RewardsStorePage: React.FC<RewardsStorePageProps> = ({
  pointsBalance,
  catalog,
  claims,
  onClaimReward,
}) => {
  const [selectedItem, setSelectedItem] = useState<RewardItem | null>(null);
  const [payoutAccount, setPayoutAccount] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Unlock Animation Modal State
  const [unlockedItem, setUnlockedItem] = useState<{
    claim: RewardClaim;
    couponCode: string | null;
    productName: string | null;
    productLink: string | null;
    rewardTitle: string;
    rewardType: string;
    rewardValue: number;
  } | null>(null);

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setIsClaiming(true);
    setError(null);
    try {
      const res = await onClaimReward(selectedItem, payoutAccount.trim() || undefined);
      
      // Setup unlocked item payload
      const code = res.unlockedData?.couponCode || res.claim.code || selectedItem.couponCode || null;
      const prodName = res.unlockedData?.productName || (res.claim.details as any)?.productName || selectedItem.productName || null;
      const prodLink = res.unlockedData?.productLink || (res.claim.details as any)?.productLink || selectedItem.productLink || null;

      setUnlockedItem({
        claim: res.claim,
        couponCode: code,
        productName: prodName,
        productLink: prodLink,
        rewardTitle: selectedItem.title,
        rewardType: selectedItem.type,
        rewardValue: selectedItem.value,
      });

      setSelectedItem(null);
      setPayoutAccount('');

      // Trigger multi-stage victory confetti
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#6c5ce7', '#ec6b9a', '#20b8a6', '#f59e0b', '#10b981'],
      });

      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 300);

      toast.success(`🎉 Unlocked! ${selectedItem.title}`);
    } catch (err: any) {
      setError(err.message || 'Failed to claim reward');
    } finally {
      setIsClaiming(false);
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    toast.success('Coupon code copied to clipboard!');
    confetti({ particleCount: 40, spread: 50 });
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Page Header */}
      <PageHeader
        title="Advocate Rewards Vault"
        description="Convert your accumulated referral points into instant store discount coupons, shopping gift cards, free product gifts, or cash payouts."
        actions={
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-card border shadow-sm">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground">Points Balance:</span>
            <span className="text-xs font-bold text-foreground font-mono">
              {number.format(pointsBalance)} pts
            </span>
          </div>
        }
      />

      {/* 2. Rewards Catalog Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {catalog.map((item) => {
          const canAfford = pointsBalance >= item.pointsCost;
          const isProductGift = item.type === 'PRODUCT_LINK' || item.type === 'PRODUCT_GIFT' || !!item.productLink;

          return (
            <Card
              key={item.id}
              className={`shadow-card flex flex-col justify-between transition-all relative overflow-hidden ${
                canAfford ? 'hover:shadow-elevated border-primary/20 hover:border-primary/50' : 'opacity-70'
              }`}
            >
              <CardHeader className="p-5 pb-2">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge
                    variant="secondary"
                    className={`font-bold text-[10px] uppercase ${
                      isProductGift
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-coral/10 text-coral'
                    }`}
                  >
                    {item.badge || (isProductGift ? 'PRODUCT GIFT' : 'COUPON')}
                  </Badge>

                  <span className="text-xs font-bold font-mono text-primary flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    {number.format(item.pointsCost)} pts
                  </span>
                </div>
                <CardTitle className="text-base flex items-center gap-2">
                  {isProductGift ? (
                    <ShoppingBag className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : item.type === 'DISCOUNT_CODE' ? (
                    <Tag className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <Gift className="h-4 w-4 text-amber-500 shrink-0" />
                  )}
                  <span>{item.title}</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-5 pt-0 space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {item.description}
                </p>

                {/* Product / Coupon preview banner */}
                {item.productName && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs flex items-center gap-2">
                    <ShoppingBag className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="truncate font-medium text-emerald-700 dark:text-emerald-300">
                      Product: {item.productName}
                    </span>
                  </div>
                )}

                <Button
                  onClick={() => setSelectedItem(item)}
                  disabled={!canAfford}
                  size="sm"
                  className={`w-full text-xs font-semibold ${
                    canAfford
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : ''
                  }`}
                >
                  {canAfford ? (
                    <>
                      <Unlock className="h-3.5 w-3.5 mr-1.5" />
                      <span>Redeem & Unlock</span>
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5 mr-1.5" />
                      <span>Need {number.format(item.pointsCost - pointsBalance)} more pts</span>
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 3. Claim History Table */}
      <Card className="shadow-card">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-base">Redemption & Voucher History</CardTitle>
          <p className="text-xs text-muted-foreground">
            Previously claimed store discount codes, product links, and payout transfers
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {claims.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No rewards claimed yet. Click Redeem & Unlock above when you have enough points!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Reward Title</th>
                    <th className="py-3 px-4">Points Spent</th>
                    <th className="py-3 px-4">Unlocked Coupon / Code</th>
                    <th className="py-3 px-4">Product Link</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {claims.map((claim) => {
                    const coupon = claim.code || claim.details?.couponCode;
                    const prodLink = claim.details?.productLink;
                    const prodName = claim.details?.productName;

                    return (
                      <tr key={claim.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-foreground">
                          <div>{claim.rewardTitle}</div>
                          {prodName && (
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-normal">
                              Gift: {prodName}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium text-muted-foreground">
                          -{claim.pointsCost} pts
                        </td>
                        <td className="py-3.5 px-4">
                          {coupon ? (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded border border-primary/20">
                                {coupon}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => copyCode(coupon, claim.id)}
                                title="Copy coupon code"
                              >
                                {copiedCodeId === claim.id ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground font-mono text-[11px]">
                              {claim.details?.payoutAccount ? `UPI: ${claim.details.payoutAccount}` : 'Direct Payout'}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {prodLink ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1 text-emerald-600 hover:text-emerald-700 border-emerald-500/30"
                              onClick={() => window.open(prodLink, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" /> Visit Product
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={claim.status === 'COMPLETED' ? 'default' : 'secondary'}
                            className={claim.status === 'COMPLETED' ? 'bg-emerald-600 text-white text-[10px]' : 'text-[10px]'}
                          >
                            {claim.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground">
                          {new Date(claim.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Reward Redemption</DialogTitle>
            <DialogDescription>
              Please verify your reward selection. Points will be automatically deducted upon unlock.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs">
              {error}
            </div>
          )}

          {selectedItem && (
            <form onSubmit={handleClaimSubmit} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-muted/50 border space-y-1">
                <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <Gift className="h-4 w-4 text-primary" />
                  {selectedItem.title}
                </div>
                <div className="text-muted-foreground text-xs">{selectedItem.description}</div>

                {selectedItem.productName && (
                  <div className="pt-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs flex items-center gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>Included Product Gift: {selectedItem.productName}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2.5 border-t text-xs">
                  <span className="text-muted-foreground">Points Required:</span>
                  <span className="font-bold text-primary font-mono">-{selectedItem.pointsCost} pts</span>
                </div>
              </div>

              {selectedItem.type === 'CASH_PAYOUT' && (
                <div>
                  <label className="block font-semibold mb-1 text-foreground">
                    Enter UPI ID or Bank Account Details:
                  </label>
                  <Input
                    required
                    placeholder="e.g. name@upi or Bank account details"
                    value={payoutAccount}
                    onChange={(e) => setPayoutAccount(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedItem(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isClaiming}
                  className="bg-primary text-primary-foreground font-semibold"
                >
                  {isClaiming ? 'Unlocking Reward…' : 'Unlock Now 🎉'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================= */}
      {/* 4. REWARD UNLOCK CELEBRATION MODAL */}
      {/* ========================================================= */}
      <Dialog open={!!unlockedItem} onOpenChange={(open) => !open && setUnlockedItem(null)}>
        <DialogContent className="sm:max-w-md p-6 overflow-hidden relative border-amber-500/30 bg-gradient-to-b from-amber-500/[0.08] via-card to-card">
          {/* Animated Glow Background Effect */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-br from-amber-400/20 via-primary/20 to-coral/20 rounded-full blur-3xl pointer-events-none" />

          <DialogHeader className="text-center pb-2">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg animate-bounce duration-1000">
              <PartyPopper className="h-8 w-8" />
            </div>
            <DialogTitle className="text-xl font-extrabold text-foreground tracking-tight">
              Reward Successfully Unlocked! 🎉
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Congratulations! Your reward voucher and access perk are ready below.
            </DialogDescription>
          </DialogHeader>

          {unlockedItem && (
            <div className="space-y-5 py-2">
              {/* Reward Summary Pill */}
              <div className="p-4 rounded-2xl bg-card/90 backdrop-blur border border-border/80 shadow-sm text-center space-y-1">
                <div className="font-bold text-base text-foreground">{unlockedItem.rewardTitle}</div>
                <div className="text-xs text-muted-foreground font-medium">
                  Worth {unlockedItem.rewardType === 'DISCOUNT_CODE' && unlockedItem.rewardValue <= 100 ? `${unlockedItem.rewardValue}% OFF` : formatCurrency(unlockedItem.rewardValue)}
                </div>
              </div>

              {/* Unlocked Coupon Code Box */}
              {unlockedItem.couponCode && (
                <div className="space-y-2 text-center">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Your Unlocked Coupon Code
                  </span>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border-2 border-dashed border-primary/40 shadow-inner">
                    <span className="font-mono text-lg font-black text-primary tracking-widest pl-2">
                      {unlockedItem.couponCode}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => copyCode(unlockedItem.couponCode!, 'unlocked-modal')}
                      className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-1.5 shadow-sm cursor-pointer"
                    >
                      {copiedCodeId === 'unlocked-modal' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-white" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> Copy Code
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Apply this coupon code at checkout on your next store order.
                  </p>
                </div>
              )}

              {/* Unlocked Product Link Box */}
              {unlockedItem.productLink && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-foreground">
                        {unlockedItem.productName || 'Special Product Perk'}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Click below to open the dedicated product page and claim your item!
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 cursor-pointer h-9 shadow-sm"
                    onClick={() => {
                      if (unlockedItem.productLink) {
                        window.open(unlockedItem.productLink, '_blank');
                      }
                    }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Open Product Page & Claim
                  </Button>
                </div>
              )}

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-semibold"
                  onClick={() => setUnlockedItem(null)}
                >
                  Close & View Rewards
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
