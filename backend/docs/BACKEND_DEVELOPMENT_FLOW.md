# Mega Influencer — Phased Backend Development Flow

This is the backend build order for the system described in [SYSTEM_CONCEPT.md](./SYSTEM_CONCEPT.md). Complete each phase, including its migration, API authorization, tests, and acceptance checks, before starting the next phase.

## 1. Product summary

Mega Influencer connects **Store Owners** with **Influencers**. A Store Owner connects one or more stores, assigns products to Influencers, reviews their content, and tracks influencer-driven sales. An Influencer promotes approved products on Instagram using comment-to-DM automation and a tracked referral link. Customers receive the link by DM and purchase from the store.

```text
Admin manages the platform
  -> Store Owner connects Shopify store(s)
  -> products, collections, and orders synchronize
  -> Store Owner and Influencer create a collaboration
  -> Influencer requests / receives a product
  -> Influencer submits Reel -> Store Owner approves
  -> Influencer publishes Instagram post and enables automation
  -> customer comment -> Instagram DM -> referral link -> Shopify order
  -> attribution -> commission -> analytics for Store Owner and Influencer
```

## 2. Non-negotiable architecture rules

- Use a modular monolith: one Fastify API, one PostgreSQL database, and clearly separated domain modules.
- The roles are `ADMIN`, `STORE_OWNER`, and `INFLUENCER`.
- A Store Owner can have one organization/brand workspace with one or more connected stores.
- Start with Shopify only. WooCommerce and custom-store integrations come later behind the same store-integration interface.
- Shopify is the source of truth for catalog, stock, checkout, payment, fulfillment, and order state.
- Mega Influencer is the source of truth for collaborations, product assignments/requests, content review, automations, referral links, clicks, attribution, commissions, chats, and platform analytics.
- Every private merchant record must be scoped to an organization. A Store Owner must never access another Store Owner's records.
- Put business logic in services. Route handlers validate input, authorize the actor, call a service, and return a safe response.
- Use Prisma migrations for every schema change. Store money as integer minor units; never use floating-point values for money.
- Use opaque IDs and public referral codes; do not expose sequential internal IDs in public URLs.
- Webhook and commission processing must be idempotent.

## 3. Folder contract

```text
src/
  config/                         Environment configuration
  modules/
    <module>/
      <module>.routes.ts          HTTP routes
      <module>.service.ts         Business rules and transactions
      <module>.schema.ts          Request/response validation
      <module>.repository.ts      Optional complex database queries
      <module>.types.ts           Module-local types
      <module>.test.ts            Integration tests
  plugins/                        Prisma, CORS, auth, logging integrations
  routes/                         Central registration of modules
  shared/                         Errors, pagination, IDs, authorization helpers
  types/                          Fastify type extensions
prisma/
  schema.prisma
  migrations/
docs/
```

For each module, start with `routes`, `service`, and `schema`; add a repository only for complex/reused query logic. Do not create empty placeholder folders.

## 4. Standard implementation sequence

1. Record the product decision: ownership, allowed states, transitions, source of truth, and acceptance criteria.
2. Add/update Prisma models, relations, constraints, and indexes.
3. Run `npm run prisma:migrate -- --name <clear_name>` and review the generated SQL.
4. Add request/params/query validation schemas.
5. Implement service methods and transactions.
6. Add role and organization authorization checks.
7. Add Fastify routes under `/api/v1`, except public redirects and provider webhooks.
8. Add success, validation, unauthenticated, forbidden, and cross-organization tests.
9. Run `npm run prisma:generate`, `npm run typecheck`, and `npm run build`.
10. Update this document and [SYSTEM_CONCEPT.md](./SYSTEM_CONCEPT.md) if the product decision changed.

## 5. Phase roadmap

| Phase | Name | Main outcome | Status | Depends on |
| --- | --- | --- | --- | --- |
| 0 | Platform foundation | Safe, observable Fastify API with standard errors and test support. | ✅ Complete | Existing setup |
| 1 | Authentication, roles, and organizations | Admin, Store Owner, Influencer identities and tenant boundaries. | ✅ Complete | Phase 0 |
| 2 | Shopify store connection and synchronization | Verified manual store connection plus product, collection, and order sync. | ✅ Complete | Phase 1 |
| 3 | Influencer discovery, collaboration & campaigns | Store Owners can find/manage creators, create campaigns, review applications. | ✅ Complete | Phases 1–2 |
| 4 | Product assignment and influencer catalog | Assign products/stores to creators; creators browse & request products. | ✅ Complete | Phase 3 |
| 5 | Content submission and approval | Store Owners review Reels/briefs before they are used in campaigns. | 🔄 Integrated (Campaign Flow) | Phase 4 |
| 6 | Instagram automation and referral links | Instagram OAuth, post sync, comment-to-DM keyword trigger & referral link generation. | ✅ Complete | Phases 2, 5 |
| 7 | Click tracking, order ingestion, and attribution | Purchases & clicks securely matched to Influencers via `/r/:code` & Shopify order webhooks. | ✅ Complete | Phase 6 |
| 8 | Commission rules and earnings | Store-defined commission rates calculate creator earnings and payouts. | ✅ Complete | Phase 7 |
| 9 | Store and Influencer analytics | Both roles see real-time performance data, conversions, revenue, and charts. | ✅ Complete | Phase 8 |
| 10 | Collaboration, customer, and support chat | Multi-context real-time chat via `megachatxprasadam` bridge. | ✅ Complete | Phases 1, 3–5 |
| 11 | Operations hardening and future integrations | Production queues, reconciliation, rate limits, WooCommerce/custom store readiness. | 🔄 In Progress | Phases 0–10 |

## 6. Phase 0 — Platform foundation

**Goal:** make the API reliable, debuggable, and ready for domain modules.

Build:

- Standard API error envelope: `{ error: { code, message, requestId } }`.
- Global Fastify error handler that does not expose stack traces or secrets in production.
- Request ID propagation in Pino logs; include method, URL, actor ID, and organization ID when available.
- Health endpoints: `/health` for API/database and `/ready` for deployment readiness when external dependencies are added.
- Shared validation convention and pagination helper.
- Test harness using an isolated PostgreSQL database.
- Base authorization helper placeholders; do not create a temporary insecure authentication bypass.

**Done when:** errors have a stable response format, logs can trace one request, database health is reported, and one route can be tested with Fastify injection.

**Implementation status:** complete. Before adding tests that execute Prisma queries, configure `TEST_DATABASE_URL` to a separate disposable PostgreSQL database; never run test migrations against development or production data.

## 7. Phase 1 — Authentication, roles, and organizations

**Goal:** establish who each user is and what data they can access.

### Core decisions

- Select the authentication provider/strategy before implementation.
- One `User` has a global platform role: `ADMIN`, `STORE_OWNER`, or `INFLUENCER`.
- A Store Owner's data is contained within an `Organization` (brand workspace).
- An Influencer is not an organization member. Their access is granted through an accepted collaboration in Phase 3.

### Core models

- `User`: auth provider subject, email, display name, role, status, timestamps.
- `Organization`: brand name, slug, status, owner relation, timestamps.
- `OrganizationMember`: optional future model for multi-user store teams. V1 may use the Store Owner as the sole workspace user.

### Routes

```text
GET   /api/v1/me
POST  /api/v1/organizations
GET   /api/v1/organizations/current
PATCH /api/v1/organizations/current
GET   /api/v1/admin/users
PATCH /api/v1/admin/users/:userId/status
```

### Authorization rules

- `ADMIN`: platform-wide support and moderation access.
- `STORE_OWNER`: only their organization, stores, catalog, collaborations, orders, analytics, and conversations.
- `INFLUENCER`: only their profile, accepted collaborations, assigned products, content, links, analytics, and permitted conversations.

**Implementation status:** backend module implemented. The generated migration is `20260914133000_phase_1_identity_and_organizations`; apply it after the local PostgreSQL service is reachable.

**Done when:** Store Owner A cannot retrieve Store Owner B's data, and a user cannot self-promote to a different role.

## 8. Phase 2 — Shopify store connection and synchronization

**Goal:** allow a Store Owner to manually connect one or more Shopify stores, verify connection health, and synchronize commerce data.

### V1 connection flow

1. Store Owner opens the Shopify connection screen.
2. Store Owner provides the configured Shopify CLI app URL/shop domain and token through a secure form.
3. Mega Influencer validates the credentials against Shopify.
4. The token is encrypted at rest; it is never returned by normal API responses or logged.
5. The system creates/updates the store record and displays connection status.
6. The first catalog sync starts automatically.
7. Webhooks and scheduled reconciliation keep the data current.

This is a **manual connection flow for V1**, not a public Shopify OAuth installation flow. Shopify OAuth can be added later as a separate enhancement.

### Core models

- `Store`: organization ID, provider (`SHOPIFY`), shop domain, app URL/reference, connection status, last check, last sync, currency/timezone.
- `StoreCredential`: store ID, encrypted access token, token metadata, rotation timestamps.
- `StoreSyncRun`: store ID, sync type (`PRODUCTS`, `COLLECTIONS`, `ORDERS`), status, started/finished timestamps, counts, error summary.
- `WebhookDelivery`: provider delivery ID, store ID, topic, payload/body reference, received/processed timestamps, outcome; unique provider delivery ID.
- `ProductReference`, `VariantReference`, and `CollectionReference`: synchronized catalog references, provider IDs, statuses, and last-sync timestamps.
- `OrderSnapshot` and `OrderEvent`: normalized Shopify order data and lifecycle events.

### Routes

```text
POST   /api/v1/stores/shopify/connect
GET    /api/v1/stores
GET    /api/v1/stores/:storeId
POST   /api/v1/stores/:storeId/check-connection
POST   /api/v1/stores/:storeId/sync
GET    /api/v1/stores/:storeId/sync-runs
DELETE /api/v1/stores/:storeId/disconnect
POST   /webhooks/shopify
```

### Synchronization rules

- Synchronize products, variants, collections, and orders after connection.
- Use Shopify webhooks for updates and a reconciliation job to repair missed events.
- Shopify remains authoritative; Mega Influencer never edits Shopify prices, inventory, checkout, or payment state.
- Verify each webhook signature using the raw request body before persisting/processing it.
- Persist delivery records before processing; duplicate deliveries must not duplicate products, orders, or downstream work.

**Done when:** a Store Owner can connect two Shopify stores, see each connection/sync status, and select synchronized products/collections in later modules. Invalid tokens and invalid webhook signatures are rejected safely.

## 9. Phase 3 — Influencer discovery and collaboration

**Goal:** let Store Owners find Influencers and create an approved working relationship.

### Core models

- `InfluencerProfile`: user ID, username, display name, bio, public visibility, profile status, contact/social summary.
- `InfluencerSocialAccount`: influencer ID, provider (`INSTAGRAM`), provider account ID, username, connection/verification status.
- `Collaboration`: organization ID, influencer ID, status, invitation message, requested/accepted/declined timestamps, commercial summary.
- `CollaborationEvent`: collaboration ID, event type, actor ID, timestamp, details for audit.

Collaboration statuses: `PENDING`, `ACCEPTED`, `DECLINED`, `PAUSED`, `ENDED`.

### Flow and routes

1. Store Owner searches visible Influencer profiles and their allowed public feed/performance information.
2. Store Owner sends a collaboration request.
3. Influencer accepts or declines it.
4. Only after acceptance can the Store Owner assign catalog access, products, or collections.

```text
GET    /api/v1/influencers/discover
GET    /api/v1/influencers/:influencerId
POST   /api/v1/collaborations
GET    /api/v1/collaborations
POST   /api/v1/collaborations/:collaborationId/accept
POST   /api/v1/collaborations/:collaborationId/decline
POST   /api/v1/collaborations/:collaborationId/pause
POST   /api/v1/collaborations/:collaborationId/end
GET    /api/v1/influencer/collaborations
```

**Done when:** no product can be assigned before acceptance; an Influencer sees only their own invitations; Store Owner access is scoped to their organization.

## 10. Phase 4 — Product assignment, requests, and shipment

**Goal:** manage which catalog items an accepted Influencer may promote and the product-sending workflow.

### Core models

- `CatalogAssignment`: collaboration ID, optional product/variant/collection ID, assignment type (`PRODUCT`, `COLLECTION`, `FULL_CATALOG`), status, assigned by/date.
- `ProductRequest`: collaboration ID, product/variant ID, status, Influencer note, Store Owner decision/note, timestamps.
- `ProductShipment`: product request ID, shipment status, tracking number, carrier, dispatched/delivered/returned timestamps, notes.

Request statuses: `PENDING`, `APPROVED`, `DECLINED`, `CANCELLED`.

Shipment statuses: `PENDING`, `DISPATCHED`, `DELIVERED`, `RETURNED`, `CANCELLED`.

### Flow and routes

1. Store Owner assigns individual products, collections, or the full catalog to an accepted Influencer.
2. Influencer opens their assigned catalog and requests a product.
3. Store Owner approves or declines the request.
4. Store Owner records shipping details and dispatch/delivery status.
5. Influencer sees the request and delivery state in their dashboard.

```text
POST   /api/v1/collaborations/:collaborationId/catalog-assignments
GET    /api/v1/collaborations/:collaborationId/catalog-assignments
GET    /api/v1/influencer/assigned-catalog
POST   /api/v1/product-requests
GET    /api/v1/product-requests
POST   /api/v1/product-requests/:requestId/approve
POST   /api/v1/product-requests/:requestId/decline
POST   /api/v1/product-requests/:requestId/shipments
PATCH  /api/v1/product-requests/:requestId/shipment
```

**Done when:** an Influencer cannot request an unassigned product; product/shipment status history is auditable; one organization's product cannot be assigned through another organization's collaboration.

## 11. Phase 5 — Content submission and approval

**Goal:** ensure a Store Owner can review influencer content before it is promoted.

### Core models

- `ContentSubmission`: collaboration ID, product request/product relation, content type (`REEL`, `POST`, `STORY`), draft URL/file references, caption/script, status, submitted/published timestamps.
- `ContentReview`: content submission ID, reviewer ID, decision (`APPROVED`, `CHANGES_REQUESTED`, `REJECTED`), feedback, timestamp.
- `ContentAttachment`: content submission ID, file name/type/size/storage key; do not store public file URLs by default.

Content statuses: `DRAFT`, `SUBMITTED`, `CHANGES_REQUESTED`, `APPROVED`, `PUBLISHED`, `REJECTED`, `ARCHIVED`.

### Flow and routes

1. Influencer creates a Reel/video after receiving a product.
2. Influencer submits a preview/link, script/caption, and optional files.
3. Store Owner approves, rejects, or requests changes.
4. Only approved content can be linked to a commerce automation in Phase 6.
5. Influencer publishes the approved Reel to Instagram and records the published post URL/ID.

```text
POST   /api/v1/content-submissions
GET    /api/v1/content-submissions
GET    /api/v1/content-submissions/:contentId
POST   /api/v1/content-submissions/:contentId/reviews
POST   /api/v1/content-submissions/:contentId/publish
```

**Done when:** an Influencer cannot approve their own content, review history is immutable, and non-approved content cannot be connected to a sales automation.

## 12. Phase 6 — Instagram automation and referral links

**Goal:** let an Influencer select an Instagram post, trigger on a comment keyword, and send a tracked product link by DM.

### Core models

- `InstagramConnection`: Influencer ID, encrypted access token, connected account ID, status, refresh/expiry metadata.
- `InstagramPost`: Instagram provider post ID, influencer ID, permalink, caption, media type, published timestamp, synchronization state.
- `MessageTemplate`: organization ID or platform-global scope, title, content, status, allowed variables.
- `ReferralLink`: collaboration ID, organization/store/influencer/product/variant relations, opaque public code, destination URL snapshot, status, active/disabled timestamps.
- `InstagramAutomation`: Instagram post ID, collaboration ID, content submission ID, keyword, template ID, referral link ID, status.
- `DmLog`: automation ID, Instagram comment ID, customer/provider reference, sent/failed status, referral context, deduplication key.

### Flow and routes

1. Influencer connects Instagram and synchronizes their posts.
2. Influencer selects an approved, published Reel/post from their Instagram feed.
3. Influencer selects a trigger keyword, for example `Link`.
4. Influencer chooses an approved response template and an assigned product used in the post.
5. The backend validates accepted collaboration, product assignment, product availability, content approval, and active Instagram connection.
6. The backend creates an active referral link and saves the automation.
7. On a matching Instagram comment, the webhook/worker sends a DM with the referral link and writes one deduplicated `DmLog`.

```text
POST   /api/v1/influencer/instagram/connect
GET    /api/v1/influencer/instagram/posts
GET    /api/v1/message-templates
POST   /api/v1/referral-links
GET    /api/v1/referral-links
POST   /api/v1/instagram-automations
GET    /api/v1/instagram-automations
PATCH  /api/v1/instagram-automations/:automationId
POST   /webhooks/instagram
```

**Done when:** only an assigned product with approved content can be automated; duplicate comment events never send two DMs; an inactive link/automation never sends a broken product URL.

## 13. Phase 7 — Click tracking, order ingestion, and attribution

**Goal:** securely connect a customer click and Shopify purchase to the correct Influencer/referral link.

### Core models

- `ReferralClick`: referral link ID, occurred timestamp, privacy-approved request metadata, deduplication data.
- `AttributionSession`: opaque signed session reference, referral link/collaboration/store relation, issued/expires timestamps, status.
- `Attribution`: order snapshot ID (unique), referral link/session/collaboration relation, policy version, source, decision details, attributed/reversed timestamps.

### Flow

```text
GET /r/:code
  -> validate active referral link
  -> record ReferralClick
  -> create/update a signed AttributionSession
  -> set signed, HTTP-only, Secure cookie
  -> redirect to Shopify product URL
  -> storefront copies safe reference into cart/order attributes
  -> verified Shopify order webhook updates OrderSnapshot
  -> attribution service validates session/link/store/time window
  -> create one Attribution or record order as unattributed
```

V1 attribution policy recommendation: the **last valid eligible referral** inside a documented attribution window wins. Store the selected policy version on every attribution. Never infer attribution from a public code alone when the signed checkout reference is missing.

### Routes

```text
GET  /r/:code
GET  /api/v1/referral-links/:linkId/analytics
GET  /api/v1/orders
GET  /api/v1/orders/:orderId
POST /webhooks/shopify
```

**Done when:** an eligible Shopify order receives at most one attribution, repeat webhook delivery is safe, and neither Store Owners nor Influencers can view another party's private order data.

## 14. Phase 8 — Commission rules and earnings

**Goal:** allow a Store Owner to define how an Influencer is paid and calculate earnings from attributed orders.

### Core models and rules

- `CommissionRule`: organization/collaboration/product/collection scope, type (`PERCENTAGE`, `FIXED`), value, priority, active period, version, status.
- `Commission`: attribution ID, Influencer ID, currency, eligible basis amount, calculated amount, immutable rule snapshot, status.
- `CommissionEvent`: commission ID, event type, actor/system source, reason, timestamp.

Commission statuses: `PENDING`, `APPROVED`, `PAID`, `CANCELLED`, `REVERSED`.

- V1 supports percentage-of-eligible-sales and fixed-per-order rules.
- Store Owner can define organization default, collaboration, product, or collection rules.
- Suggested precedence: campaign (future) -> product -> collection -> collaboration -> organization default.
- Create commissions from immutable attribution/order snapshots, never a live product price.
- Refund/cancellation/return events adjust commission according to the Store Owner's policy.
- Payments can first be recorded manually; automated bank/UPI payout is later.

### Routes

```text
POST  /api/v1/commission-rules
GET   /api/v1/commission-rules
PATCH /api/v1/commission-rules/:ruleId
GET   /api/v1/commissions
POST  /api/v1/commissions/:commissionId/approve
POST  /api/v1/commissions/:commissionId/pay
POST  /api/v1/commissions/:commissionId/reverse
GET   /api/v1/influencer/earnings
```

**Done when:** the same attribution does not create two commissions, old commissions retain the original rule snapshot, and refunded/cancelled orders are handled according to policy.

## 15. Phase 9 — Store Owner and Influencer analytics

**Goal:** show useful operational and sales data without exposing another user's data.

### Store Owner dashboard data

- Connection/synchronization health per store.
- Influencer discovery/collaboration status.
- Product request, dispatch, delivery, and content approval status.
- Instagram post, automation, and DM performance.
- Referral clicks, attributed orders/sales, and conversion rate.
- Revenue by Influencer, product, collection, Reel, and campaign.
- Pending/approved/paid/reversed commissions.

### Influencer dashboard data

- Assigned products/collections and product request/delivery status.
- Content approval/publish status.
- Active posts, automations, and referral links.
- Their own clicks, attributed orders, attributed sales, conversion, and earnings.

### Routes

```text
GET /api/v1/dashboard/store-overview
GET /api/v1/dashboard/store/influencers
GET /api/v1/dashboard/store/products
GET /api/v1/dashboard/store/automations
GET /api/v1/dashboard/influencer-overview
GET /api/v1/dashboard/influencer/performance
```

Reports require a validated date range, timezone, pagination, and authorization. Begin with direct database queries; create aggregate/read models only when measured query load requires it.

**Done when:** figures are defined consistently, empty data has correct zero states, queries have appropriate indexes, and results are correctly limited by role/organization.

## 16. Phase 10 — Collaboration, customer, and support chat

**Goal:** give each user the right communication channel without mixing private contexts.

| Type | Participants | Purpose |
| --- | --- | --- |
| Collaboration chat | Store Owner and accepted Influencer | Product briefs, scripts, Reel previews, revisions, and work discussion. |
| Customer product-support chat | Store Owner/store support and customer | Accurate answers to product, stock, shipping, return, warranty, and similar questions. |
| Help/support chat | Store Owner or Influencer with Admin | Platform support, connection issues, policy questions, and issue resolution. |

### Core models

- `Conversation`: type, organization ID, collaboration/product reference where applicable, status, priority, created/closed timestamps.
- `ConversationParticipant`: conversation ID, user/customer reference, participant role, joined/left timestamps.
- `Message`: conversation ID, sender, body, sent/edited/deleted timestamps.
- `MessageAttachment`: message ID, secure storage key, filename, media type, size.
- `SupportTicket`: optional extension for help conversations with assignee, priority, and resolution information.

Conversation statuses: `OPEN`, `WAITING`, `RESOLVED`, `CLOSED`.

### Rules

- Influencers may only access their own collaboration conversations.
- Store Owners may only access their organization and customer-support conversations.
- Customer identity/data is visible only to the relevant Store Owner/support staff.
- Admin access is limited to support/moderation policy and must be auditable.
- Use signed upload URLs and authorization checks for files; never expose raw storage paths.

**Done when:** participants cannot add themselves to unrelated conversations, attachments require authorization, and status/assignment history is auditable.

## 17. Phase 11 — Operations hardening and future integrations

**Goal:** prepare the completed V1 for dependable production operation and expansion.

Build after the V1 workflows work:

- Background workers/queue for Shopify sync, webhook processing, Instagram DM processing, reconciliation, retry, and dead-letter handling.
- Rate limits, job monitoring, alerts, backups, secret rotation, and audit-log retention.
- Reconciliation dashboards for connection failures, stale syncs, failed DMs, unattributed orders, and commission exceptions.
- A provider adapter interface so WooCommerce/custom stores implement connection validation, catalog sync, order sync, and checkout referral context without changing the core collaboration/referral modules.
- Future features: automated payouts, advanced campaign rules, marketplace ranking, customer-support integrations, and AI recommendations.

**Done when:** failures are observable and recoverable, retries are safe, credentials are rotatable, and a new commerce provider does not require rewriting the core collaboration/attribution modules.

## 18. API and data conventions

- Use plural kebab-case resource URLs: `/product-requests`, `/content-submissions`, `/commission-rules`.
- Use camelCase JSON fields.
- Return `201` for create, `204` for successful no-body deletion, `404` for missing/inaccessible records, and `409` for invalid state/unique conflicts.
- Use cursor pagination for clicks, orders, messages, and webhook deliveries:

```text
?limit=25&cursor=<opaque-cursor>&sort=createdAt&order=desc
```

- One coherent concern per Prisma migration; never edit an applied migration.
- Review migration SQL before shared-environment deployment.
- Add indexes for real relationship/filter queries and validate with query plans.
- Use separately runnable, idempotent backfill jobs for large existing-data changes.

## 19. Current next task & Roadmap Status

All core modules for Phase 0 through Phase 10 are **implemented and active**:
- **Authentication & Multi-Tenant Identity (Phase 1)**: Active (`/api/v1/auth/*`, `ADMIN`, `STORE_OWNER`, `INFLUENCER`).
- **Shopify Catalog & Orders Sync (Phase 2)**: Active (`/api/v1/store/products`, `/api/v1/store/orders`, `/api/v1/store/customers`, Admin API / CLI bridge app).
- **Influencer CRM & Campaign Engine (Phase 3 & 5)**: Active (`/api/v1/campaigns`, `/api/v1/store/creators`, applications, deliverables, assignments).
- **Product & Store Assignments (Phase 4)**: Active (`/api/v1/product-assignments`, `/api/v1/influencer/stores`, `/api/v1/influencer/products`).
- **Instagram Automation & Direct Message Tracking (Phase 6)**: Active (`/api/v1/instagram/*`, `/api/v1/instagram-automations/*`, `/webhooks/instagram`).
- **Referral Tracking & Attribution (Phase 7)**: Active (`/r/:code`, click logging, UTM capturing, `/webhooks/shopify/orders` attribution).
- **Commission Calculations & Earnings (Phase 8)**: Active (`AffiliateCommission` recording, influencer earnings).
- **Analytics & Dashboards (Phase 9)**: Active (`/api/v1/influencer/dashboard`, `/api/v1/influencer/analytics`, Store analytics).
- **Multi-Role Real-Time Chat (Phase 10)**: Active (`megachatxprasadam` bridge integration & frontend chat UI).

### Current Focus (Phase 11 — Operations hardening & Scale)
1. **Background Job Processing**: Add Redis/BullMQ queueing for webhook processing and automated sync reconciliation jobs.
2. **Reconciliation & Rate Limiting**: Automatic periodic sync checks for missed Shopify order events or Instagram DM delivery failures.
3. **Automated Payouts**: Direct UPI / RazorpayX integration for instant influencer commission payouts.
4. **WooCommerce / Custom Stores**: Implement the provider adapter interface for non-Shopify stores.
