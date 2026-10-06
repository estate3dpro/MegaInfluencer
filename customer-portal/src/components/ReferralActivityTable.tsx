import React from 'react';
import { ShoppingBag, Clock, CheckCircle2, AlertCircle, Sparkles, Filter } from 'lucide-react';
import { type ReferralTransaction } from '../lib/api';

interface ReferralActivityTableProps {
  referrals: ReferralTransaction[];
}

export const ReferralActivityTable: React.FC<ReferralActivityTableProps> = ({ referrals }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>Approved</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            <span>Verifying</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-white/10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-indigo-400" />
            <h3 className="text-xl font-bold text-white">Referral Activity & Purchases</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time feed of orders placed by friends using your referral link
          </p>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        {referrals.length === 0 ? (
          <div className="text-center py-12 bg-slate-950/40 rounded-2xl border border-dashed border-white/10">
            <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400 font-medium">No referral purchases yet.</p>
            <p className="text-xs text-slate-500 mt-1">Share your link to see friend orders appear here in real-time!</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Order / Friend</th>
                <th className="py-3 px-4">Store</th>
                <th className="py-3 px-4">Order Total</th>
                <th className="py-3 px-4">Your Reward</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {referrals.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="py-4 px-4">
                    <div className="font-bold text-white text-sm">{item.orderName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{item.customerMasked}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-medium text-slate-200">{item.storeName}</span>
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-300">
                    ₹{item.orderAmount.toLocaleString()}
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-bold text-emerald-400 text-sm">
                      +₹{item.rewardAmount.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      ({item.commissionRate}% reward)
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="py-4 px-4 text-slate-400">
                    {new Date(item.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
