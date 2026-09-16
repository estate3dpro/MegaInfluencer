# Platform — multi-role creator commerce app

A single web app with three workspaces (Influencer, Store Admin, Platform Admin), each with its own sidebar, header, and pages. One click in the top bar switches between them. All data is realistic demo content (Indian names, ₹ amounts) — no backend yet.

## Design

- Purple-led palette: primary #6C5CE7, violet #8B5CF6, indigo #4F46E5, coral #EC6B9A for creator/campaign accents, teal #20B8A6 for revenue/success.
- Light background #F7F7FB with white cards; full dark mode (#0F1015 / #171820 / #1D1F29) via a light/dark toggle in the header.
- Rounded cards, soft shadows, clean type, Lucide icons, Recharts graphs, slide-out drawer navigation on phones and tablets.

## Shared building blocks

AppShell (sidebar + header + role switcher + notifications drawer + user menu), StatCard, ChartCard, DataTable (search, filters, bulk select, pagination, status badges), DetailDrawer, EmptyState, ThemeToggle, ₹ formatting helper, shared demo data module.

## Build order

**Phase 1 — Foundation**
Design tokens and dark mode, shared components, three layouts with the workspace switcher, demo data, `/` redirecting to the Influencer dashboard.

**Phase 2 — Influencer (13 pages)**
Dashboard, profile, discover, storefront, products with link generation, campaigns, links manager, Instagram automation builder, orders, earnings with payout request, analytics, notifications, support.

**Phase 3 — Store Admin (14 pages)**
Dashboard, store settings, products, creator CRM, campaigns, affiliate attribution funnel, orders, commissions ledger, analytics, customers, discounts, integrations, reports, settings.

**Phase 4 — Platform Admin (19 pages)**
Dashboard, influencers, stores, brands, products, campaigns, attribution funnel, orders, commissions, payouts, social accounts, integrations, analytics, users/RBAC, finance, support desk, reports, system monitoring, settings.

Each page gets its own title and description for sharing and search.

## Technical notes

- TanStack Start file-based routes: `src/routes/influencer.*.tsx`, `store-admin.*.tsx`, `admin.*.tsx`, each with a layout route rendering the matching shell.
- Tokens defined in `src/styles.css` under `@theme inline`; components use semantic classes only.
- Demo data in `src/data/*` typed modules so tables, charts, and drawers stay consistent across roles.
- Recharts for all charts; shadcn primitives (Sheet, Dialog, Tabs, Table, Badge) for interaction.
- No database or auth in this scope; role switching is client-side navigation. Cloud can be added later to make data real.

## Not included yet

Live payouts, real integrations (Shopify, Stripe, Instagram), and persistent data — those need a backend and provider accounts.
