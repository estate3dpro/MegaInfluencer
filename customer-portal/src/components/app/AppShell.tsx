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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isPointsMode = referralConfig?.rewardMode === 'POINTS' || referralConfig?.rewardMode === 'HYBRID' || !referralConfig;
  const showRewardsCatalog = (referralConfig?.showRewardsStore ?? true) && isPointsMode;

  const navGroups = [
    {
      label: 'Overview',
      items: [
        { id: 'dashboard' as NavTab, title: 'Dashboard', icon: LayoutDashboard },
        { id: 'profile' as NavTab, title: 'Profile & Payouts', icon: UserRound },
      ],
    },
    {
      label: 'Commerce & Referrals',
      items: [
        { id: 'links' as NavTab, title: 'Store Links', icon: Link2 },
        { id: 'orders' as NavTab, title: 'Friend Orders', icon: ShoppingBag },
        { id: 'stores' as NavTab, title: 'Partner Stores', icon: Store },
      ],
    },
    {
      label: 'Competition & Milestones',
      items: [
        { id: 'leaderboard' as NavTab, title: 'Leaderboard', icon: Trophy },
        { id: 'milestones' as NavTab, title: 'Milestone Rewards', icon: Award },
      ],
    },
    ...(showRewardsCatalog
      ? [
          {
            label: 'Rewards & Loyalty',
            items: [
              { id: 'rewards' as NavTab, title: 'Rewards Store', icon: Gift },
              { id: 'claims' as NavTab, title: 'Claim History', icon: Receipt },
            ],
          },
        ]
      : []),
  ];

  const handleNavClick = (tab: NavTab) => {
    setActiveTab(tab);
    setMobileSidebarOpen(false);
  };

  const accountName = user?.displayName || 'Customer Advocate';
  const accountEmail = user?.email || 'advocate@example.com';

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col shrink-0 border-r border-sidebar-border bg-sidebar z-20">
        {/* Sidebar Header */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
          <img
            src="/logo/MI_Logo.svg"
            alt="MegaInfluencer"
            className="h-9 w-9 shrink-0 object-contain"
          />
          <div className="min-w-0">
            <span className="block truncate font-display text-sm font-semibold tracking-tight">
              MegaInfluencer
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              Customer Advocate
            </span>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                {group.label}
              </div>
              <div className="space-y-0.5 pt-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                      {item.id === 'rewards' && (
                        <span className="ml-auto inline-flex items-center rounded-full bg-coral/20 text-coral px-1.5 py-0.5 text-[10px] font-bold">
                          VIP
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-sidebar-border p-3">
          <div className="rounded-xl bg-sidebar-accent p-3 text-xs text-sidebar-accent-foreground">
            <div className="flex items-center justify-between font-semibold">
              <span>Advocate Workspace</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                {profile?.tier || 'BRONZE'}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
              Refer friends & earn up to 15% cashback & points
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-72 bg-sidebar border-r border-sidebar-border p-4 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-sidebar-border">
                <div className="flex items-center gap-2.5">
                  <img src="/logo/MI_Logo.svg" alt="MegaInfluencer" className="h-8 w-8" />
                  <div>
                    <div className="font-display text-sm font-bold">MegaInfluencer</div>
                    <div className="text-xs text-muted-foreground">Customer Advocate</div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setMobileSidebarOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                {navGroups.map((group) => (
                  <div key={group.label} className="space-y-1">
                    <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {group.label}
                    </div>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavClick(item.id)}
                          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium ${
                            isActive
                              ? 'bg-primary text-primary-foreground font-semibold'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="w-full text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-card/85 px-4 backdrop-blur md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden shrink-0"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <span className="hidden rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary lg:inline">
            Customer Advocate
          </span>

          {/* Search bar */}
          <div className="relative ml-2 hidden max-w-xs flex-1 lg:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search stores, links, purchases…"
              value={searchQuery}
              onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
              className="bg-background pl-9 h-9 text-xs"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Points / Wallet Balance Pill */}
            <button
              onClick={() => setActiveTab(isPointsMode ? 'rewards' : 'profile')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold transition-all cursor-pointer"
            >
              <Wallet className="h-3.5 w-3.5" />
              <span>
                {isPointsMode
                  ? `${profile?.pointsBalance?.toLocaleString() || 100} pts`
                  : `₹${(profile?.totalRewardsEarned ?? profile?.totalEarned ?? 0).toLocaleString()}`}
              </span>
            </button>

            {/* Dark/Light Mode Theme Toggle */}
            <ThemeToggle />

            {/* User Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="ml-1 flex items-center gap-2 rounded-full p-0.5 pr-2 transition-colors hover:bg-accent cursor-pointer"
                  aria-label="Account menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {initials(accountName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium xl:inline">{accountName}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">{accountName}</p>
                  <p className="text-xs font-normal text-muted-foreground truncate">{accountEmail}</p>
                  <p className="mt-1 text-xs font-mono font-normal text-primary">
                    Code: #{profile?.creatorCode || 'REF'}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setActiveTab('profile')}>
                  <UserRound className="h-4 w-4 mr-2" /> Profile & Payouts
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab('rewards')}>
                  <Gift className="h-4 w-4 mr-2" /> Rewards Vault
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
