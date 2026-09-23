import {
  Activity,
  BadgePercent,
  BarChart3,
  Blocks,
  Boxes,
  Building2,
  CircleDollarSign,
  Compass,
  CreditCard,
  FileBarChart,
  Filter,
  Gauge,
  Users2,
  Instagram,
  LayoutDashboard,
  Link2,
  Megaphone,
  MessageCircle,
  Package,
  Receipt,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Store as StoreIcon,
  UserCog,
  UserRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/features/auth/types";

export type { Role } from "@/features/auth/types";

export type NavItem = { title: string; url: string; icon: LucideIcon };
export type NavGroup = { label: string; items: NavItem[] };

export const roleMeta: Record<
  Role,
  { name: string; badge: string; home: string; person: string; org: string; tagline: string }
> = {
  influencer: {
    name: "Influencer",
    badge: "Creator",
    home: "/influencer/dashboard",
    person: "Meera Kapoor",
    org: "Creator workspace",
    tagline: "Grow your storefront, campaigns and earnings",
  },
  "store-admin": {
    name: "Store Admin",
    badge: "Brand",
    home: "/store-admin/dashboard",
    person: "Aarav Shah",
    org: "Urban Threads",
    tagline: "Commerce, creators and attribution in one place",
  },
  admin: {
    name: "Platform Admin",
    badge: "Platform",
    home: "/admin/dashboard",
    person: "Ananya Sharma",
    org: "Platform HQ",
    tagline: "Ecosystem governance, finance and health",
  },
};

export const influencerNav: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/influencer/dashboard", icon: LayoutDashboard },
      { title: "Profile", url: "/influencer/profile", icon: UserRound },
    ],
  },
  {
    label: "Grow",
    items: [
      { title: "Discover", url: "/influencer/discover", icon: Compass },
      // { title: "Campaigns", url: "/influencer/campaigns", icon: Megaphone },
      { title: "Instagram Automation", url: "/influencer/instagram-automation", icon: Instagram },
    ],
  },
  {
    label: "Sell",
    items: [
      { title: "My Store", url: "/influencer/store", icon: Store },
      { title: "Products", url: "/influencer/products", icon: Package },
      { title: "Links", url: "/influencer/links", icon: Link2 },
      { title: "Orders", url: "/influencer/orders", icon: ShoppingBag },
      { title: "Earnings", url: "/influencer/earnings", icon: Wallet },
    ],
  },
];

export const storeAdminNav: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/store-admin/dashboard", icon: LayoutDashboard },
      { title: "Analytics", url: "/store-admin/analytics", icon: BarChart3 },
      { title: "Reports", url: "/store-admin/reports", icon: FileBarChart },
    ],
  },
  {
    label: "Commerce",
    items: [
      { title: "Products", url: "/store-admin/products", icon: Package },
      { title: "Orders", url: "/store-admin/orders", icon: ShoppingCart },
      { title: "Customers", url: "/store-admin/customers", icon: Users2 },
      { title: "Discounts", url: "/store-admin/discounts", icon: BadgePercent },
    ],
  },
  {
    label: "Creators",
    items: [
      { title: "Creators", url: "/store-admin/creators", icon: Sparkles },
      { title: "All Creators", url: "/store-admin/creator-directory", icon: Users2 },
      { title: "Campaigns", url: "/store-admin/campaigns", icon: Megaphone },
      { title: "Affiliate", url: "/store-admin/affiliate", icon: Filter },
      { title: "Commissions", url: "/store-admin/commissions", icon: CircleDollarSign },
    ],
  },
  {
    label: "Setup",
    items: [
      { title: "Store", url: "/store-admin/store", icon: StoreIcon },
      { title: "Integrations", url: "/store-admin/integrations", icon: Blocks },
      { title: "Settings", url: "/store-admin/settings", icon: Settings },
    ],
  },
];

export const adminNav: NavGroup[] = [
  {
    label: "Command center",
    items: [
      { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
      { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
      { title: "Attribution", url: "/admin/attribution", icon: Filter },
      { title: "System", url: "/admin/system", icon: Activity },
    ],
  },
  {
    label: "Ecosystem",
    items: [
      { title: "Influencers", url: "/admin/influencers", icon: Sparkles },
      { title: "All Creators", url: "/admin/creators", icon: Users2 },
      { title: "Stores", url: "/admin/stores", icon: StoreIcon },
      { title: "Brands", url: "/admin/brands", icon: Building2 },
      { title: "Products", url: "/admin/products", icon: Boxes },
      { title: "Campaigns", url: "/admin/campaigns", icon: Megaphone },
      { title: "Social Accounts", url: "/admin/social", icon: Instagram },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Orders", url: "/admin/orders", icon: ShoppingCart },
      { title: "Commissions", url: "/admin/commissions", icon: CircleDollarSign },
      { title: "Payouts", url: "/admin/payouts", icon: CreditCard },
      { title: "Finance", url: "/admin/finance", icon: Receipt },
    ],
  },
  {
    label: "Governance",
    items: [
      { title: "Users & Roles", url: "/admin/users", icon: UserCog },
      { title: "Integrations", url: "/admin/integrations", icon: Blocks },
      { title: "Reports", url: "/admin/reports", icon: FileBarChart },
      { title: "Settings", url: "/admin/settings", icon: Gauge },
    ],
  },
];

export const navByRole: Record<Role, NavGroup[]> = {
  influencer: influencerNav,
  "store-admin": storeAdminNav,
  admin: adminNav,
};
