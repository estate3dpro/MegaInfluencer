import React from 'react';
import { Award, CheckCircle2, ChevronRight, Zap, Crown, Flame, ShieldAlert, Star } from 'lucide-react';

interface TierProgressCardProps {
  tierDetails: {
    tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
    nextTier: string | null;
    progress: number;
    perks: string[];
  };
  totalReferrals: number;
}

export const TierProgressCard: React.FC<TierProgressCardProps> = ({ tierDetails, totalReferrals }) => {
  const tiers = [
    { name: 'BRONZE', minRef: 0, rewardRate: '10%', color: 'from-amber-700 to-amber-900', icon: Star },
    { name: 'SILVER', minRef: 5, rewardRate: '12%', color: 'from-slate-400 to-slate-600', icon: Flame },
    { name: 'GOLD', minRef: 20, rewardRate: '15%', color: 'from-amber-400 to-yellow-600', icon: Zap },
    { name: 'PLATINUM', minRef: 50, rewardRate: '20%', color: 'from-purple-500 to-indigo-600', icon: Crown },
  ];

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden border border-white/10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              VIP Tier Roadmap
            </span>
            <span className="text-xs text-slate-400">Total Referrals: {totalReferrals}</span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">
            Current Tier: <span className="text-indigo-400">{tierDetails.tier} ADVOCATE</span>
          </h2>
        </div>

        {tierDetails.nextTier && (
          <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-white/10 flex items-center gap-2 shrink-0">
            <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
            <div className="text-xs">
              <span className="text-slate-400">Next milestone: </span>
              <span className="font-bold text-white">{tierDetails.nextTier}</span>
            </div>
          </div>
        )}
      </div>

      {/* Visual Tier Roadmap */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tiers.map((t, idx) => {
          const isCurrent = t.name === tierDetails.tier;
          const isCompleted = tiers.findIndex((item) => item.name === tierDetails.tier) >= idx;
          const Icon = t.icon;

          return (
            <div
              key={t.name}
              className={`p-4 rounded-2xl border transition-all ${
                isCurrent
                  ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg'
                  : isCompleted
                  ? 'bg-slate-900/60 border-emerald-500/30 text-slate-300'
                  : 'bg-slate-950/40 border-white/5 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${t.color} flex items-center justify-center text-white shadow`}>
                  <Icon className="w-4 h-4" />
                </div>
                {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <div className="text-sm font-extrabold text-white">{t.name}</div>
              <div className="text-[11px] text-slate-400">{t.minRef}+ referrals</div>
              <div className="text-xs font-semibold text-amber-400 mt-1">{t.rewardRate} Reward Rate</div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar to Next Level */}
      {tierDetails.nextTier && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Milestone Progress to {tierDetails.nextTier}</span>
            <span className="font-mono text-indigo-400 font-bold">{tierDetails.progress}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-900 border border-white/10 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-pink-500 to-amber-400 transition-all duration-1000 shadow-sm"
              style={{ width: `${Math.max(5, tierDetails.progress)}%` }}
            />
          </div>
        </div>
      )}

      {/* Tier Perks Checklist */}
      <div className="pt-2 border-t border-white/10">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Your Active Tier Perks:</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {tierDetails.perks.map((perk, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-slate-200 bg-slate-900/80 px-3 py-2 rounded-xl border border-white/5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">{perk}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
