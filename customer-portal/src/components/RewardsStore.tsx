import React, { useState } from 'react';
import { Gift, Wallet, Sparkles, Tag, CreditCard, Copy, Check, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { type RewardItem, type RewardClaim } from '../lib/api';
import confetti from 'canvas-confetti';

interface RewardsStoreProps {
  pointsBalance: number;
  catalog: RewardItem[];
  claims: RewardClaim[];
  onClaimReward: (item: RewardItem, payoutAccount?: string) => Promise<{ claim: RewardClaim; newPointsBalance: number }>;
}

export const RewardsStore: React.FC<RewardsStoreProps> = ({
  pointsBalance,
  catalog,
  claims,
  onClaimReward,
}) => {
  const [selectedItem, setSelectedItem] = useState<RewardItem | null>(null);
  const [payoutAccount, setPayoutAccount] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimedVoucher, setClaimedVoucher] = useState<RewardClaim | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setIsClaiming(true);
    setError(null);
    try {
      const res = await onClaimReward(selectedItem, payoutAccount.trim() || undefined);
      setClaimedVoucher(res.claim);
      setSelectedItem(null);
      setPayoutAccount('');
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#6366f1', '#ec4899', '#f59e0b', '#10b981'],
      });
    } catch (err: any) {
      setError(err.message || 'Failed to claim reward');
    } finally {
      setIsClaiming(false);
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    confetti({ particleCount: 40, spread: 50 });
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Hero Balance Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/20 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Rewards & Redemption Vault
            </span>
            <h2 className="text-3xl font-extrabold text-white">Redeem Your Advocate Rewards</h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
              Convert your referral points into instant store discount coupons, shopping gift cards, or direct bank/UPI payouts.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/80 border border-amber-500/30 flex items-center gap-4 shrink-0 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 shadow">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-amber-300/80 font-bold uppercase">Available Balance</div>
              <div className="text-2xl font-black text-amber-300">{pointsBalance.toLocaleString()} pts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Reward Cards Catalog Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-400" />
            <span>Available Rewards Catalog</span>
          </h3>
          <span className="text-xs text-slate-400">Instant Delivery Upon Claim</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {catalog.map((item) => {
            const canAfford = pointsBalance >= item.pointsCost;

            return (
              <div
                key={item.id}
                className={`glass-panel rounded-3xl p-6 relative flex flex-col justify-between transition-all border ${
                  canAfford
                    ? 'border-indigo-500/30 hover:border-indigo-500/60 hover:shadow-xl hover:shadow-indigo-500/10'
                    : 'border-white/5 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-pink-500/20 text-pink-300 border border-pink-500/30">
                      {item.badge}
                    </span>
                    <div className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{item.pointsCost.toLocaleString()} pts</span>
                    </div>
                  </div>

                  <h4 className="text-lg font-bold text-white mb-1">{item.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6">{item.description}</p>
                </div>

                <div>
                  <button
                    onClick={() => setSelectedItem(item)}
                    disabled={!canAfford}
                    className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      canAfford
                        ? 'bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? (
                      <>
                        <span>Claim Reward</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <span>Need {item.pointsCost - pointsBalance} more pts</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Claim Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl max-w-md w-full border border-white/20 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Gift className="w-5 h-5 text-pink-400" />
                <span>Confirm Redemption</span>
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
              <div className="text-sm font-bold text-white">{selectedItem.title}</div>
              <div className="text-xs text-slate-400">{selectedItem.description}</div>
              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                <span className="text-slate-400">Points to deduct:</span>
                <span className="font-bold text-amber-400">-{selectedItem.pointsCost} pts</span>
              </div>
            </div>

            {selectedItem.type === 'CASH_PAYOUT' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Enter your UPI ID / Bank Account Details:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. yourname@upi or Account No."
                  value={payoutAccount}
                  onChange={(e) => setPayoutAccount(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <button
              onClick={handleClaim}
              disabled={isClaiming}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl transition-all disabled:opacity-50"
            >
              {isClaiming ? 'Processing Claim...' : 'Confirm & Redeem Now'}
            </button>
          </div>
        </div>
      )}

      {/* Success Voucher Popover */}
      {claimedVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl max-w-md w-full border border-emerald-500/30 text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-bold text-white">Reward Claimed!</h3>
            <p className="text-xs text-slate-300">
              You successfully redeemed <span className="text-white font-semibold">{claimedVoucher.rewardTitle}</span>.
            </p>

            {claimedVoucher.code && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-2">
                <div className="text-[11px] text-slate-400">Your Exclusive Coupon Code:</div>
                <div className="text-lg font-mono font-extrabold text-amber-400 tracking-wider">
                  {claimedVoucher.code}
                </div>
                <button
                  onClick={() => copyCode(claimedVoucher.code!, claimedVoucher.id)}
                  className="w-full py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedCodeId === claimedVoucher.id ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Coupon Code</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <button
              onClick={() => setClaimedVoucher(null)}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Claim History Section */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4 border border-white/10">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Tag className="w-4 h-4 text-indigo-400" />
          <span>Your Claimed Vouchers & Redemptions</span>
        </h3>

        {claims.length === 0 ? (
          <p className="text-xs text-slate-400 py-4">No rewards claimed yet. Redeem points above to see your vouchers here!</p>
        ) : (
          <div className="space-y-3">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="font-bold text-sm text-white">{claim.rewardTitle}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Claimed on {new Date(claim.createdAt).toLocaleDateString()} • {claim.pointsCost} pts
                  </div>
                </div>

                {claim.code ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-300 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      {claim.code}
                    </span>
                    <button
                      onClick={() => copyCode(claim.code!, claim.id)}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10"
                    >
                      {copiedCodeId === claim.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {claim.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
