import React, { useState } from 'react';
import { Sparkles, Award, Wallet, User, LogOut, Settings, ExternalLink, Store as StoreIcon, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenProfile: () => void;
  onOpenStores: () => void;
  activeTab: 'dashboard' | 'links' | 'rewards' | 'referrals';
  setActiveTab: (tab: 'dashboard' | 'links' | 'rewards' | 'referrals') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenProfile, onOpenStores, activeTab, setActiveTab }) => {
  const { user, profile, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'PLATINUM':
        return 'from-purple-500 to-indigo-500 border-purple-400 text-purple-200';
      case 'GOLD':
        return 'from-amber-400 to-yellow-500 border-amber-300 text-amber-100';
      case 'SILVER':
        return 'from-slate-300 to-slate-400 border-slate-300 text-slate-100';
      default:
        return 'from-amber-700 to-amber-800 border-amber-600 text-amber-200';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-2 ring-white/10">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  MegaAdvocate
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                  Customer Portal
                </span>
              </div>
              <p className="text-xs text-slate-400">Refer Stores & Earn VIP Rewards</p>
            </div>
          </div>

          {/* Navigation Tabs (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-xl border border-white/5 ml-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('links')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'links'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Store Links
            </button>
            <button
              onClick={() => setActiveTab('referrals')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'referrals'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Activity & History
            </button>
            <button
              onClick={() => setActiveTab('rewards')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all relative ${
                activeTab === 'rewards'
                  ? 'bg-gradient-to-r from-pink-600 to-indigo-600 text-white shadow-md shadow-pink-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>Rewards Store</span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-pink-500 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-pink-500 rounded-full" />
            </button>
          </nav>
        </div>

        {/* Right Badges & Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Explore Stores Button */}
          <button
            onClick={onOpenStores}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/10 transition-all hover:border-indigo-500/50"
          >
            <StoreIcon className="w-4 h-4 text-indigo-400" />
            <span>Browse Stores</span>
          </button>

          {/* Points Badge */}
          <div
            onClick={() => setActiveTab('rewards')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-500/30 cursor-pointer hover:border-amber-400 transition-all shadow-sm"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 shadow-inner">
              <Wallet className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[10px] text-amber-300/80 font-semibold uppercase leading-none">Balance</div>
              <div className="text-xs font-bold text-amber-300 leading-tight">
                {profile?.pointsBalance?.toLocaleString() || 100} pts
              </div>
            </div>
          </div>

          {/* Tier Badge */}
          <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r border ${getTierColor(profile?.tier)}`}>
            <Award className="w-4 h-4" />
            <span className="text-xs font-bold tracking-wider">
              {profile?.tier || 'BRONZE'} ADVOCATE
            </span>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl bg-slate-900 border border-white/10 hover:border-indigo-500/40 transition-all text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center font-bold text-indigo-300 text-sm">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'C'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-white leading-tight max-w-[100px] truncate">
                  {user?.displayName || 'Customer'}
                </div>
                <div className="text-[10px] font-mono text-indigo-400 leading-none">
                  #{profile?.creatorCode || 'REF'}
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-56 glass-panel rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setDropdownOpen(false)}
              >
                <div className="px-3 py-2 border-b border-white/10 mb-1">
                  <p className="text-xs font-medium text-slate-400">Signed in as</p>
                  <p className="text-sm font-bold text-white truncate">{user?.email}</p>
                  <p className="text-[11px] text-indigo-400 font-mono mt-0.5">Code: {profile?.creatorCode}</p>
                </div>

                <button
                  onClick={onOpenProfile}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  <Settings className="w-4 h-4 text-indigo-400" />
                  <span>Profile & Payout Settings</span>
                </button>

                <button
                  onClick={onOpenStores}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  <StoreIcon className="w-4 h-4 text-purple-400" />
                  <span>Explore Partner Stores</span>
                </button>

                <div className="border-t border-white/10 my-1" />

                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Tabs */}
      <div className="md:hidden flex items-center justify-around border-t border-white/5 bg-slate-900/80 px-2 py-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
            activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('links')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
            activeTab === 'links' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          Store Links
        </button>
        <button
          onClick={() => setActiveTab('referrals')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
            activeTab === 'referrals' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          Activity
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
            activeTab === 'rewards' ? 'bg-gradient-to-r from-pink-600 to-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          Rewards
        </button>
      </div>
    </header>
  );
};
