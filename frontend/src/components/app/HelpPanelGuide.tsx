import { useState, useRef } from "react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  BadgePercent,
  BarChart3,
  BookOpen,
  Boxes,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Compass,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  FileBarChart,
  Filter,
  Gift,
  HelpCircle,
  Instagram,
  Layers,
  LayoutDashboard,
  Link2,
  Megaphone,
  MessageSquare,
  Package,
  Play,
  Receipt,
  RotateCcw,
  RotateCw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Truck,
  UserRound,
  Users2,
  Video,
  Wallet,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PageHeader } from "@/components/app/PageHeader";
import type { Role } from "@/features/auth/types";

export type RoleVideoChapter = {
  time: number;
  timeFormatted: string;
  title: string;
  desc: string;
};

export type RoleVideo = {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  src: string;
  fileSize: string;
  chapters: RoleVideoChapter[];
  highlights: string[];
};

type GuideSection = {
  id: string;
  title: string;
  icon: any;
  summary: string;
  badge?: string;
  steps: Array<{ title: string; desc: string }>;
  quickLink?: { label: string; url: string };
};

/* -------------------------------------------------------------------------- */
/* ROLE-ISOLATED VIDEO CONFIGURATIONS                                         */
/* Hosted on Shopify Global CDN for high-speed streaming without repo bloat   */
/* -------------------------------------------------------------------------- */

const SHOPIFY_CDN_VIDEOS = {
  // Megainfluncer use.mp4 (493 MB) -> Complete Platform Tour, Campaigns & Attribution
  platformTour: "https://cdn.shopify.com/videos/c/o/v/d3954ce2b41c4bf6aababb4f9d78cf4b.mp4",
  // register.mp4 (36 MB) -> Onboarding & Setup for Creators & Brands
  onboarding: "https://cdn.shopify.com/videos/c/o/v/e39a631163ae484d9b9eb5790fa75685.mp4",
  // megainfluncer meta video.mp4 (35 MB) -> Meta & Instagram API Automation
  metaAutomation: "https://cdn.shopify.com/videos/c/o/v/52828a7e69ad4453af23d9490f509162.mp4",
};

const roleVideos: Record<Role, RoleVideo[]> = {
  // ==========================================
  // 1. INFLUENCER / CREATOR PANEL VIDEOS
  // ==========================================
  influencer: [
    {
      id: "creator-onboarding",
      title: "Creator Onboarding & Account Setup",
      subtitle:
        "Complete walkthrough on setting up your creator profile, linking your Instagram handle, and configuring payout bank/UPI details.",
      badge: "Quickstart Guide",
      src: SHOPIFY_CDN_VIDEOS.onboarding,
      fileSize: "34.5 MB",
      chapters: [
        {
          time: 0,
          timeFormatted: "0:00",
          title: "Creator Account Registration",
          desc: "Create your creator credentials and complete basic identity verification.",
        },
        {
          time: 25,
          timeFormatted: "0:25",
          title: "Linking Instagram Handle & Profile Bio",
          desc: "Connect your Instagram profile handle and select your content niche (Fashion, Tech, Lifestyle).",
        },
        {
          time: 60,
          timeFormatted: "1:00",
          title: "Setting Up Payout Details",
          desc: "Configure UPI ID or Bank Account details for instant earnings settlement.",
        },
        {
          time: 105,
          timeFormatted: "1:45",
          title: "Entering Creator Dashboard",
          desc: "Explore active brand deals, link generators, and performance tracking.",
        },
      ],
      highlights: [
        "Frictionless onboarding in under 3 minutes for creators",
        "Direct UPI and bank transfer payout configuration",
        "Profile verification linking your public Instagram handle",
        "Instant access to curated brand marketplace campaigns",
      ],
    },
    {
      id: "creator-instagram-automation",
      title: "Instagram Automation & DM Link Delivery",
      subtitle:
        "Connect your Instagram Professional account to automatically send tracked affiliate product links when followers comment keywords on your posts.",
      badge: "Social Automation",
      src: SHOPIFY_CDN_VIDEOS.metaAutomation,
      fileSize: "33.3 MB",
      chapters: [
        {
          time: 0,
          timeFormatted: "0:00",
          title: "Connecting Instagram Professional Account",
          desc: "Authenticate via Meta OAuth to enable automated comment listening.",
        },
        {
          time: 35,
          timeFormatted: "0:35",
          title: "Configuring Comment Keyword Triggers",
          desc: "Set trigger keywords like 'LINK', 'SHOP', or 'DRESS' for your posts.",
        },
        {
          time: 75,
          timeFormatted: "1:15",
          title: "Live Comment Trigger & Instant DM",
          desc: "Follower comments on your reel/post and receives an immediate private DM with your link.",
        },
        {
          time: 120,
          timeFormatted: "2:00",
          title: "Commission Attribution on Fan Purchases",
          desc: "Every purchase made via your automated DM link earns you tracked commission.",
        },
      ],
      highlights: [
        "Automatic link dispatch 24/7 without manual messaging effort",
        "Zero spam guarantee: DMs are only sent when followers explicitly request a link",
        "Fully compliant with Meta & Instagram Graph API v20+ platform standards",
        "Drastically boosts link click-through and sales conversion rates",
      ],
    },
    {
      id: "creator-storefront-campaigns",
      title: "Storefront Links, Barter Shipments & Earnings",
      subtitle:
        "Learn how to apply for brand campaigns, generate trackable short links (/r/:code), track barter sample product shipments, and withdraw earnings.",
      badge: "Campaigns & Earnings",
      src: SHOPIFY_CDN_VIDEOS.platformTour,
      fileSize: "470 MB",
      chapters: [
        {
          time: 0,
          timeFormatted: "0:00",
          title: "Browsing & Applying to Brand Campaigns",
          desc: "Explore deals across Barter, Fixed Fee, Commission-only, and Hybrid models.",
        },
        {
          time: 90,
          timeFormatted: "1:30",
          title: "Barter Product Sample Delivery Tracking",
          desc: "Track carrier shipment details and package delivery codes directly in your earnings tab.",
        },
        {
          time: 195,
          timeFormatted: "3:15",
          title: "Generating Custom Shortened Links (/r/:code)",
          desc: "Copy and share unique affiliate links for individual brand products or entire collections.",
        },
        {
          time: 285,
          timeFormatted: "4:45",
          title: "Monitoring Clicks, Conversions & Commission Balances",
          desc: "Inspect real-time analytics showing how much revenue and commission you have generated.",
        },
      ],
      highlights: [
        "Support for all 4 compensation models: Barter, Fixed, Commission, and Hybrid",
        "Track courier status and tracking numbers for complimentary product samples",
        "Clean, shareable /r/:code URLs that redirect fans smoothly into store checkout",
        "Real-time transparent earnings ledger with automated monthly settlements",
      ],
    },
  ],

  // ==========================================
  // 2. STORE ADMIN / BRAND PANEL VIDEOS
  // ==========================================
  "store-admin": [
    {
      id: "store-onboarding",
      title: "Brand Store Setup & Catalog Synchronization",
      subtitle:
        "How merchant brands register, connect their Shopify storefronts, sync live catalogs, and configure influencer commission rates.",
      badge: "Merchant Setup",
      src: SHOPIFY_CDN_VIDEOS.onboarding,
      fileSize: "34.5 MB",
      chapters: [
        {
          time: 0,
          timeFormatted: "0:00",
          title: "Brand Merchant Registration",
          desc: "Create your brand workspace and set up store manager access.",
        },
        {
          time: 40,
          timeFormatted: "0:40",
          title: "Connecting Your Shopify Storefront",
          desc: "Authorize the MegaInfluencer integration with your Shopify domain and API tokens.",
        },
        {
          time: 75,
          timeFormatted: "1:15",
          title: "Syncing Products, Collections & Inventory",
          desc: "Automated catalog import pulling live products, pricing, and stock levels.",
        },
        {
          time: 110,
          timeFormatted: "1:50",
          title: "Setting Base Commission Rates & Storefront Branding",
          desc: "Establish default commission percentages and creator storefront rules.",
        },
      ],
      highlights: [
        "Effortless Shopify catalog sync keeping product prices and inventory in sync",
        "Flexible commission setup per product, collection, or campaign tier",
        "Custom branded creator portal matching your brand identity",
        "Secure merchant credentials with encrypted token storage",
      ],
    },
    {
      id: "store-instagram-commerce",
      title: "Instagram Social Commerce & Traffic Conversion",
      subtitle:
        "How Meta and Instagram integration converts social engagement into high-converting referral traffic and direct Shopify orders.",
      badge: "Social Commerce",
      src: SHOPIFY_CDN_VIDEOS.metaAutomation,
      fileSize: "33.3 MB",
      chapters: [
        {
          time: 0,
          timeFormatted: "0:00",
          title: "How Creator Social Commerce Works",
          desc: "Understanding how influencer posts drive high-intent shoppers to your store.",
        },
        {
          time: 45,
          timeFormatted: "0:45",
          title: "Automated Link Dispatch Driving Store Traffic",
          desc: "Followers who comment receive personalized direct links straight into their DMs.",
        },
        {
          time: 90,
          timeFormatted: "1:30",
          title: "Shopify Cart Attribution with mi_link Tags",
          desc: "How referrals are injected into cart notes and preserved through checkout.",
        },
        {
          time: 135,
          timeFormatted: "2:15",
          title: "Verified Order Conversion Webhooks",
          desc: "Orders trigger webhooks verifying real sales before commission is recorded.",
        },
      ],
      highlights: [
        "Transforms Instagram comments into direct Shopify cart checkouts",
        "Accurate referral attribution passed through checkout note_attributes",
        "Protects against spam and non-compliant automated messaging",
        "Increases return on ad spend (ROAS) through organic creator advocacy",
      ],
    },
    {
      id: "store-campaign-operations",
      title: "Managing Creators, Campaigns & Barter Logistics",
      subtitle:
        "Create campaigns across 4 models, review creator applications, dispatch barter sample shipments, and audit order attribution.",
      badge: "Campaign Management",
      src: SHOPIFY_CDN_VIDEOS.platformTour,
      fileSize: "470 MB",
      chapters: [
        {
          time: 0,
          timeFormatted: "0:00",
          title: "Launching Brand Campaigns (4 Deal Models)",
          desc: "Set up Fixed Fee, Barter, Commission-only, or Hybrid creator deals.",
        },
        {
          time: 75,
          timeFormatted: "1:15",
          title: "Reviewing & Approving Influencer Applications",
          desc: "Assess applicant follower metrics, engagement rates, and proposed deliverables.",
        },
        {
          time: 150,
          timeFormatted: "2:30",
          title: "Fulfilling Barter Samples & Adding Carrier Tracking",
          desc: "Input courier name and tracking code so accepted creators can track sample delivery.",
        },
        {
          time: 240,
          timeFormatted: "4:00",
          title: "Shopify Order Attribution & Commission Settlement",
          desc: "Review attributed orders, gross revenue driven, and approve commission payouts.",
        },
      ],
      highlights: [
        "Comprehensive deal management across Fixed, Barter, Commission, and Hybrid models",
        "Built-in barter sample logistics keeping creators updated with tracking numbers",
        "Automated commission restriction preventing double payouts on barter-only deals",
        "Real-time sales attribution reports showing exact creator ROI and order breakdowns",
      ],
    },
  ],

  // ==========================================
  // 3. PLATFORM ADMIN PANEL VIDEOS
  // ==========================================
  admin: [
    {
      id: "admin-platform-governance",
      title: "Platform Ecosystem Operations & Governance",
      subtitle:
        "Comprehensive overview of platform-wide GMV monitoring, multi-store workspaces, attribution logs, and infrastructure health.",
      badge: "Platform HQ",
      src: SHOPIFY_CDN_VIDEOS.platformTour,
      fileSize: "470 MB",
      chapters: [
        {
          time: 0,
          timeFormatted: "0:00",
          title: "Ecosystem Architecture & Multi-Tenant Workspaces",
          desc: "Overview of platform infrastructure managing brands, creators, and commerce links.",
        },
        {
          time: 105,
          timeFormatted: "1:45",
          title: "Managing Stores, Workspaces & Creator Codes",
          desc: "Auditing active merchant domains and creator referral identifiers.",
        },
        {
          time: 195,
          timeFormatted: "3:15",
          title: "Global Attribution Engine & Webhook Verification",
          desc: "Inspecting raw Shopify webhook signatures, line items, and attribution matches.",
        },
        {
          time: 300,
          timeFormatted: "5:00",
          title: "Financial Governance & Platform Commission Ledger",
          desc: "Auditing system-wide commission balances, payout reversals, and payment integrity.",
        },
      ],
      highlights: [
        "Real-time webhook signature verification and payload inspection",
        "Multi-tenant isolation ensuring zero cross-tenant data leakage",
        "System-wide health monitoring, background job queues, and error telemetry",
        "Comprehensive financial ledger tracking GMV and platform commission splits",
      ],
    },
    {
      id: "admin-meta-compliance",
      title: "Meta Graph API v20+ Technical & Compliance Demo",
      subtitle:
        "Technical demonstration of Meta OAuth 2.0 handshake, permission justification (comments & messaging), and webhook event handling.",
      badge: "API & Compliance",
      src: SHOPIFY_CDN_VIDEOS.metaAutomation,
      fileSize: "33.3 MB",
      chapters: [
        {
          time: 0,
          timeFormatted: "0:00",
          title: "Meta OAuth 2.0 & Token Exchange Architecture",
          desc: "Secure authentication flow linking Instagram Professional accounts.",
        },
        {
          time: 45,
          timeFormatted: "0:45",
          title: "Permission Scopes Justification Matrix",
          desc: "Operational necessity for instagram_manage_comments and instagram_manage_messages.",
        },
        {
          time: 90,
          timeFormatted: "1:30",
          title: "Real-time Webhook Event Processing",
          desc: "HMAC signature verification and sub-second automated message dispatch.",
        },
        {
          time: 165,
          timeFormatted: "2:45",
          title: "Data Deletion Callback & Privacy Compliance",
          desc: "Automated account revocation and data erasure per Meta platform guidelines.",
        },
      ],
      highlights: [
        "Certified for Meta Developer App Review on Graph API v20+",
        "HMAC SHA-256 signature verification on all incoming webhook payloads",
        "Automated data deletion callback endpoint at /data-deletion",
        "Strict boundary enforcement protecting consumer data and access tokens",
      ],
    },
    {
      id: "admin-user-governance",
      title: "Platform Onboarding & Identity Governance",
      subtitle:
        "Managing creator and merchant onboarding pipelines, role assignment safeguards, and authentication mechanisms.",
      badge: "Identity Governance",
      src: SHOPIFY_CDN_VIDEOS.onboarding,
      fileSize: "34.5 MB",
      chapters: [
        {
          time: 0,
          timeFormatted: "0:00",
          title: "Dual Onboarding Pipeline Architecture",
          desc: "Separate registration workflows for creators and merchant store owners.",
        },
        {
          time: 30,
          timeFormatted: "0:30",
          title: "Creator Identity & Verification Pipeline",
          desc: "Auditing social links, creator codes, and bank payout assignments.",
        },
        {
          time: 70,
          timeFormatted: "1:10",
          title: "Merchant Storefront Verification",
          desc: "Validating Shopify store credentials and partner API configurations.",
        },
        {
          time: 105,
          timeFormatted: "1:45",
          title: "Role-Based Access Control Safeguards",
          desc: "Enforcing strict boundary isolation across user panels.",
        },
      ],
      highlights: [
        "Zero cross-panel data leakage between creator, store, and platform roles",
        "Impersonation session management with comprehensive audit trails",
        "Automated validation stopping duplicate creator codes or merchant stores",
        "Role-based privilege escalation prevention",
      ],
    },
  ],
};

/* -------------------------------------------------------------------------- */
/* STEP-BY-STEP WRITTEN GUIDES PER ROLE                                       */
/* -------------------------------------------------------------------------- */

const influencerGuideSections: GuideSection[] = [
  {
    id: "getting-started",
    title: "Getting Started & Profile Setup",
    icon: UserRound,
    summary: "Set up your creator profile, link social channels, and customize your personal storefront.",
    steps: [
      {
        title: "Complete Your Profile",
        desc: "Add your bio, primary category (Fashion, Beauty, Tech, etc.), and minimum follower counts in Profile Settings.",
      },
      {
        title: "Connect Instagram & Meta",
        desc: "Link your Instagram Professional account to enable live post metrics, automated DM responses, and campaign verification.",
      },
      {
        title: "Set Up Your Storefront",
        desc: "Customize your creator storefront handle to share a single curated link with your followers across Instagram and TikTok.",
      },
    ],
    quickLink: { label: "Go to Profile", url: "/influencer/profile" },
  },
  {
    id: "compensation-models",
    title: "Understanding The 4 Compensation Models",
    icon: CircleDollarSign,
    summary: "Learn how different brand deal structures pay out earnings and sample products.",
    badge: "Key Feature",
    steps: [
      {
        title: "1. Barter / Product Exchange (🎁)",
        desc: "Receive complimentary brand products in exchange for promotional content. Store owners ship sample products directly to you, and you can track delivery status under Earnings & Barter Shipments.",
      },
      {
        title: "2. Fixed Pricing (💵)",
        desc: "Negotiate a guaranteed base fee for defined deliverables (e.g., 1 Reel + 2 Stories). Payouts are logged automatically upon campaign completion.",
      },
      {
        title: "3. Commission Only (📈)",
        desc: "Earn a percentage (e.g. 10%) on every order attributed to your unique affiliate link or creator discount code.",
      },
      {
        title: "4. Hybrid Deal (⚡)",
        desc: "The best of both worlds: receive a guaranteed base fee PLUS an ongoing sales commission percentage on all orders generated.",
      },
    ],
    quickLink: { label: "Explore Campaigns", url: "/influencer/discover" },
  },
  {
    id: "campaigns-links",
    title: "Discovering Campaigns & Tracked Links",
    icon: Compass,
    summary: "How to apply to brand campaigns, generate trackable affiliate links, and track performance.",
    steps: [
      {
        title: "Browse Opportunity Discover",
        desc: "Filter active brand campaigns by category, platform, and compensation model. Click Apply to send your pitch and proposed rate.",
      },
      {
        title: "Generate Product & Collection Links",
        desc: "Navigate to Products or Links to create custom trackable URLs (/r/your-slug). Every click and purchase is logged in real-time.",
      },
      {
        title: "Automate Instagram DM Replies",
        desc: "Set up keywords (e.g. comment 'LINK') in Instagram Automation so our bot auto-replies to your post comments with your affiliate links.",
      },
    ],
    quickLink: { label: "View My Links", url: "/influencer/links" },
  },
  {
    id: "earnings-shipments",
    title: "Tracking Earnings, Orders & Shipments",
    icon: Wallet,
    summary: "Monitor live attributed sales, pending commission balances, and barter sample delivery.",
    steps: [
      {
        title: "Track Attributed Orders",
        desc: "View customer orders attributed to your code or link in the Orders tab with exact commission calculations.",
      },
      {
        title: "Barter Sample Tracking",
        desc: "Check the Barter Sample Shipments section under Earnings to view carrier names, tracking numbers, and delivery dates for product samples.",
      },
      {
        title: "Payout Withdrawals",
        desc: "Receive automated settlements directly to your registered bank account or UPI ID on the 1st and 15th of every month.",
      },
    ],
    quickLink: { label: "View Earnings", url: "/influencer/earnings" },
  },
];

const storeAdminGuideSections: GuideSection[] = [
  {
    id: "store-setup",
    title: "Storefront & Shopify Integration",
    icon: Store,
    summary: "Connect your Shopify store, synchronize products, and set up tracking webhooks.",
    steps: [
      {
        title: "Verify Shopify Connection",
        desc: "Ensure your Shopify domain is connected under Integrations. Product catalogs, inventory, and order webhooks sync automatically.",
      },
      {
        title: "Set Default Commission Rates",
        desc: "Configure standard percentage or flat commission rates for creators across your product collections.",
      },
    ],
    quickLink: { label: "Store Settings", url: "/store-admin/settings" },
  },
  {
    id: "campaign-management",
    title: "Launching & Managing Brand Campaigns",
    icon: Megaphone,
    summary: "Create campaigns with custom compensation structures and invite top creators.",
    badge: "Core Workflow",
    steps: [
      {
        title: "Choose Compensation Model",
        desc: "Pick from Barter (Free Product Samples), Fixed Fee (Deliverable Base Pay), Commission Only, or Hybrid (Base Pay + Sales Commission).",
      },
      {
        title: "Review Creator Applications",
        desc: "Accept or decline creator pitches. View their verified Instagram metrics, engagement rates, and previous sales performance.",
      },
      {
        title: "Ship Barter Samples",
        desc: "When accepting Barter deals, ship the requested product samples and log the carrier tracking number in Affiliate & Fulfillments to keep creators notified.",
      },
    ],
    quickLink: { label: "Campaigns", url: "/store-admin/campaigns" },
  },
  {
    id: "attribution-orders",
    title: "Sales Attribution & Webhook Verification",
    icon: ShoppingBag,
    summary: "How orders are attributed to creators and how commissions are calculated without overpaying.",
    steps: [
      {
        title: "Automatic Webhook Sync",
        desc: "Shopify order webhooks automatically match referral parameters (mi_link) and creator discount codes to the correct influencer.",
      },
      {
        title: "Barter / Fixed Exclusions",
        desc: "Orders attributed to creators on Barter or Fixed-only deals are logged for analytics but automatically prevented from generating commission fees.",
      },
    ],
    quickLink: { label: "Orders", url: "/store-admin/orders" },
  },
];

const adminGuideSections: GuideSection[] = [
  {
    id: "command-center",
    title: "Platform Command Center & System Health",
    icon: LayoutDashboard,
    summary: "Monitor platform-wide GMV, active stores, creator counts, and infrastructure health.",
    steps: [
      {
        title: "Ecosystem KPIs",
        desc: "View aggregate GMV, total store orders, total active creator links, and system-wide commission volume.",
      },
      {
        title: "System Logs & Webhooks",
        desc: "Inspect Shopify webhook signature statuses, API latency, background jobs, and error logs in real time.",
      },
    ],
    quickLink: { label: "Admin Dashboard", url: "/admin/dashboard" },
  },
  {
    id: "ecosystem-governance",
    title: "Ecosystem Governance & Verification",
    icon: ShieldCheck,
    summary: "Manage store accounts, creator profiles, social connections, and campaign standards.",
    steps: [
      {
        title: "Store & Brand Management",
        desc: "Review connected Shopify domains, active store workspaces, and store owner user accounts.",
      },
      {
        title: "Creator Auditing",
        desc: "Verify Instagram connections, follower authentications, creator codes, and workspace assignments.",
      },
    ],
    quickLink: { label: "All Creators", url: "/admin/creators" },
  },
  {
    id: "financial-payouts",
    title: "Financial Governance & Payout Audit",
    icon: CreditCard,
    summary: "Track platform order attribution, commission logs, and payout compliance.",
    steps: [
      {
        title: "Order Attribution Audit",
        desc: "Inspect raw order payloads, custom attribution parameters, and discount code mappings across all brand stores.",
      },
      {
        title: "Commission & Payout Logs",
        desc: "Monitor pending, approved, and reversed commissions to prevent double payouts or duplicate links.",
      },
    ],
    quickLink: { label: "Attribution Audit", url: "/admin/attribution" },
  },
];

const guideByRole: Record<
  Role,
  {
    roleTitle: string;
    description: string;
    badge: string;
    sections: GuideSection[];
    faqs: Array<{ q: string; a: string }>;
  }
> = {
  influencer: {
    roleTitle: "Creator & Influencer Guide",
    description: "Learn how to discover brand deals, automate your Instagram engagement, and earn money.",
    badge: "Creator Workspace",
    sections: influencerGuideSections,
    faqs: [
      {
        q: "How do Barter / Product Exchange deals work?",
        a: "When you are accepted to a Barter deal, the brand sends you a free product sample. You can track the shipment status (Carrier, Tracking Number) in your Earnings page under Barter Sample Shipments. Barter deals do not earn sales commission.",
      },
      {
        q: "What is the difference between Fixed, Commission, and Hybrid deals?",
        a: "Fixed deals pay a flat fee upon task completion. Commission deals pay a percentage on sales driven through your link/code. Hybrid deals give you BOTH a guaranteed base fee and an ongoing sales commission percentage.",
      },
      {
        q: "How does Instagram Automation work?",
        a: "You can set up keyword triggers in Instagram Automation (e.g. comment 'LINK'). When followers comment that keyword on your Instagram posts, our system automatically sends them a DM with your custom affiliate link.",
      },
      {
        q: "Where can I find my shareable affiliate links?",
        a: "Go to Products or Links in your sidebar. You can copy custom /r/your-slug links for individual products or entire store collections.",
      },
    ],
  },
  "store-admin": {
    roleTitle: "Store Owner & Brand Guide",
    description: "Learn how to launch campaigns, manage barter shipments, track sales attribution, and work with creators.",
    badge: "Brand Workspace",
    sections: storeAdminGuideSections,
    faqs: [
      {
        q: "How does sales attribution work with Shopify?",
        a: "MegaInfluencer tracks orders using referral URL parameters (mi_link), UTM parameters, and creator discount codes (creatorCode). Orders sync automatically from Shopify.",
      },
      {
        q: "How do I handle Barter sample product shipping?",
        a: "Go to Affiliate & Fulfillments or Store Payouts. You will see all Barter Sample Fulfillment records for accepted creators. You can enter the carrier name and tracking number to update the creator.",
      },
      {
        q: "Can I set up different commission rates for different creators?",
        a: "Yes! You can assign custom commission rates per product assignment or choose Hybrid / Commission campaign rates when creating a campaign.",
      },
      {
        q: "Are sales commissions generated for Barter or Fixed-only deals?",
        a: "No. The system automatically restricts affiliate commission creation for creators on Barter or Fixed-only campaigns so you are never overbilled.",
      },
    ],
  },
  admin: {
    roleTitle: "Platform Admin Governance Guide",
    description: "Comprehensive guide for platform administrators managing stores, creators, attribution, and platform health.",
    badge: "Platform HQ",
    sections: adminGuideSections,
    faqs: [
      {
        q: "How do I inspect raw Shopify webhook payloads?",
        a: "Go to Admin > Orders or Admin > System logs. You can inspect exact webhook signatures, line items, custom attributes, and attribution match results.",
      },
      {
        q: "How are platform user roles structured?",
        a: "There are 3 main roles: INFLUENCER (creators), STORE_OWNER (brands connected to Shopify), and ADMIN (platform governance).",
      },
      {
        q: "Where do I monitor database & API error logs?",
        a: "Check Admin > System logs or review detailed colorized API error outputs in server console logs.",
      },
    ],
  },
};

/* -------------------------------------------------------------------------- */
/* MAIN HELPPANELGUIDE COMPONENT (NATIVE IN-PANEL PLAYER WITH ROLE ISOLATION) */
/* -------------------------------------------------------------------------- */

export function HelpPanelGuide({ role }: { role: Role }) {
  const guide = guideByRole[role];
  const videos = roleVideos[role] || [];
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [search, setSearch] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const currentVideo = videos[selectedVideoIndex] || videos[0];

  const handleSeek = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleSkip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + seconds);
    }
  };

  const filteredSections = guide.sections.filter(
    (sec) =>
      sec.title.toLowerCase().includes(search.toLowerCase()) ||
      sec.summary.toLowerCase().includes(search.toLowerCase()) ||
      sec.steps.some(
        (s) =>
          s.title.toLowerCase().includes(search.toLowerCase()) ||
          s.desc.toLowerCase().includes(search.toLowerCase())
      )
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={guide.roleTitle}
        description={guide.description}
        actions={
          <Badge variant="outline" className="gap-1.5 py-1 px-3 bg-primary/5 text-primary border-primary/20">
            <Sparkles className="h-3.5 w-3.5" />
            {guide.badge}
          </Badge>
        }
      />

      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="videos" className="gap-1.5 text-xs sm:text-sm">
            <Video className="h-4 w-4 text-primary" /> Video Tutorials
          </TabsTrigger>
          <TabsTrigger value="guide" className="gap-1.5 text-xs sm:text-sm">
            <BookOpen className="h-4 w-4" /> Step-by-Step Guide
          </TabsTrigger>
          <TabsTrigger value="faqs" className="gap-1.5 text-xs sm:text-sm">
            <HelpCircle className="h-4 w-4" /> FAQs
          </TabsTrigger>
        </TabsList>

        {/* ================================================================= */}
        {/* TAB 1: ROLE-ISOLATED VIDEO TUTORIALS & INTERACTIVE MEDIA HUB      */}
        {/* ================================================================= */}
        <TabsContent value="videos" className="mt-6 space-y-6">
          {/* Video Selector Strip (Shows only this role's 3 videos) */}
          <div className="grid gap-4 md:grid-cols-3">
            {videos.map((vid, idx) => {
              const isSelected = selectedVideoIndex === idx;
              return (
                <button
                  key={vid.id}
                  type="button"
                  onClick={() => {
                    setSelectedVideoIndex(idx);
                    if (videoRef.current) {
                      videoRef.current.load();
                    }
                  }}
                  className={`group relative flex flex-col rounded-2xl border p-4 text-left transition-all duration-200 ${
                    isSelected
                      ? "border-primary bg-card shadow-md ring-2 ring-primary/20"
                      : "border-border bg-card/60 hover:border-primary/50 hover:bg-card hover:shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {vid.badge}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                      <Clock className="h-3 w-3" /> {vid.fileSize}
                    </span>
                  </div>

                  <h3 className="mt-3 font-display text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    {vid.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {vid.subtitle}
                  </p>

                  <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-border/50 text-xs font-medium text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Play className="h-3 w-3 text-primary" /> {vid.chapters.length} Chapters
                    </span>
                    <span className={`font-semibold ${isSelected ? "text-primary" : "group-hover:text-foreground"}`}>
                      {isSelected ? "Now Playing" : "Watch →"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Main Embedded Player & Chapter Controls */}
          {currentVideo && (
            <div className="rounded-3xl border border-border bg-card p-5 sm:p-7 shadow-card">
              <div className="flex flex-col gap-3 border-b border-border pb-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {currentVideo.badge}
                    </Badge>
                    <span className="text-xs text-muted-foreground">HD Video • {currentVideo.fileSize}</span>
                  </div>
                  <h2 className="mt-2 font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    {currentVideo.title}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground max-w-2xl leading-relaxed">
                    {currentVideo.subtitle}
                  </p>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <a
                    href={currentVideo.src}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Fullscreen Tab
                  </a>
                  <a
                    href={currentVideo.src}
                    download
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90"
                  >
                    <Download className="h-3.5 w-3.5" /> Download MP4
                  </a>
                </div>
              </div>

              {/* Player & Chapters Grid */}
              <div className="mt-6 grid gap-6 lg:grid-cols-12">
                {/* Video Player Column */}
                <div className="lg:col-span-8 flex flex-col space-y-4">
                  <div className="overflow-hidden rounded-2xl border border-border/80 bg-black shadow-lg">
                    {/* Native HTML5 Video Element */}
                    <div className="relative aspect-video w-full bg-black">
                      <video
                        ref={videoRef}
                        key={currentVideo.src}
                        controls
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-contain"
                      >
                        <source src={currentVideo.src} type="video/mp4" />
                        Your browser does not support HTML5 video playback. Please use the Download MP4 button.
                      </video>
                    </div>

                    {/* Quick Player Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#16161c] px-4 py-2.5 text-xs text-white">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSkip(-10)}
                          className="flex items-center gap-1 rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/90 hover:bg-white/20 transition"
                          title="Rewind 10 seconds"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> -10s
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSkip(10)}
                          className="flex items-center gap-1 rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/90 hover:bg-white/20 transition"
                          title="Forward 10 seconds"
                        >
                          <RotateCw className="h-3.5 w-3.5" /> +10s
                        </button>
                      </div>

                      {/* Speed Buttons */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-white/50">Speed:</span>
                        {[0.75, 1, 1.25, 1.5].map((speed) => (
                          <button
                            key={speed}
                            type="button"
                            onClick={() => handleSpeedChange(speed)}
                            className={`rounded px-2 py-0.5 text-[11px] font-mono transition ${
                              playbackRate === speed
                                ? "bg-primary text-primary-foreground font-bold"
                                : "bg-white/10 text-white/70 hover:bg-white/20"
                            }`}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Highlights Card */}
                  <div className="rounded-2xl border border-border bg-muted/20 p-4">
                    <h4 className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <Sparkles className="h-3.5 w-3.5 text-primary" /> Key Takeaways for Your Workspace
                    </h4>
                    <ul className="mt-2.5 grid gap-2 sm:grid-cols-2">
                      {currentVideo.highlights.map((hl, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                          <span>{hl}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Chapters Navigation Column */}
                <div className="lg:col-span-4 flex flex-col space-y-3">
                  <div className="rounded-2xl border border-border bg-muted/20 p-4">
                    <div className="flex items-center justify-between border-b border-border pb-2.5">
                      <h4 className="font-display text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-primary" /> Chapters
                      </h4>
                      <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        Click to Jump
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      {currentVideo.chapters.map((ch, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSeek(ch.time)}
                          className="group flex w-full items-start gap-2.5 rounded-xl border border-transparent p-2 text-left transition hover:border-border hover:bg-card hover:shadow-xs"
                        >
                          <span className="mt-0.5 inline-flex items-center justify-center rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
                            {ch.timeFormatted}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                              {ch.title}
                            </p>
                            <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground line-clamp-2">
                              {ch.desc}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Panel-Isolated Privacy Notice */}
                  <div className="rounded-2xl border border-border/80 bg-card p-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 font-bold text-foreground text-xs">
                      <ShieldCheck className="h-4 w-4 text-primary" /> Role-Protected Workspace
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed">
                      All video guides and walkthroughs in this panel are scoped strictly to your{" "}
                      <span className="font-semibold text-foreground">{guide.badge}</span> role.
                      Sensitive cross-panel configurations and merchant secrets remain isolated.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ================================================================= */}
        {/* TAB 2: STEP-BY-STEP WRITTEN GUIDES                                */}
        {/* ================================================================= */}
        <TabsContent value="guide" className="mt-6 space-y-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search help guide topics, compensation models, or features..."
              className="pl-10 h-10 bg-card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {filteredSections.map((section) => {
              const Icon = section.icon;
              return (
                <Card key={section.id} className="shadow-card flex flex-col justify-between overflow-hidden border">
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      {section.badge ? (
                        <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                          {section.badge}
                        </Badge>
                      ) : null}
                    </div>
                    <CardTitle className="mt-3 text-lg font-bold">{section.title}</CardTitle>
                    <CardDescription className="text-sm">{section.summary}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 pt-2 space-y-4">
                    <div className="space-y-3">
                      {section.steps.map((step, idx) => (
                        <div key={step.title} className="flex items-start gap-3 rounded-xl bg-muted/30 p-3 text-sm">
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-foreground">{step.title}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {section.quickLink ? (
                      <Button asChild variant="outline" size="sm" className="w-full text-xs">
                        <Link to={section.quickLink.url}>
                          {section.quickLink.label} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}

            {!filteredSections.length ? (
              <div className="col-span-full rounded-2xl border border-dashed p-12 text-center">
                <HelpCircle className="mx-auto h-10 w-10 text-muted-foreground opacity-60" />
                <p className="mt-3 text-base font-semibold">No help topics found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try searching for terms like "Barter", "Commission", "Shopify", or "Instagram".
                </p>
              </div>
            ) : null}
          </div>
        </TabsContent>

        {/* ================================================================= */}
        {/* TAB 3: ROLE-SPECIFIC FAQS                                         */}
        {/* ================================================================= */}
        <TabsContent value="faqs" className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {guide.faqs.map((faq, idx) => (
              <Card key={idx} className="shadow-card border p-5 space-y-2">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-base leading-snug">{faq.q}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* HEADER QUICK-HELP DRAWER (SHEET) WITH ROLE VIDEO SHORTCUTS                */
/* -------------------------------------------------------------------------- */

export function HelpSheetTrigger({ role }: { role: Role }) {
  const guide = guideByRole[role];
  const videos = roleVideos[role] || [];
  const helpUrl = role === "influencer" ? "/influencer/help" : role === "store-admin" ? "/store-admin/help" : "/admin/help";

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
          title="Help & Video Tutorials"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-6 space-y-6">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <Sparkles className="h-3 w-3 mr-1" /> {guide.badge}
            </Badge>
          </div>
          <SheetTitle className="text-xl font-bold font-display">{guide.roleTitle}</SheetTitle>
          <SheetDescription>{guide.description}</SheetDescription>
        </SheetHeader>

        {/* Role Video Quick Access in Sheet */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" />
              <h4 className="text-xs font-bold text-foreground">Video Tutorials ({videos.length})</h4>
            </div>
            <Link to={helpUrl} className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1">
              Watch in Panel <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {videos.map((vid) => (
              <Link
                key={vid.id}
                to={helpUrl}
                className="group flex items-center justify-between rounded-xl bg-card border border-border p-2.5 text-xs transition hover:border-primary/50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Play className="h-3.5 w-3.5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                    {vid.title}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{vid.fileSize}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Step-by-Step Sections */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Quick Reference Guides
          </h4>
          {guide.sections.map((sec) => (
            <div key={sec.id} className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <sec.icon className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-sm">{sec.title}</h4>
              </div>
              <p className="text-xs text-muted-foreground">{sec.summary}</p>

              <div className="space-y-2">
                {sec.steps.map((st, i) => (
                  <div key={st.title} className="rounded-lg bg-muted/40 p-2.5 text-xs">
                    <p className="font-medium text-foreground">
                      {i + 1}. {st.title}
                    </p>
                    <p className="mt-0.5 text-muted-foreground leading-normal">{st.desc}</p>
                  </div>
                ))}
              </div>

              {sec.quickLink ? (
                <Button asChild variant="outline" size="sm" className="w-full text-xs h-8">
                  <Link to={sec.quickLink.url}>
                    {sec.quickLink.label} <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
