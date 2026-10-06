import React from 'react';
import { MousePointerClick, ShoppingBag, Coins, TrendingUp, Sparkles, Clock } from 'lucide-react';

interface StatsCardsProps {
  summary: {
    totalClicks: number;
    totalReferralOrders: number;
    totalSalesAmount: number;
    totalRewardsEarned: number;
    pendingRewards: number;
    pointsBalance: number;
    conversionRate: number;
  };
  onRedeemClick?: () => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ summary, onRedeemClick }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {/* 1. Total Clicks */}
      <div className="glass-panel glass-panel-hover p-6 rounded-3xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Link Clicks</span>
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <MousePointerClick className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-extrabold text-white">
            {summary.totalClicks.toLocaleString()}
          </span>
          <span className="text-xs font-semibold text-blue-400">Visits</span>
        </div>
        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span>{summary.conversionRate}% conversion rate</span>
        </p>
      </div>

      {/* 2. Successful Orders */}
      <div className="glass-panel glass-panel-hover p-6 rounded-3xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Friend Purchases</span>
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-extrabold text-white">
            {summary.totalReferralOrders.toLocaleString()}
          </span>
          <span className="text-xs font-semibold text-purple-400">Orders</span>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Generated ₹{summary.totalSalesAmount.toLocaleString()} in sales
        </p>
      </div>

      {/* 3. Total Rewards Earned */}
      <div className="glass-panel glass-panel-hover p-6 rounded-3xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Rewards</span>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Coins className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400">
            ₹{summary.totalRewardsEarned.toLocaleString()}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>₹{summary.pendingRewards.toLocaleString()} pending validation</span>
        </p>
      </div>

      {/* 4. Reward Points Balance */}
      <div className="glass-panel glass-panel-hover p-6 rounded-3xl relative overflow-hidden border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 to-slate-900">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Points Balance</span>
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-extrabold text-white">
            {summary.pointsBalance.toLocaleString()}
          </span>
          <span className="text-xs font-semibold text-amber-300">pts</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Ready to redeem</span>
          <button
            onClick={onRedeemClick}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
          >
            Redeem Rewards →
          </button>
        </div>
      </div>
    </div>
  );
};
