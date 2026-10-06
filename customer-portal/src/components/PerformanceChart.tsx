import React, { useState } from 'react';
import { BarChart3, TrendingUp, Calendar, Filter } from 'lucide-react';

interface PerformanceChartProps {
  monthlyData: {
    month: string;
    clicks: number;
    orders: number;
    rewards: number;
  }[];
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ monthlyData }) => {
  const [activeMetric, setActiveMetric] = useState<'rewards' | 'orders' | 'clicks'>('rewards');

  const maxVal = Math.max(
    ...monthlyData.map((d) => (activeMetric === 'rewards' ? d.rewards : activeMetric === 'orders' ? d.orders : d.clicks)),
    10,
  );

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-white/10">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-xl font-bold text-white">Referral Performance Analytics</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">Monthly trend of clicks, referred orders and rewards earned</p>
        </div>

        {/* Metric Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setActiveMetric('rewards')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeMetric === 'rewards'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Rewards (₹)
          </button>
          <button
            onClick={() => setActiveMetric('orders')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeMetric === 'orders'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveMetric('clicks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeMetric === 'clicks'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Clicks
          </button>
        </div>
      </div>

      {/* Visual Chart Bars */}
      <div className="pt-4">
        <div className="grid grid-cols-6 gap-2 sm:gap-6 items-end h-56 pb-2 border-b border-white/10">
          {monthlyData.map((d, index) => {
            const rawValue = activeMetric === 'rewards' ? d.rewards : activeMetric === 'orders' ? d.orders : d.clicks;
            const heightPercent = Math.max(8, Math.round((rawValue / maxVal) * 100));

            const barColor =
              activeMetric === 'rewards'
                ? 'from-emerald-600 to-teal-400 group-hover:from-emerald-500 group-hover:to-teal-300'
                : activeMetric === 'orders'
                ? 'from-purple-600 to-pink-500 group-hover:from-purple-500 group-hover:to-pink-400'
                : 'from-blue-600 to-indigo-500 group-hover:from-blue-500 group-hover:to-indigo-400';

            return (
              <div key={index} className="flex flex-col items-center h-full justify-end group relative cursor-pointer">
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-all pointer-events-none absolute -top-12 bg-slate-900 border border-white/20 px-2.5 py-1.5 rounded-xl shadow-xl z-20 whitespace-nowrap text-center">
                  <div className="text-[10px] text-slate-400">{d.month}</div>
                  <div className="text-xs font-bold text-white">
                    {activeMetric === 'rewards' ? `₹${rawValue.toLocaleString()}` : rawValue.toLocaleString()}
                  </div>
                </div>

                {/* Bar */}
                <div
                  className={`w-full max-w-[48px] rounded-t-xl bg-gradient-to-t ${barColor} transition-all duration-500 shadow-md`}
                  style={{ height: `${heightPercent}%` }}
                />

                {/* X-axis label */}
                <span className="text-xs font-medium text-slate-400 mt-3 group-hover:text-white transition-colors">
                  {d.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="grid grid-cols-3 gap-4 pt-2 text-center">
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5">
          <div className="text-[11px] text-slate-400">Total 6M Clicks</div>
          <div className="text-sm font-bold text-blue-400">
            {monthlyData.reduce((sum, d) => sum + d.clicks, 0).toLocaleString()}
          </div>
        </div>
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5">
          <div className="text-[11px] text-slate-400">Total 6M Orders</div>
          <div className="text-sm font-bold text-purple-400">
            {monthlyData.reduce((sum, d) => sum + d.orders, 0).toLocaleString()}
          </div>
        </div>
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5">
          <div className="text-[11px] text-slate-400">Total 6M Rewards</div>
          <div className="text-sm font-bold text-emerald-400">
            ₹{monthlyData.reduce((sum, d) => sum + d.rewards, 0).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};
