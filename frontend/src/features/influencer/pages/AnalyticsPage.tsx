import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  ExternalLink,
  Layers,
  MousePointerClick,
  RefreshCw,
  Share2,
  ShoppingBag,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { PlatformPerformanceDashboard } from "@/components/app/PlatformPerformanceDashboard";
import {
  PlatformLinkGeneratorModal,
  type PlatformLinkItem,
} from "@/components/app/PlatformLinkGeneratorModal";
import { useAuthStore } from "@/stores/auth-store";
import { getInfluencerAnalytics } from "../api/analytics.api";
import { getInfluencerStoresOverview } from "../api/stores.api";
import { getInfluencerLinks } from "../api/links.api";

export function AnalyticsPage() { 
  const [range, setRange] = useState<string>("30d");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [isLinkHubOpen, setIsLinkHubOpen] = useState(false);
  const [activeLinkItem, setActiveLinkItem] = useState<PlatformLinkItem | null>(null);

  const user = useAuthStore((state) => state.user);

  // 1. Fetch influencer platform analytics
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["influencer", "analytics", range, selectedPlatform, selectedStore],
    queryFn: () => getInfluencerAnalytics(range, selectedPlatform, selectedStore),
  });

  // 2. Fetch stores for the creator
  const storesQuery = useQuery({
    queryKey: ["influencer", "stores-overview"],
    queryFn: getInfluencerStoresOverview,
  });

  // 3. Fetch creator's real affiliate links
  const linksQuery = useQuery({
    queryKey: ["influencer", "links", selectedStore],
    queryFn: () => getInfluencerLinks(selectedStore === "all" ? undefined : selectedStore),
  });

  const storesList = storesQuery.data?.stores?.map((s: any) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
  })) || data?.storesList || [];

  const platforms = data?.platformBreakdown ?? [];
  const timeline = data?.platformTimeline ?? [];

  const handleOpenLinkHub = (platformName?: string) => {
    const links = linksQuery.data?.links ?? [];
    const matchedLink =
      (selectedStore !== "all" ? links.find((l) => l.storeId === selectedStore) : null) ||
      links[0] ||
      null;

    const firstStore =
      storesQuery.data?.stores?.find((s: any) => selectedStore === "all" || s.id === selectedStore) ||
      storesQuery.data?.stores?.[0];

    const creatorName = user?.displayName || user?.name || "Creator";
    const creatorCode = user?.creatorCode || matchedLink?.creatorCode || null;

    if (matchedLink) {
      const defaultLink: PlatformLinkItem = {
        id: matchedLink.id,
        baseUrl: matchedLink.url || `/r/${matchedLink.slug}`,
        directUrl: matchedLink.directUrl,
        shopDomain: matchedLink.shopDomain,
        destinationPath: matchedLink.destinationPath,
        productName: matchedLink.productTitle,
        storeName: matchedLink.storeName || firstStore?.name || "Store",
        creatorName,
        creatorCode: matchedLink.creatorCode || creatorCode,
        commissionType: matchedLink.commissionType,
        commissionRate: matchedLink.commissionRate,
        commissionAmount: matchedLink.commissionAmount,
        slug: matchedLink.slug,
      };
      setActiveLinkItem(defaultLink);
    } else {
      const code = creatorCode || "CREATOR";
      const fallbackSlug = `promo-${code.toLowerCase()}`;
      const defaultLink: PlatformLinkItem = {
        id: "creator_storewide",
        baseUrl: `/r/${fallbackSlug}`,
        directUrl: firstStore?.shopDomain
          ? `https://${firstStore.shopDomain.replace(/^https?:\/\//, "").replace(/\/+$/, "")}/pages/shop?code=${fallbackSlug}`
          : null,
        shopDomain: firstStore?.shopDomain || null,
        destinationPath: "/",
        storeName: firstStore?.name || "Featured Store",
        creatorName,
        creatorCode: code,
        commissionRate: 10,
        slug: fallbackSlug,
      };
      setActiveLinkItem(defaultLink);
    }
    setIsLinkHubOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform-Wise Performance Analytics"
        description="Track and analyze link clicks, attributed conversions, and earnings across WhatsApp, Instagram, Facebook, and other channels."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenLinkHub()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:bg-primary/90 transition-all"
            >
              <Share2 className="h-3.5 w-3.5" /> Platform Link Hub
            </button>
          </div>
        }
      />

      {/* Main Platform Performance Dashboard with Graph and Table */}
      <PlatformPerformanceDashboard
        role="INFLUENCER"
        range={range}
        onRangeChange={setRange}
        selectedPlatform={selectedPlatform}
        onPlatformChange={setSelectedPlatform}
        platforms={platforms}
        timeline={timeline}
        isLoading={isLoading}
        isFetching={isFetching}
        onRefresh={() => void refetch()}
        storesList={storesList}
        selectedStore={selectedStore}
        onStoreChange={setSelectedStore}
        onOpenLinkHub={handleOpenLinkHub}
      />

      {/* Link Generator Modal */}
      <PlatformLinkGeneratorModal
        open={isLinkHubOpen}
        onOpenChange={setIsLinkHubOpen}
        linkItem={activeLinkItem}
      />
    </div>
  );
}
