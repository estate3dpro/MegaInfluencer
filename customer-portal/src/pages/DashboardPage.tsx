import React, { useState } from 'react';
import {
  MousePointerClick,
  ShoppingBag,
  CheckCircle2,
  Wallet,
  Copy,
  Check,
  QrCode,
  Share2,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Store,
  ChevronRight,
  Plus,
  Gift,
  Zap,
  Coins,
  Info,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { HeroReferralCard } from '@/components/HeroReferralCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { type DashboardData, type ReferralLink, type Store as StoreType, type ReferralTransaction } from '@/lib/api';

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
const number = new Intl.NumberFormat('en-IN');

interface DashboardPageProps {
  data: DashboardData;
  links: ReferralLink[];
  stores: StoreType[];
  referrals: ReferralTransaction[];
  onNavigate: (tab: any) => void;
  onCreateLinkModal: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  data,
  links,
  stores,
  referrals,
  onNavigate,
  onCreateLinkModal,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedLinkForQr, setSelectedLinkForQr] = useState<string>('');

  const config = data.referralConfig;
  const rewardMode = config?.rewardMode || 'POINTS';
  const isPoints = rewardMode === 'POINTS' || rewardMode === 'HYBRID';
  const isCashback = rewardMode === 'CASHBACK_COMMISSION';
  const isDiscountOnly = rewardMode === 'DISCOUNT_ONLY';

  const showCharts = config?.showPerformanceCharts ?? true;
  const showTiers = (config?.showTierRoadmap ?? true) && isPoints;
  const showRecent = config?.showRecentPurchases ?? true;
  const programTitle = config?.programTitle || 'Active Referral Program';

  const primaryLink = data.primaryReferralLink || (links[0] ? {
    id: links[0].id,
    slug: links[0].slug,
    shareUrl: links[0].shareUrl,
    storeName: links[0].store.name,
  } : null);

  const shareUrl = primaryLink?.shareUrl || `http://localhost:3000/r/${data.summary.creatorCode?.toLowerCase() || 'advocate'}`;
  const storeName = primaryLink?.storeName || (stores[0]?.name || 'Partner Store');

  const handleCopyLink = (urlToCopy: string) => {
    navigator.clipboard.writeText(urlToCopy);
    setCopiedLink(true);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Active Earning Rules Summary
  const activeEarningRules: { title: string; desc: string; icon: any }[] = [];
  if (config?.fixedTokensEnabled && (config.fixedTokensPerOrder ?? 0) > 0) {
    activeEarningRules.push({
      title: `${config.fixedTokensPerOrder} Flat Tokens`,
      desc: 'Earned on every completed referral order',
      icon: ShoppingBag,
    });
  }
  if (config?.spendTokensEnabled && (config.spendTokensRate ?? 0) > 0) {
    activeEarningRules.push({
      title: `${config.spendTokensRate} Tokens per ₹${config.spendTokensAmount || 100}`,
      desc: 'Proportional reward per amount spent',
      icon: Coins,
    });
  }
  if (config?.percentageEnabled !== false && (config?.commissionRate ?? 0) > 0) {
    activeEarningRules.push({
      title: `${config?.commissionRate}% Commission`,
      desc: 'Direct percentage of cart total',
      icon: Zap,
    });
  }
  if (config?.welcomeBonusEnabled !== false && (config?.welcomeBonusPoints ?? 0) > 0) {
    activeEarningRules.push({
      title: `${config?.welcomeBonusPoints} Welcome Bonus`,
      desc: 'Credited on advocate signup',
      icon: Sparkles,
    });
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Mobile-First Hero Referral & Sharing Card */}
      <HeroReferralCard
        shareUrl={shareUrl}
        creatorCode={data.summary.creatorCode || 'REF'}
        storeName={storeName}
        friendDiscountPercent={data.summary.friendDiscountPercent || 10}
        rewardRatePercent={data.summary.rewardRatePercent || 10}
        rewardMode={rewardMode}
        onOpenStoreModal={() => onNavigate('stores')}
      />

      {/* 2. Active Token Earning Rules Badge Card (Mobile Friendly) */}
      {activeEarningRules.length > 0 && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 sm:p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Zap className="h-4 w-4 text-amber-500 shrink-0" />
              <span>How You Earn Tokens in this Store</span>
            </div>
            <Badge variant="outline" className="text-[10px] bg-background text-primary border-primary/30">
              {activeEarningRules.length} Active Rules
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activeEarningRules.map((rule, idx) => {
              const Icon = rule.icon;
              return (
                <div key={idx} className="flex items-center gap-2.5 p-2 rounded-xl bg-card border border-border/80 shadow-2xs">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-foreground block truncate">{rule.title}</span>
                    <span className="text-[10px] text-muted-foreground block truncate">{rule.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Mobile 2x2 Metric Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Metric 1: Link Clicks */}
        <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Link Clicks</span>
            <div className="h-6 w-6 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <MousePointerClick className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground">
            {number.format(data.summary.totalClicks)}
          </div>
          <span className="text-[10px] text-emerald-500 font-medium block">
            {data.summary.conversionRate}% conversion
          </span>
        </div>

        {/* Metric 2: Referred Orders */}
        <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Friend Orders</span>
            <div className="h-6 w-6 rounded-lg bg-coral/10 text-coral flex items-center justify-center">
              <ShoppingBag className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground">
            {number.format(data.summary.totalReferralOrders)}
          </div>
          <span className="text-[10px] text-muted-foreground block truncate">
            {money.format(data.summary.totalSalesAmount)} sales
          </span>
        </div>

        {/* Metric 3: Total Sales Attributed */}
        <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground">Total Sales</span>
            <div className="h-6 w-6 rounded-lg bg-teal/10 text-teal flex items-center justify-center">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-teal">
            {money.format(data.summary.totalSalesAmount)}
          </div>
          <span className="text-[10px] text-muted-foreground block">
            Generated volume
          </span>
        </div>

        {/* Metric 4: Token / Points Wallet */}
        <div
          onClick={() => onNavigate('rewards')}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-card to-primary/5 border border-primary/20 shadow-xs space-y-1 cursor-pointer hover:border-primary/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-primary">Token Balance</span>
            <div className="h-6 w-6 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground">
            {isCashback ? money.format(data.summary.totalRewardsEarned) : `${number.format(data.summary.pointsBalance)} pts`}
          </div>
          <span className="text-[10px] text-primary font-bold flex items-center gap-0.5">
            Claim rewards <ChevronRight className="h-2.5 w-2.5" />
          </span>
        </div>
      </div>

      {/* 4. VIP Tier Milestone & Progress Card */}
      {showTiers && (
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-foreground block">VIP Tier: {data.summary.tier}</span>
                <span className="text-[10px] text-muted-foreground">
                  {data.summary.tierDetails.nextTier
                    ? `${data.summary.tierDetails.progress}% to ${data.summary.tierDetails.nextTier}`
                    : 'Maximum Tier Achieved!'}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('milestones')}
              className="h-7 px-2.5 text-[11px] rounded-lg"
            >
              Roadmap <ChevronRight className="h-3 w-3 ml-0.5" />
            </Button>
          </div>

          {/* Tier Progress Bar */}
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500 transition-all duration-500"
              style={{ width: `${Math.max(8, data.summary.tierDetails.progress)}%` }}
            />
          </div>
        </div>
      )}

      {/* 5. Performance Trend Chart (Mobile Friendly) */}
      {showCharts && (
        <Card className="shadow-xs border-border">
          <CardHeader className="p-4 pb-2 flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-bold">Monthly Referrals</CardTitle>
              <p className="text-[11px] text-muted-foreground">Activity & rewards earned</p>
            </div>
            <Badge variant="secondary" className="text-[10px]">Past 6 Mo</Badge>
          </CardHeader>
          <CardContent className="h-[200px] p-2 pt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data.monthlyPerformance}
                margin={{ top: 10, right: 8, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="advocateChartGradMobile" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={6}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickMargin={6}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    borderColor: 'var(--border)',
                    borderRadius: 12,
                    background: 'var(--card)',
                    color: 'var(--card-foreground)',
                    fontSize: 12,
                  }}
                  formatter={(value: any, name: any) => [
                    name === 'rewards' ? `₹${value}` : value,
                    name === 'rewards' ? 'Rewards Earned' : name === 'orders' ? 'Orders' : 'Clicks',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="rewards"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#advocateChartGradMobile)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* 6. Recent Purchases Feed */}
      {showRecent && (
        <Card className="shadow-xs border-border">
          <CardHeader className="p-4 pb-2 flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-bold">Recent Friend Orders</CardTitle>
              <p className="text-[11px] text-muted-foreground">Orders through your links</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('orders')} className="h-7 text-xs">
              View all <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-1 space-y-2">
            {referrals.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
                No orders recorded yet. Share your store link with friends to get started!
              </div>
            ) : (
              referrals.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className="h-8 w-8 rounded-lg bg-teal/10 text-teal flex items-center justify-center shrink-0">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-foreground truncate">{item.orderName}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{item.customerMasked} • {item.storeName}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-primary">
                      +{money.format(item.rewardAmount)}
                    </div>
                    <Badge
                      variant={item.status === 'APPROVED' || item.status === 'PAID' ? 'default' : 'secondary'}
                      className="text-[9px] h-4 px-1"
                    >
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* 7. Quick Active Store Links */}
      <Card className="shadow-xs border-border">
        <CardHeader className="p-4 pb-2 flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-sm font-bold">Your Store Links</CardTitle>
            <p className="text-[11px] text-muted-foreground">Active referral channels</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('links')} className="h-7 text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" /> New Link
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-1 space-y-2">
          {links.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
              No active links created yet.
            </div>
          ) : (
            links.slice(0, 3).map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between p-2.5 rounded-xl border bg-muted/20"
              >
                <div className="min-w-0 pr-2">
                  <p className="font-bold text-xs truncate text-foreground">{link.store.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">
                    /r/{link.slug}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyLink(link.shareUrl)}
                  className="h-7 px-2.5 text-[11px] shrink-0"
                >
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
