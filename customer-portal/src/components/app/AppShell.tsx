import React, { useState } from 'react';
import {
  LayoutDashboard,
  Link2,
  ShoppingBag,
  Store,
  Gift,
  Receipt,
  UserRound,
  LogOut,
  Search,
  Menu,
  X,
  Wallet,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Trophy,
  Award,
  Share2,
  Home,
  Percent,
  Sliders,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/lib/theme';
import { initials } from '@/lib/format';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { type ReferralConfig } from '@/lib/api';

export type NavTab = 'dashboard' | 'links' | 'orders' | 'stores' | 'leaderboard' | 'milestones' | 'rewards' | 'claims' | 'profile';

interface AppShellProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  children: React.ReactNode;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  referralConfig?: ReferralConfig | null;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  setActiveTab,
  children,
  searchQuery = '',
  setSearchQuery,
  referralConfig,
}) => {
  const { user, profile, logout } = useAuth();
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);

  const isPointsMode = referralConfig?.rewardMode === 'POINTS' || referralConfig?.rewardMode === 'HYBRID' || !referralConfig;
  const showRewardsCatalog = (referralConfig?.showRewardsStore ?? true) && isPointsMode;

  const accountName = user?.displayName || 'Customer Advocate';
  const accountEmail = user?.email || 'advocate@example.com';
  const userTier = profile?.tier || 'BRONZE';

  const tierColors: Record<string, string> = {
    BRONZE: 'bg-amber-600/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    SILVER: 'bg-slate-400/15 text-slate-600 dark:text-slate-300 border-slate-400/30',
    GOLD: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
    PLATINUM: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
  };

  const navGroups = [
    {
      label: 'Main',
      items: [
        { id: 'dashboard' as NavTab, title: 'Home Dashboard', icon: Home },
        { id: 'links' as NavTab, title: 'Referral Links', icon: Link2 },
        { id: 'orders' as NavTab, title: 'Referred Orders', icon: ShoppingBag },
        { id: 'rewards' as NavTab, title: 'Rewards Store', icon: Gift },
        { id: 'profile' as NavTab, title: 'Profile & Payouts', icon: UserRound },
      ],
    },
    {
      label: 'Explore & Growth',
      items: [
        { id: 'stores' as NavTab, title: 'Partner Stores', icon: Store },
        { id: 'leaderboard' as NavTab, title: 'Advocate Leaderboard', icon: Trophy },
        { id: 'milestones' as NavTab, title: 'Tier Milestones', icon: Award },
        { id: 'claims' as NavTab, title: 'Redemption Claims', icon: Receipt },
      ],
    },
  ];

  const handleNavClick = (tab: NavTab) => {
    setActiveTab(tab);
    setMoreDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between font-sans selection:bg-primary/20">
      {/* Top Mobile/Responsive App Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-lg px-4 sm:px-6 py-2.5 transition-all">
        <div className="max-w-2xl lg:max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Brand Logo & Tier Pill */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2 text-left cursor-pointer group"
            >
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-violet-500 p-0.5 shadow-md shadow-primary/20 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-sm font-bold tracking-tight text-foreground truncate">
                    MegaAdvocate
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 h-4 uppercase font-mono font-semibold ${
                      tierColors[userTier] || 'bg-primary/10 text-primary'
                    }`}
                  >
                    {userTier}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  #{profile?.creatorCode || 'REF'}
                </p>
              </div>
            </button>
          </div>

          {/* Right Header Actions (Wallet Pill + Theme + Profile Menu) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Wallet Token Balance Chip */}
            <button
              onClick={() => setActiveTab(isPointsMode ? 'rewards' : 'profile')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Wallet className="h-3.5 w-3.5 text-amber-500" />
              <span>
                {isPointsMode
                  ? `${(profile?.pointsBalance ?? 100).toLocaleString()} pts`
                  : `₹${(profile?.totalRewardsEarned ?? profile?.totalEarned ?? 0).toLocaleString()}`}
              </span>
            </button>

            {/* Dark/Light Theme Toggle */}
            <ThemeToggle />

            {/* User Dropdown / More Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="rounded-full p-0.5 hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer"
                  aria-label="Account menu"
                >
                  <Avatar className="h-8 w-8 border border-border shadow-sm">
                    <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                      {initials(accountName)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-xl">
                <DropdownMenuLabel className="p-2">
                  <p className="text-xs font-bold text-foreground truncate">{accountName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{accountEmail}</p>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                    <span>Code:</span>
                    <span className="font-bold">#{profile?.creatorCode || 'REF'}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setActiveTab('profile')} className="text-xs cursor-pointer py-2">
                  <UserRound className="h-4 w-4 mr-2 text-primary" /> Profile & Payout Info
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('leaderboard')} className="text-xs cursor-pointer py-2">
                  <Trophy className="h-4 w-4 mr-2 text-amber-500" /> Advocate Leaderboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('milestones')} className="text-xs cursor-pointer py-2">
                  <Award className="h-4 w-4 mr-2 text-violet-500" /> Tier Roadmap
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-xs text-destructive focus:text-destructive cursor-pointer py-2">
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content Viewport (Mobile First Container) */}
      <main className="flex-1 w-full max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-6 pt-4 pb-28">
        {children}
      </main>

      {/* Modern Mobile Bottom Navigation Bar (Dock) */}
      <div className="fixed bottom-0 inset-x-0 z-50 p-2 sm:p-3 pointer-events-none">
        <nav className="max-w-md sm:max-w-lg mx-auto bg-background/95 backdrop-blur-xl border border-border/80 rounded-2xl sm:rounded-3xl shadow-2xl p-1.5 flex items-center justify-around pointer-events-auto transition-all">
          {/* 1. Home Dashboard */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
              activeTab === 'dashboard'
                ? 'text-primary font-bold bg-primary/10 shadow-sm scale-105'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            <Home className="h-5 w-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Home</span>
          </button>

          {/* 2. Referral Links / Share */}
          <button
            onClick={() => setActiveTab('links')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
              activeTab === 'links'
                ? 'text-primary font-bold bg-primary/10 shadow-sm scale-105'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            <Link2 className="h-5 w-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Links</span>
          </button>

          {/* Center Floating Action Button (Quick Share Trigger) */}
          <button
            onClick={() => setActiveTab('links')}
            className="flex items-center justify-center h-11 w-11 -mt-4 rounded-full bg-gradient-to-tr from-primary to-violet-600 text-white shadow-lg shadow-primary/30 hover:scale-110 active:scale-95 transition-all cursor-pointer border-2 border-background"
            aria-label="Create or share link"
          >
            <Share2 className="h-5 w-5" />
          </button>

          {/* 3. Friend Orders */}
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
              activeTab === 'orders'
                ? 'text-primary font-bold bg-primary/10 shadow-sm scale-105'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            <ShoppingBag className="h-5 w-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Orders</span>
          </button>

          {/* 4. Rewards Store */}
          <button
            onClick={() => setActiveTab('rewards')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl relative transition-all ${
              activeTab === 'rewards'
                ? 'text-primary font-bold bg-primary/10 shadow-sm scale-105'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            <Gift className="h-5 w-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Rewards</span>
            {showRewardsCatalog && (
              <span className="absolute top-1 right-2.5 h-2 w-2 rounded-full bg-coral animate-pulse" />
            )}
          </button>

          {/* 5. More / Profile Drawer */}
          <button
            onClick={() => setMoreDrawerOpen(true)}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
              activeTab === 'profile' || activeTab === 'stores' || activeTab === 'leaderboard' || activeTab === 'milestones'
                ? 'text-primary font-bold bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            <Menu className="h-5 w-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">More</span>
          </button>
        </nav>
      </div>

      {/* Bottom Sheet / Mobile Drawer for Extra Features */}
      {moreDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setMoreDrawerOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-background border-t sm:border border-border rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-250"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30 mx-auto" />

            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">More Advocate Features</h3>
                <p className="text-xs text-muted-foreground">Explore stores, rankings, and milestones.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMoreDrawerOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => handleNavClick('profile')}
                className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-card hover:bg-muted/40 text-left transition-all"
              >
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-bold block text-foreground">Profile & Payouts</span>
                  <span className="text-[10px] text-muted-foreground">UPI & Bank details</span>
                </div>
              </button>

              <button
                onClick={() => handleNavClick('stores')}
                className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-card hover:bg-muted/40 text-left transition-all"
              >
                <div className="h-9 w-9 rounded-xl bg-teal/10 text-teal flex items-center justify-center shrink-0">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-bold block text-foreground">Partner Stores</span>
                  <span className="text-[10px] text-muted-foreground">Discover brands</span>
                </div>
              </button>

              <button
                onClick={() => handleNavClick('leaderboard')}
                className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-card hover:bg-muted/40 text-left transition-all"
              >
                <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-bold block text-foreground">Leaderboard</span>
                  <span className="text-[10px] text-muted-foreground">Top advocates</span>
                </div>
              </button>

              <button
                onClick={() => handleNavClick('milestones')}
                className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-card hover:bg-muted/40 text-left transition-all"
              >
                <div className="h-9 w-9 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-bold block text-foreground">Milestones</span>
                  <span className="text-[10px] text-muted-foreground">VIP Tier Perks</span>
                </div>
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="w-full text-destructive hover:bg-destructive/10 rounded-xl mt-2"
            >
              <LogOut className="h-4 w-4 mr-2" /> Sign Out of Advocate Portal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
