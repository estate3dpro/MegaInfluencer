import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Crown,
  Medal,
  Sparkles,
  TrendingUp,
  Award,
  Users,
  Calendar,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  Flame,
  ChevronUp,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { api, type LeaderboardResponse, type LeaderboardAdvocate } from '@/lib/api';
import { formatCurrency, initials } from '@/lib/format';
import { toast } from 'sonner';

interface LeaderboardPageProps {
  onNavigateToLinks?: () => void;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ onNavigateToLinks }) => {
  const [timeframe, setTimeframe] = useState<'THIS_MONTH' | 'ALL_TIME'>('THIS_MONTH');
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async (period: 'THIS_MONTH' | 'ALL_TIME') => {
    setLoading(true);
    try {
      const res = await api.customer.getLeaderboard(period);
      setData(res);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load leaderboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(timeframe);
  }, [timeframe]);

  const podium = data?.podium || [];
  const top1 = podium[0];
  const top2 = podium[1];
  const top3 = podium[2];
  const currentUser = data?.currentUser;
  const gap = data?.gapToNextRank;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Trophy className="h-5 w-5" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Advocate Leaderboard
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Compete with top advocates, climb the monthly ranks, and unlock exclusive cash & point prize drops!
          </p>
        </div>

        {/* Timeframe Pill Switcher */}
        <div className="flex items-center rounded-xl bg-muted/60 p-1 border border-border/60 self-start md:self-auto">
          <button
            onClick={() => setTimeframe('THIS_MONTH')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              timeframe === 'THIS_MONTH'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>This Month</span>
          </button>
          <button
            onClick={() => setTimeframe('ALL_TIME')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              timeframe === 'ALL_TIME'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Flame className="h-3.5 w-3.5 text-amber-500" />
            <span>All Time</span>
          </button>
        </div>
      </div>

      {/* Current User Spotlight Banner */}
      {currentUser && (
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 p-5 md:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-black text-xl shadow-md">
                #{currentUser.rank}
                <div className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-foreground">Your Current Rank</span>
                  <Badge variant="outline" className="bg-background/80 font-semibold text-[11px]">
                    {currentUser.tier} TIER
                  </Badge>
                  {currentUser.badge && (
                    <span className="text-xs font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      {currentUser.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You have generated <span className="font-semibold text-foreground">{currentUser.totalReferrals} referral orders</span> ({formatCurrency(currentUser.totalSales)}) and earned <span className="font-semibold text-emerald-500">{formatCurrency(currentUser.totalEarned)}</span>.
                </p>
              </div>
            </div>

            {gap ? (
              <div className="flex items-center gap-3 rounded-xl bg-background/80 backdrop-blur border border-border/70 p-3 self-stretch md:self-auto">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 font-bold">
                  <ChevronUp className="h-5 w-5 animate-bounce" />
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-foreground">
                    Next Target: Rank #{gap.targetRank} ({gap.targetName})
                  </div>
                  <div className="text-muted-foreground text-[11px]">
                    Needs {gap.salesGap > 0 ? `${formatCurrency(gap.salesGap)} sales` : `${gap.ordersGap} more order`} to overtake
                  </div>
                </div>
              </div>
            ) : (
              currentUser.rank === 1 && (
                <div className="flex items-center gap-2 rounded-xl bg-amber-500/15 border border-amber-500/30 px-3.5 py-2 text-amber-500 font-bold text-xs">
                  <Crown className="h-4 w-4" /> You're leading the pack as Champion!
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Podium Showcase for Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4">
        {/* 2nd Place Podium */}
        <div className="order-2 md:order-1 flex flex-col items-center">
          {top2 ? (
            <div className={`w-full rounded-2xl border p-5 flex flex-col items-center text-center transition-all ${
              top2.isCurrentUser
                ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
                : 'border-border/80 bg-card hover:border-border'
            }`}>
              <div className="relative mb-3">
                <Avatar className="h-16 w-16 border-2 border-slate-300 dark:border-slate-600 shadow-md">
                  {top2.avatarUrl && <AvatarImage src={top2.avatarUrl} />}
                  <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-lg">
                    {initials(top2.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-slate-100 font-black text-xs shadow-md border-2 border-background">
                  2
                </div>
              </div>

              <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                {top2.name}
                {top2.isCurrentUser && <span className="text-[10px] text-primary font-bold">(You)</span>}
              </div>
              <div className="text-xs text-muted-foreground font-mono mt-0.5">#{top2.creatorCode}</div>

              <div className="my-3 w-full border-t border-border/60" />

              <div className="grid grid-cols-2 gap-2 w-full text-center">
                <div className="rounded-lg bg-muted/40 p-2">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Referrals</span>
                  <span className="text-xs font-bold text-foreground">{top2.totalReferrals}</span>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Sales</span>
                  <span className="text-xs font-bold text-foreground">{formatCurrency(top2.totalSales)}</span>
                </div>
              </div>

              <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-slate-200 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                🥈 {top2.prize || '+₹1,000 Bonus'}
              </div>
            </div>
          ) : (
            <div className="w-full rounded-2xl border border-dashed p-6 text-center text-xs text-muted-foreground">
              Rank #2 Spot Open
            </div>
          )}
          <div className="h-6 w-24 bg-slate-300/40 dark:bg-slate-700/40 rounded-t-lg mt-2 hidden md:block" />
        </div>

        {/* 1st Place Champion Podium (Elevated) */}
        <div className="order-1 md:order-2 flex flex-col items-center">
          {top1 ? (
            <div className={`w-full rounded-2xl border-2 p-6 flex flex-col items-center text-center transition-all relative overflow-hidden shadow-lg ${
              top1.isCurrentUser
                ? 'border-amber-400 bg-amber-500/10 ring-4 ring-amber-400/20'
                : 'border-amber-400/80 bg-gradient-to-b from-amber-500/10 via-card to-card'
            }`}>
              {/* Crown Header Icon */}
              <div className="absolute top-2 right-2 text-amber-500">
                <Crown className="h-5 w-5 fill-amber-500" />
              </div>

              <div className="relative mb-3">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Crown className="h-6 w-6 text-amber-500 animate-bounce" />
                </div>
                <Avatar className="h-20 w-20 border-4 border-amber-400 shadow-xl">
                  {top1.avatarUrl && <AvatarImage src={top1.avatarUrl} />}
                  <AvatarFallback className="bg-amber-500 text-white font-black text-xl">
                    {initials(top1.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2.5 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white font-black text-sm shadow-md border-2 border-background">
                  1
                </div>
              </div>

              <div className="font-bold text-base text-foreground flex items-center gap-1.5">
                {top1.name}
                {top1.isCurrentUser && <span className="text-xs text-primary font-bold">(You)</span>}
              </div>
              <div className="text-xs text-muted-foreground font-mono mt-0.5">#{top1.creatorCode}</div>

              <div className="my-3 w-full border-t border-border/60" />

              <div className="grid grid-cols-2 gap-2 w-full text-center">
                <div className="rounded-lg bg-amber-500/10 p-2 border border-amber-500/20">
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold block">Referrals</span>
                  <span className="text-sm font-bold text-foreground">{top1.totalReferrals}</span>
                </div>
                <div className="rounded-lg bg-amber-500/10 p-2 border border-amber-500/20">
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold block">Sales GMV</span>
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{formatCurrency(top1.totalSales)}</span>
                </div>
              </div>

              <div className="mt-3.5 inline-flex items-center gap-1 rounded-full bg-amber-500 text-white px-3 py-1 text-xs font-bold shadow-sm">
                👑 {top1.prize || '+₹2,500 Champion Drop'}
              </div>
            </div>
          ) : (
            <div className="w-full rounded-2xl border border-dashed p-6 text-center text-xs text-muted-foreground">
              Rank #1 Champion Spot Open
            </div>
          )}
          <div className="h-10 w-28 bg-amber-400/40 dark:bg-amber-600/40 rounded-t-lg mt-2 hidden md:block" />
        </div>

        {/* 3rd Place Podium */}
        <div className="order-3 flex flex-col items-center">
          {top3 ? (
            <div className={`w-full rounded-2xl border p-5 flex flex-col items-center text-center transition-all ${
              top3.isCurrentUser
                ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
                : 'border-border/80 bg-card hover:border-border'
            }`}>
              <div className="relative mb-3">
                <Avatar className="h-16 w-16 border-2 border-amber-700/60 shadow-md">
                  {top3.avatarUrl && <AvatarImage src={top3.avatarUrl} />}
                  <AvatarFallback className="bg-amber-800/20 text-amber-800 dark:text-amber-200 font-bold text-lg">
                    {initials(top3.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-700 text-amber-100 font-black text-xs shadow-md border-2 border-background">
                  3
                </div>
              </div>

              <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                {top3.name}
                {top3.isCurrentUser && <span className="text-[10px] text-primary font-bold">(You)</span>}
              </div>
              <div className="text-xs text-muted-foreground font-mono mt-0.5">#{top3.creatorCode}</div>

              <div className="my-3 w-full border-t border-border/60" />

              <div className="grid grid-cols-2 gap-2 w-full text-center">
                <div className="rounded-lg bg-muted/40 p-2">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Referrals</span>
                  <span className="text-xs font-bold text-foreground">{top3.totalReferrals}</span>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Sales</span>
                  <span className="text-xs font-bold text-foreground">{formatCurrency(top3.totalSales)}</span>
                </div>
              </div>

              <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-800/20 dark:bg-amber-800/40 px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                🥉 {top3.prize || '+₹500 Bonus'}
              </div>
            </div>
          ) : (
            <div className="w-full rounded-2xl border border-dashed p-6 text-center text-xs text-muted-foreground">
              Rank #3 Spot Open
            </div>
          )}
          <div className="h-4 w-24 bg-amber-800/30 dark:bg-amber-800/50 rounded-t-lg mt-2 hidden md:block" />
        </div>
      </div>

      {/* Full Leaderboard Table */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Medal className="h-4 w-4 text-primary" />
                <span>Full Advocate Rankings</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Updated in real time based on verified customer orders and referral revenue
              </CardDescription>
            </div>
            <div className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{data?.leaderboard.length || 0}</span> advocates
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="py-3 px-4 font-semibold w-16 text-center">Rank</th>
                  <th className="py-3 px-4 font-semibold">Advocate</th>
                  <th className="py-3 px-4 font-semibold text-center">Tier</th>
                  <th className="py-3 px-4 font-semibold text-right">Referral Orders</th>
                  <th className="py-3 px-4 font-semibold text-right">Sales Volume</th>
                  <th className="py-3 px-4 font-semibold text-right">Total Rewards</th>
                  <th className="py-3 px-4 font-semibold text-center">Prize Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data?.leaderboard.map((adv) => {
                  const isUser = adv.isCurrentUser;
                  return (
                    <tr
                      key={adv.id}
                      className={`transition-colors ${
                        isUser
                          ? 'bg-primary/5 font-semibold text-foreground hover:bg-primary/10'
                          : 'hover:bg-muted/30'
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        {adv.rank === 1 ? (
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white font-black text-xs shadow-sm">
                            1
                          </span>
                        ) : adv.rank === 2 ? (
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-slate-100 font-bold text-xs">
                            2
                          </span>
                        ) : adv.rank === 3 ? (
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-700 text-amber-100 font-bold text-xs">
                            3
                          </span>
                        ) : (
                          <span className="text-muted-foreground font-mono text-xs">#{adv.rank}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {adv.avatarUrl && <AvatarImage src={adv.avatarUrl} />}
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                              {initials(adv.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              {adv.name}
                              {isUser && (
                                <Badge className="text-[9px] h-4 bg-primary text-primary-foreground px-1.5">
                                  YOU
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono">
                              #{adv.creatorCode}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-semibold uppercase tracking-wider"
                        >
                          {adv.tier}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium">
                        {adv.totalReferrals}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-foreground">
                        {formatCurrency(adv.totalSales)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(adv.totalEarned)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {adv.prize ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                            <Sparkles className="h-3 w-3" />
                            {adv.prize}
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Rewards Rules / Perks Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-500 font-bold text-xs">
            <Crown className="h-4 w-4" /> 1st Place Champion
          </div>
          <p className="text-xs text-muted-foreground">
            Takes home ₹2,500 cash voucher + Top Advocate VIP badge featured across partner stores.
          </p>
        </div>
        <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2">
          <div className="flex items-center gap-2 text-slate-400 font-bold text-xs">
            <Medal className="h-4 w-4" /> 2nd & 3rd Place Runners
          </div>
          <p className="text-xs text-muted-foreground">
            Rank #2 gets ₹1,000 monthly bonus; Rank #3 gets ₹500 instant store shopping credit.
          </p>
        </div>
        <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2">
          <div className="flex items-center gap-2 text-primary font-bold text-xs">
            <Zap className="h-4 w-4" /> Top 10 Finishers
          </div>
          <p className="text-xs text-muted-foreground">
            Every advocate finishing in the Top 10 receives 250 bonus points to redeem in the rewards store.
          </p>
        </div>
      </div>
    </div>
  );
};
