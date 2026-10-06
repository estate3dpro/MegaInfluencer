import React, { useState, useEffect } from 'react';
import {
  Award,
  Sparkles,
  Users,
  CheckCircle2,
  Lock,
  Gift,
  Trophy,
  ArrowRight,
  Flame,
  Check,
  Zap,
  TrendingUp,
  DollarSign,
  Crown,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api, type MilestonesResponse, type MilestoneItem } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';

interface MilestonesPageProps {
  onRefreshStats?: () => void;
  onNavigateToRewards?: () => void;
}

export const MilestonesPage: React.FC<MilestonesPageProps> = ({ onRefreshStats, onNavigateToRewards }) => {
  const [data, setData] = useState<MilestonesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'READY' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');

  const fetchMilestones = async () => {
    setLoading(true);
    try {
      const res = await api.customer.getMilestones();
      setData(res);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load milestones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, []);

  const handleClaim = async (milestone: MilestoneItem) => {
    setClaimingId(milestone.id);
    try {
      const res = await api.customer.claimMilestone(milestone.id);
      toast.success(`🎉 Unlocked! +${res.pointsBonus} bonus points awarded for "${res.milestoneTitle}"!`);
      await fetchMilestones();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      toast.error(err.message || 'Failed to claim milestone');
    } finally {
      setClaimingId(null);
    }
  };

  const milestones = data?.milestones || [];
  const filteredMilestones = milestones.filter((m) => {
    if (filter === 'READY') return m.canClaim;
    if (filter === 'IN_PROGRESS') return !m.isUnlocked;
    if (filter === 'COMPLETED') return m.isClaimed;
    return true;
  });

  const readyToClaimCount = milestones.filter((m) => m.canClaim).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Award className="h-5 w-5" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Referral Milestone Rewards
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Hit referral orders & sales milestones to automatically unlock massive point bonuses & cash rewards!
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center rounded-xl bg-muted/60 p-1 border border-border/60 self-start md:self-auto overflow-x-auto max-w-full">
          {[
            { id: 'ALL' as const, label: 'All Milestones', highlight: false },
            { id: 'READY' as const, label: `Ready to Claim (${readyToClaimCount})`, highlight: readyToClaimCount > 0 },
            { id: 'IN_PROGRESS' as const, label: 'In Progress', highlight: false },
            { id: 'COMPLETED' as const, label: 'Completed', highlight: false },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filter === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              } ${tab.highlight && filter !== tab.id ? 'text-amber-500 font-bold' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm border-border/80">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">
                Completed Roadmap
              </span>
              <div className="text-xl font-bold text-foreground">
                {data?.completedCount || 0} / {data?.totalCount || 0}
              </div>
              <span className="text-[11px] text-muted-foreground">
                {milestones.length > 0
                  ? `${Math.round(((data?.completedCount || 0) / (data?.totalCount || 1)) * 100)}% roadmap unlocked`
                  : '0% completed'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/80">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">
                Bonus Points Claimed
              </span>
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                +{(data?.totalClaimedPoints || 0).toLocaleString()} pts
              </div>
              <span className="text-[11px] text-muted-foreground">From completed milestones</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/80">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">
                Your Referral Stats
              </span>
              <div className="text-xl font-bold text-foreground">
                {data?.stats.totalReferralCount || 0} orders
              </div>
              <span className="text-[11px] text-muted-foreground">
                {formatCurrency(data?.stats.totalSalesAmount || 0)} total sales volume
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Milestone Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMilestones.map((m) => {
          const isReferralCount = m.targetType === 'REFERRAL_COUNT';
          const targetUnit = isReferralCount ? 'orders' : '';
          const currentDisplay = isReferralCount ? m.currentProgress : formatCurrency(m.currentProgress);
          const targetDisplay = isReferralCount ? `${m.targetValue} orders` : formatCurrency(m.targetValue);

          return (
            <Card
              key={m.id}
              className={`relative overflow-hidden transition-all shadow-sm ${
                m.isClaimed
                  ? 'border-emerald-500/30 bg-emerald-500/[0.02]'
                  : m.canClaim
                  ? 'border-amber-500/60 bg-amber-500/[0.04] ring-2 ring-amber-500/20 shadow-md'
                  : 'border-border/80 bg-card hover:border-border'
              }`}
            >
              {/* Ready to claim banner pill */}
              {m.canClaim && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-white text-[10px] font-black uppercase px-3 py-0.5 rounded-bl-lg shadow-sm flex items-center gap-1">
                  <Sparkles className="h-3 w-3 animate-spin" /> Ready to Claim
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold ${
                        m.isClaimed
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : m.canClaim
                          ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                          : 'bg-muted text-muted-foreground border border-border/60'
                      }`}
                    >
                      {m.isClaimed ? (
                        <Check className="h-6 w-6 stroke-[3]" />
                      ) : m.targetType === 'SALES_AMOUNT' ? (
                        <DollarSign className="h-5 w-5" />
                      ) : (
                        <Users className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-bold text-foreground">
                          {m.title}
                        </CardTitle>
                        {m.badgeText && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {m.badgeText}
                          </span>
                        )}
                      </div>
                      <CardDescription className="text-xs mt-0.5 line-clamp-2">
                        {m.description}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-1">
                {/* Progress Bar & Values */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">
                      Progress: <span className="font-semibold text-foreground">{currentDisplay}</span> / {targetDisplay}
                    </span>
                    <span className="font-bold text-foreground">{m.progressPercent}%</span>
                  </div>
                  <Progress
                    value={m.progressPercent}
                    className={`h-2 ${m.isClaimed ? 'bg-emerald-500/20' : m.canClaim ? 'bg-amber-500/20' : ''}`}
                  />
                </div>

                {/* Reward Perk & Action Button */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/60">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    <Sparkles className="h-4 w-4" />
                    <span>+{m.pointsBonus.toLocaleString()} Bonus Points</span>
                    {m.rewardType === 'CASH_PAYOUT' && (
                      <span className="text-emerald-500 font-bold ml-1">
                        (+{formatCurrency(m.rewardValue)} Cash)
                      </span>
                    )}
                  </div>

                  <div>
                    {m.isClaimed ? (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 text-xs py-1 px-3">
                        <Check className="h-3 w-3" /> Claimed
                      </Badge>
                    ) : m.canClaim ? (
                      <Button
                        size="sm"
                        onClick={() => handleClaim(m)}
                        disabled={claimingId === m.id}
                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold shadow-sm cursor-pointer h-8 text-xs"
                      >
                        {claimingId === m.id ? 'Claiming…' : 'Claim Reward 🎉'}
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                        <Lock className="h-3.5 w-3.5" />
                        <span>Locked</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredMilestones.length === 0 && (
          <div className="col-span-full py-12 text-center border border-dashed rounded-2xl p-8 space-y-3">
            <Award className="h-10 w-10 text-muted-foreground/50 mx-auto" />
            <h3 className="font-bold text-sm text-foreground">No milestones in this filter</h3>
            <p className="text-xs text-muted-foreground">
              Try selecting "All Milestones" to see full roadmap.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
