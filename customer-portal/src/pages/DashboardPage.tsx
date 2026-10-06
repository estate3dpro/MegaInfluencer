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
import { PageHeader } from '@/components/app/PageHeader';
import { StatCard } from '@/components/app/StatCard';
import { StatusBadge } from '@/components/app/StatusBadge';
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
  const [copiedCode, setCopiedCode] = useState(false);
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
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    confetti({ particleCount: 40, spread: 50 });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  let shareText = config?.customShareMessage
    ? config.customShareMessage
        .replace('{friendDiscount}', `${data.summary.friendDiscountPercent}%`)
        .replace('{storeName}', storeName)
        .replace('{shareUrl}', shareUrl)
        .replace('{code}', data.summary.creatorCode)
    : `Get ${data.summary.friendDiscountPercent}% OFF at ${storeName}! Use my link: ${shareUrl} or promo code ${data.summary.creatorCode} at checkout! 🎁`;

  // Dynamic Offer Carousel Slides generated from store created & available offers
  const dynamicOfferSlides = (data.availableOffers && data.availableOffers.length > 0)
    ? data.availableOffers.map((offer, idx) => {
        const isOfferCashback = offer.rewardMode === 'CASHBACK_COMMISSION';
        const isOfferDiscount = offer.rewardMode === 'DISCOUNT_ONLY';
        const rewardLabel = isOfferCashback
          ? 'Cash Commission'
          : isOfferDiscount
          ? 'Store Credits'
          : 'Rewards';

        const badgeColors = [
          'bg-primary/10 text-primary',
          'bg-teal/10 text-teal',
          'bg-coral/10 text-coral',
          'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
          'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        ];
        const badgeColor = badgeColors[idx % badgeColors.length];

        return {
          id: offer.id,
          badge: offer.badgeText || `${offer.storeName} Active Offer`,
          badgeColor,
          storeName: offer.storeName,
          headline: (
            <>
              {offer.title.includes('%') ? (
                offer.title
              ) : (
                <>
                  Give <span className="text-coral">{offer.friendDiscountValue}% OFF</span>, Earn{' '}
                  <span className="text-primary">{offer.advocateRewardRate}% in {rewardLabel}</span>!
                </>
              )}
            </>
          ),
          description: offer.description || (isOfferCashback
            ? `Share your personal link or checkout promo code #${data.summary.creatorCode}. When friends buy at ${offer.storeName}, your cash wallet is credited on approval.`
            : `Share your personal link or checkout promo code #${data.summary.creatorCode}. When friends buy at ${offer.storeName}, you receive instant reward points.`),
          icon: Gift,
        };
      })
    : [
        {
          id: 'default-offer',
          badge: programTitle,
          badgeColor: 'bg-primary/10 text-primary',
          storeName,
          headline: (
            <>
              Give <span className="text-coral">{data.summary.friendDiscountPercent}% OFF</span>, Earn{' '}
              <span className="text-primary">
                {isCashback
                  ? `${data.summary.rewardRatePercent}% Cash Commission`
                  : isDiscountOnly
                  ? `${data.summary.rewardRatePercent}% Store Credits`
                  : `${data.summary.rewardRatePercent}% in Rewards`}
              </span>!
            </>
          ),
          description: isCashback
            ? 'Share your personal link or checkout promo code with friends. When they buy and the store approves the order, your cash wallet is credited for payouts.'
            : 'Share your personal link or checkout promo code with friends. When they buy, they get instant savings and your account gets rewarded with points and perks.',
          icon: Gift,
        },
      ];

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  React.useEffect(() => {
    setCurrentSlideIndex(0);
  }, [dynamicOfferSlides.length]);

  React.useEffect(() => {
    if (dynamicOfferSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % dynamicOfferSlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [dynamicOfferSlides.length]);

  const currentSlide = dynamicOfferSlides[currentSlideIndex % dynamicOfferSlides.length] || dynamicOfferSlides[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Page Header */}
      <PageHeader
        title={`Welcome back, Advocate`}
        description="A live view of your customer referral performance, attributed friend orders, and reward vault."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onNavigate('stores')}>
              <Store className="h-4 w-4 mr-1.5" /> Browse Stores
            </Button>
            {isPoints && (
              <Button size="sm" onClick={() => onNavigate('rewards')}>
                <Sparkles className="h-4 w-4 mr-1.5" /> Redeem Rewards
              </Button>
            )}
          </div>
        }
      />

      {/* 2. Automated Offers Carousel Division (No bullets, no controllers, automated shift) */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-indigo/5 shadow-card overflow-hidden">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Animated Offer Slide Content */}
            <div key={currentSlide.id} className="space-y-2 max-w-xl animate-in fade-in slide-in-from-right-2 duration-700">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={`${currentSlide.badgeColor} hover:${currentSlide.badgeColor} font-semibold text-xs transition-colors`}>
                  {currentSlide.badge}
                </Badge>
                <span className="text-xs text-muted-foreground">• {currentSlide.storeName || storeName}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground min-h-[3.5rem] flex items-center">
                {currentSlide.headline}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed min-h-[2.5rem]">
                {currentSlide.description}
              </p>
            </div>

            {/* Quick Link Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 bg-card p-2 rounded-xl border">
              <div className="px-3 py-2 text-xs font-mono text-foreground bg-muted/50 rounded-lg truncate max-w-xs select-all">
                {shareUrl}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleCopyLink(shareUrl)}
                  className="shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check className="h-4 w-4 mr-1" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" /> Copy Link
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedLinkForQr(shareUrl);
                    setQrModalOpen(true);
                  }}
                  title="Show QR Code"
                >
                  <QrCode className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank')}
                  title="Share on WhatsApp"
                  className="text-success hover:text-success"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Stat Cards Grid */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Link Clicks"
          value={number.format(data.summary.totalClicks)}
          hint={`${data.summary.conversionRate}% conversion`}
          icon={MousePointerClick}
          accent="indigo"
        />

        <StatCard
          label="Referred Orders"
          value={number.format(data.summary.totalReferralOrders)}
          hint="Orders placed by friends"
          icon={ShoppingBag}
          accent="coral"
        />

        <StatCard
          label="Attributed Sales"
          value={money.format(data.summary.totalSalesAmount)}
          hint="Sales volume generated"
          icon={CheckCircle2}
          accent="teal"
        />

        <StatCard
          label={isCashback ? "Cash Commission Balance" : isDiscountOnly ? "Store Credits" : "Points Balance"}
          value={
            isCashback || isDiscountOnly
              ? money.format(data.summary.totalRewardsEarned)
              : `${number.format(data.summary.pointsBalance)} pts`
          }
          hint={
            isCashback
              ? `₹${data.summary.pendingRewards} pending approval`
              : `₹${data.summary.totalRewardsEarned} total earned`
          }
          icon={Wallet}
          accent={isCashback ? "teal" : "primary"}
        />
      </section>

      {/* 4. Area Chart & VIP Tier Snapshot (Conditional based on config) */}
      {(showCharts || showTiers) && (
        <section className="grid gap-6 xl:grid-cols-3">
          {/* Earnings & Referrals Performance Area Chart */}
          {showCharts && (
            <Card className={`shadow-card ${showTiers ? 'xl:col-span-2' : 'xl:col-span-3'}`}>
              <CardHeader className="flex-row items-start justify-between space-y-0 p-5 pb-2">
                <div>
                  <CardTitle>Performance Trends</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Monthly referral activity, link visits and reward earnings
                  </p>
                </div>
                <Badge variant="secondary">Past 6 Months</Badge>
              </CardHeader>
              <CardContent className="h-[280px] p-3 pt-5 sm:p-5 sm:pt-5">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.monthlyPerformance}
                    margin={{ top: 10, right: 8, left: -16, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="advocateChartGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tickMargin={8}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderColor: 'var(--border)',
                        borderRadius: 10,
                        background: 'var(--card)',
                        color: 'var(--card-foreground)',
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
                      strokeWidth={2.5}
                      fill="url(#advocateChartGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* VIP Tier Snapshot Card */}
          {showTiers && (
            <Card className={`shadow-card ${showCharts ? '' : 'xl:col-span-3'}`}>
              <CardHeader className="p-5 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Advocate VIP Tier</CardTitle>
                  <Badge className="bg-primary text-primary-foreground font-bold">
                    {data.summary.tier}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Your milestone status & active perks</p>
              </CardHeader>
              <CardContent className="space-y-4 p-5 pt-1">
                <div className="rounded-xl bg-muted/40 p-3.5 space-y-2 border">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">
                      {data.summary.tierDetails.nextTier
                        ? `Progress to ${data.summary.tierDetails.nextTier}`
                        : 'Max Tier Achieved'}
                    </span>
                    <span className="font-mono text-primary font-bold">
                      {data.summary.tierDetails.progress}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.max(5, data.summary.tierDetails.progress)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Active Tier Perks:
                  </p>
                  <div className="space-y-1.5">
                    {data.summary.tierDetails.perks.map((perk, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-teal shrink-0" />
                        <span>{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('rewards')}
                  className="w-full text-xs"
                >
                  Explore Rewards Catalog <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* 5. Bottom 2-Column: Recent Purchases & Active Store Links */}
      <section className="grid gap-6 xl:grid-cols-3">
        {/* Recent Friend Purchases */}
        {showRecent && (
          <Card className="shadow-card xl:col-span-2">
            <CardHeader className="flex-row items-center justify-between space-y-0 p-5 pb-3">
              <div>
                <CardTitle>Recent Friend Purchases</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Latest orders placed through your referral links
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('orders')}>
                View all <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 p-5 pt-1">
              {referrals.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No purchases recorded yet. Share your store link to start tracking orders in real-time!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {referrals.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border bg-card hover:bg-muted/30 transition-colors gap-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-teal/10 text-teal flex items-center justify-center shrink-0">
                          <ShoppingBag className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-foreground">{item.orderName}</div>
                          <div className="text-xs text-muted-foreground">{item.customerMasked} • {item.storeName}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <div className="text-xs font-semibold text-primary">
                            +{money.format(item.rewardAmount)}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono">
                            Order: {money.format(item.orderAmount)}
                          </div>
                        </div>
                        <Badge
                          variant={item.status === 'APPROVED' || item.status === 'PAID' ? 'default' : 'secondary'}
                          className="text-[10px]"
                        >
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Store Links */}
        <Card className={`shadow-card ${showRecent ? '' : 'xl:col-span-3'}`}>
          <CardHeader className="flex-row items-center justify-between space-y-0 p-5 pb-3">
            <div>
              <CardTitle>Your Store Links</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Active referral channels</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onCreateLinkModal}>
              <Plus className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 p-5 pt-1">
            {links.length === 0 ? (
              <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
                No active links. Click + above to create one.
              </div>
            ) : (
              links.slice(0, 4).map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-3 rounded-xl border bg-muted/20"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-xs truncate">{link.store.name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono truncate">
                      /r/{link.slug}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyLink(link.shareUrl)}
                    className="h-8 text-xs shrink-0"
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      {/* QR Code Dialog */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>Referral QR Code</DialogTitle>
            <DialogDescription>
              Scan with camera to claim {data.summary.friendDiscountPercent}% discount at {storeName}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-4 bg-white rounded-xl my-2">
            <QRCodeSVG value={selectedLinkForQr} size={200} level="H" includeMargin />
          </div>
          <Button onClick={() => handleCopyLink(selectedLinkForQr)} className="w-full">
            <Copy className="h-4 w-4 mr-2" /> Copy Link
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};
