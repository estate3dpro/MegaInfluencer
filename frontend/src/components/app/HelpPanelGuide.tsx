import { useState } from "react";
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
  Compass,
  CreditCard,
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
  Receipt,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Truck,
  Users2,
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

type GuideSection = {
  id: string;
  title: string;
  icon: any;
  summary: string;
  badge?: string;
  steps: Array<{ title: string; desc: string }>;
  quickLink?: { label: string; url: string };
};

const influencerGuideSections: GuideSection[] = [
  {
    id: "getting-started",
    title: "Getting Started & Profile Setup",
    icon: UserCircleIcon,
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
        desc: "Navigate to Products or Links to create custom trackable URLs (`/r/your-slug`). Every click and purchase is logged in real-time.",
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
        title: "Payout Requests & Balance",
        desc: "View your total combined earnings across Base Fees, Commission Balances, and Barter Value.",
      },
    ],
    quickLink: { label: "View Earnings", url: "/influencer/earnings" },
  },
];

const storeAdminGuideSections: GuideSection[] = [
  {
    id: "shopify-store",
    title: "Shopify Store Integration & Products",
    icon: Store,
    summary: "Connect your Shopify domain and sync your product catalog for creator attribution.",
    badge: "Setup",
    steps: [
      {
        title: "Connect Shopify Store",
        desc: "Connect your store using your Shopify Access Token or CLI Bridge in Settings > Integrations.",
      },
      {
        title: "Sync Catalog & Orders",
        desc: "Products and orders sync automatically. You can also run manual syncs anytime under Products or Orders.",
      },
      {
        title: "Assign Products to Creators",
        desc: "Select store products and assign them directly to creators so they appear in creator storefronts with instant affiliate links.",
      },
    ],
    quickLink: { label: "Manage Products", url: "/store-admin/products" },
  },
  {
    id: "campaign-creation",
    title: "Creating & Managing Brand Campaigns",
    icon: Megaphone,
    summary: "Launch campaign opportunities with targeted brief guidelines and compensation models.",
    steps: [
      {
        title: "Choose Compensation Model",
        desc: "Select FIXED fee, BARTER product exchange, COMMISSION percentage, or HYBRID. The platform automatically enforces payout and link rules based on your choice.",
      },
      {
        title: "Define Deliverables & Product",
        desc: "Specify exact requirements (e.g. 1 Reel, 2 Stories) and select a store product to provide for barter or commission tagging.",
      },
      {
        title: "Review & Approve Applications",
        desc: "Creators pitch their angle and proposed rate. Accept applications to auto-assign creators and trigger sample fulfillment workflows.",
      },
    ],
    quickLink: { label: "View Campaigns", url: "/store-admin/campaigns" },
  },
  {
    id: "barter-fulfillments",
    title: "Barter Fulfillment & Campaign Payouts",
    icon: Truck,
    summary: "Fulfill sample product shipments for barter deals and manage fixed-fee creator payouts.",
    badge: "Commerce",
    steps: [
      {
        title: "Manage Barter Fulfillments",
        desc: "When a creator is accepted into a Barter campaign, a sample fulfillment record is created. Add tracking numbers and carrier info as you ship.",
      },
      {
        title: "Update Fulfillment Status",
        desc: "Mark shipments as SHIPPED or DELIVERED so creators can track their incoming package in their portal.",
      },
      {
        title: "Manage Base Payouts",
        desc: "Review pending fixed fees or hybrid base payouts under Campaigns > Payouts and update status to PAID upon transfer.",
      },
    ],
    quickLink: { label: "Affiliate & Fulfillments", url: "/store-admin/affiliate" },
  },
  {
    id: "attribution-analytics",
    title: "Sales Attribution & Analytics",
    icon: BarChart3,
    summary: "Understand creator-driven revenue, link clicks, conversion rates, and ROI.",
    steps: [
      {
        title: "Link & Code Attribution",
        desc: "Every order placed using `mi_link` or creator discount codes (`creatorCode`) is automatically attributed to the responsible creator.",
      },
      {
        title: "Review Commission Records",
        desc: "Approve or audit affiliate commissions in Commissions before issuing payouts.",
      },
      {
        title: "Analyze Creator Performance",
        desc: "Use Store Analytics & Reports to compare top-performing creators, total sales driven, and commission payout ratios.",
      },
    ],
    quickLink: { label: "Store Analytics", url: "/store-admin/analytics" },
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
      {
        title: "Campaign Oversight",
        desc: "Audit public marketplace campaigns to ensure compliance with platform brand and compensation standards.",
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
    quickLink: { label: "Platform Payouts", url: "/admin/payouts" },
  },
];

function UserCircleIcon(props: any) {
  return <Sparkles {...props} />;
}

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
    description: "Everything you need to know about discovering campaigns, sharing tracked product links, and earning money.",
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
        a: "Go to Products or Links in your sidebar. You can copy custom `/r/your-slug` links for individual products or entire store collections.",
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
        a: "MegaInfluencer tracks orders using referral URL parameters (`mi_link`), UTM parameters, and creator discount codes (`creatorCode`). Orders sync automatically from Shopify.",
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

export function HelpPanelGuide({ role }: { role: Role }) {
  const guide = guideByRole[role];
  const [search, setSearch] = useState("");

  const filteredSections = guide.sections.filter((sec) =>
    sec.title.toLowerCase().includes(search.toLowerCase()) ||
    sec.summary.toLowerCase().includes(search.toLowerCase()) ||
    sec.steps.some(
      (s) => s.title.toLowerCase().includes(search.toLowerCase()) || s.desc.toLowerCase().includes(search.toLowerCase())
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

      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search help guide topics, compensation models, or features..."
          className="pl-10 h-10 bg-card"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Tabs defaultValue="guide" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="guide">Step-by-Step Guide</TabsTrigger>
          <TabsTrigger value="faqs">Frequently Asked Questions</TabsTrigger>
        </TabsList>

        <TabsContent value="guide" className="mt-6 space-y-6">
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
                      <Button asChild variant="outline" size="sm" className="w-full mt-2">
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
                <p className="mt-1 text-sm text-muted-foreground">Try searching for terms like "Barter", "Commission", "Shopify", or "Instagram".</p>
              </div>
            ) : null}
          </div>
        </TabsContent>

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

export function HelpSheetTrigger({ role }: { role: Role }) {
  const guide = guideByRole[role];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground" title="Help & Guide">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-6 space-y-6">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <Sparkles className="h-3 w-3 mr-1" /> Help Guide
            </Badge>
          </div>
          <SheetTitle className="text-xl font-bold font-display">{guide.roleTitle}</SheetTitle>
          <SheetDescription>{guide.description}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
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
                    <p className="font-medium text-foreground">{i + 1}. {st.title}</p>
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
