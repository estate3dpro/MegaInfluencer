# Mega Influencer — System Concept

## 1. Product vision

Mega Influencer is a platform that connects **store owners** with **influencers** and manages the complete influencer-commerce workflow in one place.

The platform helps a store owner find the right influencer, send products, approve promotional content, automate Instagram comment-to-DM replies, track referral sales, define payment rules, and communicate with both influencers and customers.

```text
Store owner
  -> connects store and products
  -> discovers / invites influencer
  -> assigns products, collections, or inventory access
  -> sends products and approves content
  -> receives sales and campaign analytics

Influencer
  -> accepts store collaboration
  -> receives products / creates content
  -> publishes Instagram Reel
  -> configures comment-to-DM automation with a referral link
  -> sees clicks, orders, sales, and earnings

Customer
  -> comments “Link” (or another keyword) on an Instagram post
  -> receives a DM containing the product referral link
  -> buys from the store
  -> sale is attributed to the influencer and visible to the store owner
```

## 2. User roles

### Admin (platform owner)

The Admin manages the Mega Influencer platform itself.

- Approves, suspends, and supports store owners and influencers.
- Monitors store connections, webhook health, product/order synchronization, automation delivery, and platform usage.
- Resolves support conversations between the platform, store owners, and influencers.
- Maintains global policies, message templates, platform-level analytics, and future subscription/billing controls.
- Does not own a merchant's products, orders, or influencer relationships; those belong to the relevant store owner.

### Store Owner

The Store Owner is a merchant/brand using Mega Influencer to run influencer collaborations.

- Has one organization/brand workspace.
- Can connect one or more stores to that workspace.
- Initially connects Shopify stores; WooCommerce and custom stores are future integrations.
- Syncs products, collections, and orders from the connected store.
- Discovers influencers, sends collaboration requests, manages active collaborations, and assigns products or collections.
- Sends products to influencers, reviews submitted Reel/content drafts, and approves content for publishing.
- Creates payment/commission rules and sees campaign, click, sales, order, and influencer performance analytics.
- Can communicate with influencers, customers, and platform support according to the conversations described below.

### Influencer

The Influencer promotes store products through Instagram content.

- Creates a profile with their public social details and connects their Instagram account.
- Browses or receives invitations from stores.
- Accepts or declines a store collaboration request.
- Views products, collections, or full-catalog access assigned by an accepted store.
- Requests products they want to promote; tracks the store's response and delivery status.
- Uploads/links a Reel draft for store review before publishing.
- Uses Instagram post selection and comment-to-DM automation to share referral links.
- Views their assigned products, content status, link clicks, attributed orders, sales, commission/earnings, and conversations.

## 3. Store and commerce integration

### Supported now: Shopify

The first version uses a Shopify CLI app installed manually for a store. The Store Owner/Admin provides the Shopify app URL and access token to Mega Influencer. The platform verifies the connection and displays its connection health.

After a successful connection, Mega Influencer automatically synchronizes:

- Store details and connection status
- Products
- Product variants
- Collections
- Orders and relevant order status changes

Shopify remains the source of truth for product pricing, stock, inventory, checkout, payment, fulfillment, and order state. Mega Influencer stores the required synchronized references for product assignment, referral tracking, analytics, attribution, and commissions.

### Future integrations

The same integration model should later support:

- WooCommerce
- Custom-developed commerce sites
- Other commerce platforms

Each integration must provide a secure connection, product/catalog sync, order sync, and a way to preserve referral data through checkout.

## 4. Core workflow

### A. Store onboarding and catalog synchronization

1. Admin registers or approves a Store Owner.
2. Store Owner creates their brand workspace.
3. Store Owner connects one or more Shopify stores using the configured Shopify CLI app URL and token.
4. Mega Influencer verifies the credentials and displays `Connected`, `Disconnected`, `Syncing`, or `Error` status.
5. The platform imports products, variants, collections, and orders.
6. Ongoing sync keeps catalog and orders up to date through Shopify webhooks and reconciliation jobs.

### B. Store owner and influencer collaboration

1. Store Owner browses influencer profiles, feeds, audience/work analytics, and past performance on the platform.
2. Store Owner sends a collaboration request to an Influencer.
3. Influencer accepts or declines the request.
4. Once accepted, Store Owner can assign one or more products, collections, or full inventory access to that Influencer.
5. Influencer browses the assigned catalog and requests specific products to promote.
6. Store Owner reviews the request, approves or declines it, and records product dispatch/delivery status.
7. Influencer sees the status of every requested and received product in their dashboard.

### C. Content creation and approval

1. Influencer receives a product from the store.
2. Influencer creates a Reel/video about the product.
3. Before publishing to Instagram, Influencer submits the Reel, post preview/link, script, and optional files to the platform.
4. Store Owner reviews the content and marks it `Approved`, `Changes Requested`, or `Rejected`.
5. After approval, Influencer publishes the Reel on Instagram.
6. The approved content, associated product(s), and approval history remain available to both parties.

### D. Instagram comment-to-DM automation and referral sales

1. Influencer connects Instagram and opens the automation area.
2. Mega Influencer displays the Influencer's Instagram posts.
3. Influencer selects a post/Reel to automate.
4. Influencer chooses a trigger keyword such as `Link`.
5. Influencer selects an approved response-message template and the product used in that post.
6. Mega Influencer creates a unique influencer referral link for that product and saves the automation.
7. A customer comments the trigger word on the Instagram post.
8. Mega Influencer sends the customer an Instagram DM with the referral link.
9. The customer opens the link and is redirected to the product/store.
10. If the customer buys the product, Mega Influencer receives the synchronized order, resolves the referral, and attributes the eligible sale to the Influencer.
11. Store Owner and Influencer dashboards show clicks, orders, sales, conversion, and applicable earnings.

```text
Customer Instagram comment
  -> keyword automation
  -> Instagram DM
  -> influencer-specific referral link
  -> Shopify product / checkout
  -> synchronized order
  -> referral attribution
  -> sales and earnings analytics
```

## 5. Collaboration and commercial models

The Store Owner configures the collaboration model and rules for each influencer, product, collection, or campaign. The platform must support a flexible rule engine rather than assuming every relationship is commission-only.

### Product seeding / content collaboration

The store sends one or more products to an Influencer. The Influencer creates and publishes agreed content, such as a Reel, after store review/approval.

Possible tracking:

- Product requested, approved, dispatched, delivered, returned
- Content submitted, approved, published
- Agreed deliverables and due dates

### Sales commission collaboration

The store sends a product or authorizes promotion. The Influencer earns an amount based on sales attributed through their referral links.

Initial rule types:

- Percentage of eligible sale value
- Fixed amount per eligible order
- Product-specific rate
- Collection-specific rate
- Influencer-specific rate
- Campaign-specific rate

Future rule types can include fixed content fees, tiered commissions, bonuses after sales targets, and hybrid fixed-fee plus commission arrangements.

Commission rules must store the version and calculation input used at the time of sale. Order cancellation, refund, or return rules must be visible to both parties and can reverse or adjust a commission according to the store's policy.

## 6. Analytics

### Store Owner analytics

Store Owners should see data for their organization, stores, influencers, products, collections, campaigns, and automations:

- Connected store and synchronization health
- Number of active influencers and collaboration status
- Product request, dispatch, delivery, and content approval status
- Instagram post and automation performance
- Referral link clicks
- Attributed orders and attributed sales
- Conversion rate from click to order
- Revenue generated by each influencer, product, collection, Reel, and campaign
- Pending, approved, paid, cancelled, and reversed commission totals

### Influencer analytics

Influencers should see only their own authorized information:

- Assigned products and collections
- Product request and delivery status
- Content approval and publishing status
- Active Instagram automations and referral links
- Clicks, attributed orders, attributed sales, conversion rate, and earnings
- Commission status and payment history when payouts are introduced

## 7. Conversations and chat

The platform requires three distinct conversation contexts. They should be separate in the data model and UI so privacy and permissions are clear.

### A. Store Owner ↔ Influencer collaboration chat

Used for a specific collaboration, product assignment, or campaign.

- Store Owner and assigned Influencer can chat.
- They can share text, files, Reel previews/links, scripts, briefs, product questions, and revision feedback.
- Messages should be attached to the relevant collaboration/campaign where possible.
- Admin may access only for support/moderation according to platform policy.

### B. Store Owner ↔ Customer product-support chat

Used when a customer has product questions related to an Influencer's post and the Influencer does not have sufficient product details.

- A customer can raise a product question from the referral/DM journey.
- Store Owner/support team answers with accurate product information.
- Influencer should not be required to answer detailed product, stock, shipping, return, or warranty questions.
- Customer personal data and conversation history must be protected and visible only to the relevant store/support staff.

### C. Help and support chat

Used for platform support rather than a commercial collaboration.

- Store Owner ↔ Admin
- Influencer ↔ Admin
- Store Owner ↔ Influencer support/issue conversations when relevant

Support conversations should have status (`Open`, `Waiting`, `Resolved`, `Closed`), priority, assignee, and an auditable history.

## 8. Main platform entities

| Entity | Purpose |
| --- | --- |
| User | Login identity for Admin, Store Owner, or Influencer. |
| Organization / Brand | Store Owner's workspace and tenant boundary. |
| Store | One Shopify store connected to an organization. |
| Product / Variant / Collection reference | Synchronized Shopify catalog data used for assignment and reporting. |
| Influencer profile | Influencer identity, public profile, social accounts, and analytics summary. |
| Collaboration | Accepted Store Owner–Influencer relationship and its commercial terms. |
| Product assignment / request | Products made available to an Influencer and products requested by them. |
| Product shipment | Product dispatch, delivery, and return tracking. |
| Content submission | Reel/post draft, review decision, feedback, and publishing state. |
| Instagram automation | Post, trigger keyword, template, product, and response configuration. |
| Referral link | Influencer-specific tracked product/store URL. |
| Referral click/session | Tracking context created after a customer opens a link. |
| Order snapshot | Synchronized Shopify order reference. |
| Attribution | Immutable decision linking an eligible order to one referral/influencer. |
| Commission rule / commission | Store-configured earnings policy and calculated influencer amount. |
| Conversation / message / attachment | Collaboration, customer support, and help-chat communication. |

## 9. Ownership, security, and privacy

- Admin has platform administration access; Store Owner data remains logically separated by organization.
- Store Owner can access only their own stores, catalog, orders, influencers, chats, and analytics.
- Influencer can access only their own profile, assigned products, own content, own referral performance, own earnings, and permitted conversations.
- Customers access only public referral pages and their own support conversations; they must never see internal commissions or other customer information.
- Shopify tokens and other credentials are encrypted at rest and never returned through normal APIs or logs.
- Shopify and Instagram webhooks must verify signatures before any payload is processed.
- Referral links are public, but codes must be opaque and cannot expose private internal IDs.
- Financial calculations, approval decisions, content changes, shipments, and support status changes require an audit history.

## 10. V1 boundaries

### Include in the first version

- Admin, Store Owner, and Influencer roles
- Shopify connection through the configured CLI app
- Product, collection, and order synchronization
- Influencer discovery/invitation and collaboration acceptance
- Product assignment, product request, and delivery tracking
- Content submission and store approval
- Instagram post selection, keyword-based comment-to-DM, templates, and referral links
- Click tracking, attributed order tracking, basic sales analytics
- Basic fixed and percentage commission rules
- Store Owner–Influencer collaboration chat and Admin support chat

### Build later

- WooCommerce and custom-store integrations
- Automated payouts, banking/UPI, tax, invoices, and wallets
- Influencer marketplace ranking, advanced discovery, and fraud detection
- Advanced multi-brand campaign tooling and complex commission stacking
- AI content recommendations and customer-chat automation
- Full customer-support suite/CRM integration

## 11. Product decisions still to define

These decisions are important and should be agreed before implementing their modules:

1. How does an Influencer join: self-signup, Admin approval, Store Owner invitation, or all three?
2. Does a Store Owner see every registered Influencer, or only Influencers who opt in to discovery?
3. Who pays for and records product shipment: Mega Influencer, Store Owner, or an external shipping provider?
4. Must content always receive approval before it can be used in automation, or can a Store Owner allow auto-approval?
5. What is the default sales attribution window and policy: last valid click, first click, or campaign-specific rule?
6. Which Shopify cart/order attribute method will carry the signed referral reference through checkout?
7. When does a commission move from pending to approved: order payment, fulfillment, end of return window, or manual approval?
8. Should product-support chat begin inside Instagram, a web page, WhatsApp, or the Mega Influencer panel?
9. What files can be shared in chat and content review, and what storage/retention policy applies?
10. What subscription/pricing model will stores use for Mega Influencer?

## 12. Success definition

The basic system is successful when a Store Owner can connect a Shopify store, choose an approved Influencer, provide a product, approve a Reel, and see a completed purchase attributed to that Influencer after a customer comments on Instagram and receives a referral link by DM. The Influencer should see the same result from their own, appropriately restricted dashboard.
