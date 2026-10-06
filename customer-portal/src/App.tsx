import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { AppShell, type NavTab } from './components/app/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { StoreLinksPage } from './pages/StoreLinksPage';
import { OrdersPage } from './pages/OrdersPage';
import { PartnerStoresPage } from './pages/PartnerStoresPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { MilestonesPage } from './pages/MilestonesPage';
import { RewardsStorePage } from './pages/RewardsStorePage';
import { ProfilePage } from './pages/ProfilePage';
import { Toaster } from './components/ui/sonner';
import {
  api,
  type DashboardData,
  type ReferralLink,
  type Store,
  type RewardItem,
  type RewardClaim,
  type ReferralTransaction,
} from './lib/api';
import { Loader2 } from 'lucide-react';

const CustomerPortalApp: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [links, setLinks] = useState<ReferralLink[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [rewardsCatalog, setRewardsCatalog] = useState<RewardItem[]>([]);
  const [rewardClaims, setRewardClaims] = useState<RewardClaim[]>([]);
  const [referralsList, setReferralsList] = useState<ReferralTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadAllData = async () => {
    try {
      const [dash, linksRes, storesRes, rewardsRes, refsRes] = await Promise.all([
        api.customer.getDashboard(),
        api.customer.getReferralLinks(),
        api.customer.getStores(),
        api.customer.getRewards(),
        api.customer.getReferrals(),
      ]);

      setDashboardData(dash);
      setLinks(linksRes.links);
      setStores(storesRes.stores);
      setRewardsCatalog(rewardsRes.catalog);
      setRewardClaims(rewardsRes.claims);
      setReferralsList(refsRes.referrals);
    } catch (err) {
      console.error('Failed to load advocate portal data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (window.location.pathname.startsWith('/r/')) {
      const slug = window.location.pathname.replace(/^\/r\//, '');
      const search = window.location.search || '';
      const rawApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      let apiOrigin = 'http://localhost:3000';
      try {
        apiOrigin = new URL(rawApiUrl).origin;
      } catch {
        apiOrigin = rawApiUrl.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
      }
      window.location.replace(`${apiOrigin}/r/${slug}${search}`);
      return;
    }
    loadAllData();
  }, []);

  const handleCreateLink = async (storeId: string, customSlug?: string) => {
    await api.customer.createReferralLink({ storeId, customSlug });
    await loadAllData();
  };

  const handleClaimReward = async (item: RewardItem, payoutAccount?: string) => {
    const res = await api.customer.claimReward({
      rewardId: item.id,
      storeId: item.storeId,
      rewardType: item.type,
      pointsCost: item.pointsCost,
      rewardValue: item.value,
      rewardTitle: item.title,
      couponCode: item.couponCode,
      productName: item.productName,
      productLink: item.productLink,
      payoutAccount,
    });
    await loadAllData();
    await refreshProfile();
    return res;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground space-y-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground font-medium">Loading advocate portal…</p>
      </div>
    );
  }

  return (
    <AppShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      referralConfig={dashboardData?.referralConfig}
    >
      {activeTab === 'dashboard' && dashboardData && (
        <DashboardPage
          data={dashboardData}
          links={links}
          stores={stores}
          referrals={referralsList}
          onNavigate={setActiveTab}
          onCreateLinkModal={() => setActiveTab('links')}
        />
      )}

      {activeTab === 'links' && (
        <StoreLinksPage
          links={links}
          stores={stores}
          onCreateLink={handleCreateLink}
        />
      )}

      {activeTab === 'orders' && (
        <OrdersPage referrals={referralsList} />
      )}

      {activeTab === 'stores' && (
        <PartnerStoresPage
          stores={stores}
          onGenerateLink={async (storeId) => {
            await handleCreateLink(storeId);
            setActiveTab('links');
          }}
        />
      )}

      {activeTab === 'leaderboard' && (
        <LeaderboardPage onNavigateToLinks={() => setActiveTab('links')} />
      )}

      {activeTab === 'milestones' && (
        <MilestonesPage
          onRefreshStats={async () => {
            await loadAllData();
            await refreshProfile();
          }}
          onNavigateToRewards={() => setActiveTab('rewards')}
        />
      )}

      {(activeTab === 'rewards' || activeTab === 'claims') && (
        <RewardsStorePage
          pointsBalance={profile?.pointsBalance || 100}
          catalog={rewardsCatalog}
          claims={rewardClaims}
          onClaimReward={handleClaimReward}
        />
      )}

      {activeTab === 'profile' && profile && (
        <ProfilePage
          profile={profile}
          onRefresh={loadAllData}
        />
      )}
    </AppShell>
  );
};

const AuthGate: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground space-y-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground font-medium">Initializing session…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <CustomerPortalApp />;
};

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
      <Toaster />
    </AuthProvider>
  );
}
