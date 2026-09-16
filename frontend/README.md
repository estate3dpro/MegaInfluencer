# Creator Commerce Hub

Create "Platform" — a multi-role creator commerce, affiliate, referral, campaign, attribution, and ecommerce management web application.

1. Brand & Design System:
- Palette: Primary Purple (#6C5CE7), Violet (#8B5CF6), Indigo (#4F46E5), Accent Coral (#EC6B9A) for creator/social/campaign elements, Accent Teal (#20B8A6) for commerce/success/revenue metrics, Neutral Background (#F7F7FB), White (#FFFFFF), Foreground (#18181B), Muted (#71717A).
- Full Dark Mode support: #0F1015, #171820, #1D1F29, foreground #F4F4F5, muted #A1A1AA, border #2A2D38.
- Typography, clean cards, subtle shadows, rounded-xl/lg borders, Recharts charts, Lucide icons, responsive drawer navigation on mobile/tablet.

2. Architecture & Role Switching:
- Global Header / Workspace Role Switcher in all layouts allowing instant 1-click switching between:
  • Influencer (/influencer/dashboard)
  • Store Admin (/store-admin/dashboard)
  • Platform Admin (/admin/dashboard)
  with quick preview banner or workspace selector in the sidebar/header.
- Three distinct layouts: InfluencerLayout, StoreAdminLayout, AdminLayout with dedicated sidebars, headers, search, notification drawer, role-specific badge, and user dropdown.

3. Role 1: Influencer Experience (/influencer/*):
- Visual, creator-focused, social, and motivating.
- Routes:
  • /influencer/dashboard: Welcome greeting ("Good morning 👋"), KPI row (Total Earnings ₹1,84,240, Orders 1,248, Clicks 24,820, Conversion 6.82%), earnings area chart, campaign & product performance, recent orders, recent activity.
  • /influencer/profile: Creator bio, social accounts (Instagram 125K, YouTube 82K), audience demographics, content categories, payout details.
  • /influencer/discover: Creator marketplace cards with category/brand filters, commission % (e.g. 15%), potential earnings (₹25,000), "View Campaign" action.
  • /influencer/store: My creator storefront preview, featured products, collections, store appearance & share store dialog.
  • /influencer/products: Grid/List toggle, product cards with commission, clicks, sales, "Generate Link" modal with copyable affiliate links.
  • /influencer/campaigns: Tabs (Discover, Applied, Active, Completed), campaign detail drawer with requirements and metrics.
  • /influencer/links: Link manager with KPIs (Clicks, Orders, Revenue, CVR), link generation modal, copy/share actions, analytics popover.
  • /influencer/instagram-automation: Visual workflow builder (Trigger: Comment contains 'LINK' -> Action: Send DM with product link), active automations, templates, execution history.
  • /influencer/orders: Orders table with right-side Detail Drawer showing customer, product, commission, tracking status.
  • /influencer/earnings: Available balance (₹1,84,240), "Request Payout" modal, earnings trend chart, payout history table.
  • /influencer/analytics: Tabs (Overview, Traffic, Products, Campaigns, Revenue, Audience) with interactive Recharts.
  • /influencer/notifications: Filterable notifications list (Campaigns, Orders, Earnings, System).
  • /influencer/support: FAQ, Help articles, and "Create Ticket" modal.

4. Role 2: Store Admin Experience (/store-admin/*):
- Commerce, operations, performance & creator recruitment.
- Routes:
  • /store-admin/dashboard: KPIs (Revenue ₹12.84L, Orders 3,420, Creator Revenue ₹4.95L, Creator Commissions ₹49,500, Conversion 4.2%, Active Creators 142), revenue & orders dual chart, top creators, top products, recent orders.
  • /store-admin/store: Store settings, branding, custom domain, checkout customization, policies.
  • /store-admin/products: Full ecommerce inventory table with search, category filters, bulk actions, creator assignment, drawer for product details.
  • /store-admin/creators: Creator CRM table (Followers, Campaigns, Clicks, Orders, Revenue, Commission, Status) with rich Creator Profile Drawer.
  • /store-admin/campaigns: Create Campaign modal, tabs (Active, Draft, Completed), budget, commission tier configuration.
  • /store-admin/affiliate: Multi-touch attribution funnel (Clicks -> Product Views -> Add to Cart -> Purchases -> Commission), top referring creators, link tracking.
  • /store-admin/orders: Detailed commerce orders table with filtering by creator, campaign, status, and Order Detail Drawer.
  • /store-admin/commissions: Commission ledger (Pending, Approved, Paid, Reversed) with one-click approval/payout triggers.
  • /store-admin/analytics: Deep dive into creator ROI, product velocity, cohort sales.
  • /store-admin/customers: Customer list with creator attribution source and Customer Detail Drawer.
  • /store-admin/discounts: Coupon & creator referral promo code manager.
  • /store-admin/integrations: Shopify, WooCommerce, Stripe, Razorpay, Klaviyo, Instagram integration cards with connect/configure states.
  • /store-admin/reports: Exportable reports (CSV, PDF) with date filters.
  • /store-admin/settings: Commission rates, payout schedules, team management.

5. Role 3: Platform Admin Experience (/admin/*):
- Enterprise command center, high density, ecosystem governance & finance.
- Routes:
  • /admin/dashboard: Ecosystem GMV (₹1.48 Cr), Platform Take-rate Revenue (₹14.8L), Active Influencers (4,820), Active Stores (320), Orders (48,200), Ecosystem charts, platform health status.
  • /admin/influencers: Global creator governance table with verification, status toggle, moderation drawer.
  • /admin/stores: Global store directory with GMV, store owner contact, active status.
  • /admin/brands: Multi-brand directory and store associations.
  • /admin/products: Global product catalog.
  • /admin/campaigns: Platform-wide campaigns monitoring.
  • /admin/attribution: High-impact multi-stage visual attribution funnel (Impressions -> Clicks -> Views -> Cart -> Purchase -> Commission) with dimension slice by influencer, campaign, store.
  • /admin/orders: Global order stream with cross-store filters.
  • /admin/commissions: Global commissions & platform fees ledger.
  • /admin/payouts: Bulk payout processing hub (Pending, Processing, Completed) with batch approval actions.
  • /admin/social: Connected Instagram & YouTube social accounts sync status and permissions monitor.
  • /admin/integrations: Global integration registry and webhook health.
  • /admin/analytics: Macro ecosystem performance and growth trends.
  • /admin/users: RBAC user management (Super Admin, Admin, Finance, Support, Operations).
  • /admin/finance: Platform P&L, fees collected, creator disbursements, refunds, ledger.
  • /admin/support: Global support ticket resolution desk.
  • /admin/reports: Scheduled reports and platform data exports.
  • /admin/system: Realtime technical monitoring (API, Database, Webhooks, Queue, Social Sync, Payments status, error rates, system logs).
  • /admin/settings: Platform rules, fee percentages, global feature flags.

6. UX & UI Details:
- Realistic Indian names (Meera Kapoor, Aarav Shah, Ananya Sharma, Urban Threads, Anarkali Fashion) and INR currency formatting (₹).
- Shared component system: AppShell, StatCard, ChartCard, DataTable (with search, filter, bulk selection, pagination, status badges), DetailDrawer, EmptyState, NotificationSheet, ThemeToggle (Light/Dark).
- Smooth navigation, default redirect from `/` to `/influencer/dashboard` with prominent workspace switcher in top bar to switch to Store Admin or Platform Admin at any time.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b24e9bd1-1e57-471c-ac36-5f5a6f8e8177).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
