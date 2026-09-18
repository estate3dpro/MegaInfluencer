# Campaign Creation Specification --- Store Side

## 1. Overview

This document defines the **Store Owner / Store Admin Campaign
Creation** module for the influencer marketing and referral platform.

The store owner creates a campaign that eligible influencers can
discover, understand, apply to, and complete.

A campaign should define:

-   What the store wants from influencers
-   Which products/content are involved
-   How influencers will be compensated
-   Who is eligible to apply
-   What content must be delivered
-   Campaign deadlines
-   Approval and usage rules
-   Referral/commission rules when applicable

------------------------------------------------------------------------

# 2. Campaign Compensation Plans

The platform should support the following plans:

1.  **Fixed Pricing**
2.  **Barter / Product Exchange**
3.  **Commission / Affiliate**
4.  **Hybrid --- Fixed + Commission**
5.  **Performance / CPA**
6.  **Negotiable / Custom**

For the initial MVP, the recommended plans are:

-   Fixed Pricing
-   Barter
-   Commission
-   Hybrid

Performance and Negotiable can be added later.

------------------------------------------------------------------------

# 3. Common Campaign Fields

These fields are available for most or all campaign types.

## 3.1 Basic Information

  ------------------------------------------------------------------------
  Field            Type                          Required Description
  ---------------- ---------------- --------------------- ----------------
  Campaign Title   Text                               Yes Public campaign
                                                          name

  Campaign Brief   Textarea                           Yes Detailed
                                                          campaign
                                                          description

  Campaign         Select                             Yes Fashion, Beauty,
  Category                                                Food, Lifestyle,
                                                          etc.

  Campaign Type    Multi/Select                       Yes Reel, Story,
                                                          Post, YouTube,
                                                          UGC, etc.

  Campaign         Select                             Yes Sales,
  Objective                                               Awareness,
                                                          Product Launch,
                                                          UGC, etc.
  ------------------------------------------------------------------------

### Campaign Categories

-   Fashion
-   Beauty
-   Lifestyle
-   Food
-   Travel
-   Fitness
-   Technology
-   Education
-   Gaming
-   Finance
-   Other

### Campaign Objectives

-   Sales
-   Brand Awareness
-   Product Launch
-   Website Traffic
-   Content Creation
-   UGC
-   Product Review
-   App Promotion
-   Engagement

------------------------------------------------------------------------

# 4. Content Deliverables

The store owner should define exactly what an influencer must create.

## 4.1 Platform

-   Instagram
-   YouTube
-   Facebook
-   Other

## 4.2 Deliverables

Instead of storing a single text value such as:

`1 Reel + 2 Stories`

use structured fields.

Example:

  Deliverable         Quantity
  ----------------- ----------
  Instagram Reel             1
  Instagram Story            2
  Instagram Post             0
  YouTube Video              0
  YouTube Short              0
  UGC Video                  0

## 4.3 Content Requirements

  Field                       Type             Required
  --------------------------- -------------- ----------
  Video Duration              Number/Range     Optional
  Caption Required            Boolean          Optional
  Brand Mention Required      Boolean          Optional
  Product Tag Required        Boolean          Optional
  Hashtags                    Text             Optional
  Required CTA                Text             Optional
  Voiceover Required          Boolean          Optional
  Music Requirement           Text             Optional
  Content Approval Required   Boolean          Optional

Example:

``` text
1 Reel
Duration: 30–60 seconds

2 Stories
Duration: 15 seconds each

Mention: @brand
Hashtag: #BrandName
CTA: Shop Now
```

------------------------------------------------------------------------

# 5. Campaign Timeline

Recommended timeline fields:

  Field                         Description
  ----------------------------- -------------------------------------
  Application Start Date        When influencers can start applying
  Application Deadline          Last date to apply
  Campaign Start Date           When selected influencers can begin
  Content Submission Deadline   Last date to submit content
  Campaign End Date             Campaign completion date

For MVP, the minimum required dates can be:

-   Application Deadline
-   Content Deadline
-   Campaign End Date

------------------------------------------------------------------------

# 6. Plan 1 --- Fixed Pricing

## 6.1 Purpose

The store pays the influencer a fixed amount for completing the agreed
campaign deliverables.

Example:

``` text
1 Reel + 2 Stories
Fixed Payment: ₹3,500
```

The payment does not depend directly on sales generated.

## 6.2 Input Fields

  ------------------------------------------------------------------------
  Field            Type                          Required Description
  ---------------- ---------------- --------------------- ----------------
  Compensation     Fixed                              Yes Fixed Pricing
  Type                                                    

  Payment Per      Currency                           Yes Amount paid to
  Influencer                                              one influencer

  Total Campaign   Currency                           Yes Maximum campaign
  Budget                                                  budget

  Number of        Number                             Yes Maximum creators
  Influencers                                             to approve

  Payment Trigger  Select                             Yes Content Approval
                                                          / Posting /
                                                          Completion

  Payout Timeline  Select                             Yes 7 / 15 / 30 days

  Minimum          Number                        Optional Minimum creator
  Followers                                               followers

  Minimum          Number                        Optional Minimum
  Engagement Rate                                         engagement
  ------------------------------------------------------------------------

## 6.3 Example

``` text
Plan: Fixed Pricing

Payment Per Influencer: ₹3,500
Influencers Required: 10
Total Budget: ₹35,000

Deliverables:
1 Reel + 2 Stories

Payment Trigger:
After Content Approval

Payout:
Within 7 Days
```

## 6.4 Important Rule

`Total Campaign Budget` and `Payment Per Influencer` are separate
values.

For example:

``` text
Total Budget = ₹50,000
Influencers = 20
Payment Per Influencer = ₹2,500
```

------------------------------------------------------------------------

# 7. Plan 2 --- Barter / Product Exchange

## 7.1 Purpose

The store provides free products to the influencer instead of, or as an
alternative to, monetary payment.

This is especially useful for:

-   Fashion
-   Beauty
-   Accessories
-   Food
-   Consumer products

## 7.2 Input Fields

  ------------------------------------------------------------------------
  Field            Type                          Required Description
  ---------------- ---------------- --------------------- ----------------
  Compensation     Barter                             Yes Barter plan
  Type                                                    

  Product          Shopify Product                    Yes Product provided
                                                          to influencer

  Product Variant  Shopify Variant      Optional/Required Size, color,
                                                          etc.

  Product Quantity Number                             Yes Number of units

  Product Value    Currency                          Auto Product value

  Maximum Product  Currency                      Optional Maximum allowed
  Value                                                   value

  Shipping         Select                             Yes Store /
  Provided By                                             Influencer

  Product          Select                             Yes Influencer keeps
  Ownership                                               / Return
                                                          required

  Return Deadline  Date                       Conditional Required if
                                                          return is
                                                          enabled
  ------------------------------------------------------------------------

## 7.3 Example

``` text
Plan: Barter

Product:
Designer Kurta Set

Variant:
Size M / Burgundy

Product Value:
₹3,999

Quantity:
1

Influencer Keeps Product:
Yes

Deliverables:
1 Reel + 2 Stories
```

## 7.4 Shopify Integration

If the store is connected to Shopify:

``` text
Select Product
      ↓
Select Variant
      ↓
Product Name
Product Image
Price
SKU
Inventory
```

Product information should be retrieved automatically.

The store owner should not need to manually enter product details.

------------------------------------------------------------------------

# 8. Plan 3 --- Commission / Affiliate

## 8.1 Purpose

The influencer earns money based on sales generated through their
referral link/code.

This plan directly connects with the platform's attribution system.

Example:

``` text
Commission = 10%

Influencer generates:
₹50,000 eligible sales

Commission:
₹5,000
```

## 8.2 Input Fields

  Field                   Type              Required Description
  ----------------------- ------------ ------------- ----------------------------------
  Compensation Type       Commission             Yes Commission plan
  Commission Type         Select                 Yes Percentage / Fixed Per Order
  Commission Rate         Percentage     Conditional Example: 10%
  Commission Per Order    Currency       Conditional Example: ₹150
  Commission Basis        Select                 Yes Order Subtotal / Net Order Value
  Attribution Window      Select                 Yes 7 / 14 / 30 days
  Eligible Order Status   Select                 Yes Paid / Delivered
  Minimum Payout          Currency          Optional Minimum payout threshold
  Payout Schedule         Select                 Yes Weekly / Monthly
  Cancelled Orders        Rule                   Yes Normally excluded
  Returned Orders         Rule                   Yes Normally excluded

## 8.3 Example

``` text
Plan: Commission

Commission Type:
Percentage

Commission Rate:
10%

Commission Basis:
Net Order Value

Attribution Window:
30 Days

Eligible Order:
Delivered Order

Cancelled Orders:
Excluded

Returned Orders:
Excluded

Payout:
Monthly
```

## 8.4 Attribution

The platform should generate or associate an influencer referral
identifier:

``` text
Campaign
   ↓
Influencer
   ↓
Referral Link / Code
   ↓
Customer
   ↓
Shopify Order
   ↓
Attribution
   ↓
Commission
   ↓
Payout
```

------------------------------------------------------------------------

# 9. Plan 4 --- Hybrid

## 9.1 Purpose

The influencer receives both:

1.  A fixed payment
2.  A commission on generated sales

Example:

``` text
₹2,000 Fixed
+
8% Commission
```

This is useful when the store wants to compensate the influencer for
content while also rewarding sales performance.

## 9.2 Input Fields

  Field                   Type              Required Description
  ----------------------- ------------ ------------- ----------------------------------
  Compensation Type       Hybrid                 Yes Hybrid plan
  Fixed Payment           Currency               Yes Guaranteed amount
  Commission Type         Select                 Yes Percentage / Fixed Per Order
  Commission Rate         Percentage     Conditional Example: 8%
  Commission Per Order    Currency       Conditional Fixed commission
  Commission Basis        Select                 Yes Order Subtotal / Net Order Value
  Attribution Window      Select                 Yes 7 / 14 / 30 days
  Eligible Order Status   Select                 Yes Paid / Delivered
  Payout Schedule         Select                 Yes Weekly / Monthly
  Minimum Payout          Currency          Optional Minimum payout threshold

## 9.3 Example

``` text
Plan: Hybrid

Fixed Payment:
₹2,000

Commission:
8%

Attribution Window:
30 Days

Eligible Orders:
Delivered Orders

Deliverables:
1 Reel + 2 Stories
```

Influencer earnings:

``` text
Guaranteed:
₹2,000

+

Sales Commission:
8% of eligible sales
```

------------------------------------------------------------------------

# 10. Plan 5 --- Performance / CPA

## 10.1 Purpose

The influencer is paid based on a measurable result.

Possible performance metrics:

-   Orders
-   Delivered Orders
-   Qualified Leads
-   Signups
-   App Installs

## 10.2 Input Fields

  ------------------------------------------------------------------------
  Field            Type                          Required Description
  ---------------- ---------------- --------------------- ----------------
  Compensation     Performance                        Yes Performance plan
  Type                                                    

  Performance      Select                             Yes Orders / Leads /
  Metric                                                  Installs

  Amount Per       Currency                           Yes Payment per
  Conversion                                              conversion

  Maximum Payout   Currency                      Optional Maximum campaign
                                                          payout

  Minimum          Number                        Optional Minimum required
  Conversions                                             conversions

  Maximum          Number                        Optional Maximum payable
  Conversions                                             conversions

  Eligible         Select                             Yes Paid / Delivered
  Conversion                                              order

  Attribution      Select                             Yes 7 / 14 / 30 days
  Window                                                  

  Payout Schedule  Select                             Yes Weekly / Monthly
  ------------------------------------------------------------------------

## 10.3 Example

``` text
₹150 per delivered order

Minimum:
10 orders

Maximum:
100 orders

Maximum earning:
₹15,000
```

------------------------------------------------------------------------

# 11. Plan 6 --- Negotiable / Custom

## 11.1 Purpose

The store provides a budget range and allows influencers to submit their
own proposal.

Example:

``` text
Store Budget:
₹3,000 – ₹7,000

Influencer:
Submits Proposal

Store:
Accept / Reject / Counter Offer
```

## 11.2 Input Fields

  Field                  Type           Required
  ---------------------- ------------ ----------
  Compensation Type      Negotiable          Yes
  Minimum Budget         Currency            Yes
  Maximum Budget         Currency            Yes
  Allow Counter Offer    Boolean             Yes
  Minimum Offer          Currency       Optional
  Maximum Offer          Currency       Optional
  Negotiation Deadline   Date           Optional

## 11.3 Workflow

``` text
Campaign Published
       ↓
Influencer Applies
       ↓
Influencer Submits Proposal
       ↓
Store Reviews Proposal
       ↓
Accept / Reject / Counter
       ↓
Final Compensation
       ↓
Campaign Assignment
```

------------------------------------------------------------------------

# 12. Influencer Eligibility Requirements

The store should be able to define who can apply.

## Input Fields

  Field                     Type
  ------------------------- --------------
  Minimum Followers         Number
  Maximum Followers         Number
  Minimum Engagement Rate   Percentage
  Creator Category          Multi-select
  Creator Location          Multi-select
  Content Language          Multi-select
  Required Platform         Multi-select
  Audience Location         Multi-select
  Audience Gender           Multi-select
  Application Type          Select

## Application Type

``` text
Open to Everyone
Approval Required
Invite Only
```

## Optional Verification Requirements

``` text
Instagram Connected
YouTube Connected
Phone Verified
KYC Completed
```

------------------------------------------------------------------------

# 13. Product Requirements

This section is useful when the campaign involves a specific product.

## Input Fields

  Field                Type
  -------------------- ------------------
  Product Required     Boolean
  Shopify Product      Product Selector
  Shopify Variant      Variant Selector
  Quantity             Number
  Product Value        Currency
  Product Link         URL
  Shipping Available   Boolean
  COD Available        Boolean

For Shopify stores, product and variant information should preferably be
selected from Shopify rather than entered manually.

------------------------------------------------------------------------

# 14. Campaign Rules

The store can define campaign-specific rules.

## Content Approval

``` text
Content Approval Required
Yes / No

Revision Allowed
Yes / No

Maximum Revisions
1 / 2 / 3
```

## Content Usage Rights

Possible options:

``` text
Organic Social Media
Paid Advertising
Website
Email Marketing
Marketplace
Other
```

## Usage Duration

``` text
30 Days
60 Days
90 Days
Unlimited
```

## Whitelisting

``` text
Whitelisting Required
Yes / No
```

## Exclusivity

``` text
Exclusivity Required
Yes / No

Exclusivity Duration
7 Days
30 Days
60 Days
90 Days
```

## Special Instructions

Textarea for additional requirements.

Example:

``` text
Do not mention competitors.
Show the product clearly.
Mention the store account.
Use the provided campaign hashtag.
Include the shopping CTA.
```

------------------------------------------------------------------------

# 15. Recommended Create Campaign Flow

The Store Admin should not see every field on one large form.

Use a multi-step form.

## Step 1 --- Basic Details

``` text
Campaign Title *
Campaign Brief *
Category *
Campaign Type *
Campaign Objective *
```

## Step 2 --- Deliverables

``` text
Platform *

Reels
Stories
Posts
YouTube
Shorts
UGC

Content Duration
Caption
Hashtags
Brand Mention
Product Tag
CTA
Voiceover
```

## Step 3 --- Compensation

``` text
Compensation Plan *

○ Fixed Pricing
○ Barter
○ Commission
○ Hybrid
○ Performance
○ Negotiable
```

After selecting the plan, show only the relevant fields.

Example:

``` text
Fixed Pricing
    ↓
Payment Per Influencer
Total Budget
Payment Trigger
Payout Timeline
```

or:

``` text
Commission
    ↓
Commission %
Attribution Window
Eligible Order Status
Payout Schedule
```

## Step 4 --- Product

``` text
Product Required
Select Product
Select Variant
Quantity
Shipping
```

This step can be hidden when no product is involved.

## Step 5 --- Influencer Requirements

``` text
Minimum Followers
Engagement Rate
Category
Location
Language
Platform
Audience Location
Application Type
```

## Step 6 --- Timeline & Rules

``` text
Application Deadline
Content Deadline
Campaign End Date

Content Approval
Revision Limit
Usage Rights
Usage Duration
Exclusivity
Special Instructions
```

## Step 7 --- Preview & Publish

Show a complete campaign preview.

Actions:

``` text
Save Draft
Preview
Publish Campaign
Cancel
```

------------------------------------------------------------------------

# 16. Campaign Data Structure

Do not create completely separate campaign database tables for each
compensation plan.

Use one campaign entity with a flexible compensation object.

Conceptually:

``` text
Campaign
│
├── Basic Information
│   ├── title
│   ├── brief
│   ├── category
│   ├── type
│   └── objective
│
├── Deliverables
│   ├── platforms
│   ├── reels
│   ├── stories
│   ├── posts
│   ├── youtube
│   └── ugc
│
├── Compensation
│   ├── type
│   ├── fixedAmount
│   ├── totalBudget
│   ├── commissionRate
│   ├── commissionPerOrder
│   ├── performanceMetric
│   ├── productId
│   ├── productVariantId
│   ├── productValue
│   ├── attributionWindow
│   └── payoutSchedule
│
├── Requirements
│   ├── minFollowers
│   ├── minEngagement
│   ├── categories
│   ├── locations
│   ├── languages
│   └── platforms
│
├── Timeline
│   ├── applicationDeadline
│   ├── contentDeadline
│   └── campaignEndDate
│
└── Rules
    ├── contentApproval
    ├── revisionLimit
    ├── usageRights
    ├── usageDuration
    ├── whitelisting
    ├── exclusivity
    └── instructions
```

------------------------------------------------------------------------

# 17. Compensation Type Enum

Recommended backend enum:

``` text
FIXED
BARTER
COMMISSION
HYBRID
PERFORMANCE
NEGOTIABLE
```

------------------------------------------------------------------------

# 18. Conditional Field Logic

The UI should dynamically display fields based on the selected
compensation plan.

### FIXED

Show:

``` text
Payment Per Influencer
Total Campaign Budget
Number of Influencers
Payment Trigger
Payout Timeline
```

### BARTER

Show:

``` text
Product
Variant
Quantity
Product Value
Shipping
Product Ownership
Return Details
```

### COMMISSION

Show:

``` text
Commission Type
Commission Rate / Per Order Amount
Commission Basis
Attribution Window
Eligible Order Status
Minimum Payout
Payout Schedule
```

### HYBRID

Show:

``` text
Fixed Payment
Commission Type
Commission Rate / Per Order Amount
Commission Basis
Attribution Window
Eligible Order Status
Payout Schedule
```

### PERFORMANCE

Show:

``` text
Performance Metric
Amount Per Conversion
Maximum Payout
Minimum Conversions
Maximum Conversions
Eligible Conversion
Attribution Window
Payout Schedule
```

### NEGOTIABLE

Show:

``` text
Minimum Budget
Maximum Budget
Allow Counter Offer
Minimum Offer
Maximum Offer
Negotiation Deadline
```

------------------------------------------------------------------------

# 19. Recommended MVP Scope

For the first production version, implement:

## Required

-   Campaign Basic Details
-   Content Deliverables
-   Fixed Pricing
-   Barter
-   Commission
-   Hybrid
-   Product Selection
-   Influencer Eligibility
-   Campaign Timeline
-   Campaign Rules
-   Save Draft
-   Preview
-   Publish

## Phase 2

-   Performance / CPA
-   Negotiable Offers
-   Counter Offers
-   Advanced audience targeting
-   Whitelisting
-   Advanced usage rights
-   Advanced campaign analytics

------------------------------------------------------------------------

# 20. Complete Campaign Lifecycle

The final store-side flow should be:

``` text
Create Campaign
       ↓
Save Draft
       ↓
Preview
       ↓
Publish
       ↓
Influencers Discover Campaign
       ↓
Influencers Apply
       ↓
Store Reviews Applications
       ↓
Approve Influencer
       ↓
Assign Deliverables / Product
       ↓
Influencer Creates Content
       ↓
Content Submitted
       ↓
Store Approval
       ↓
Campaign Goes Live
       ↓
Referral / Sales Tracking
       ↓
Commission Calculation
       ↓
Payout
       ↓
Campaign Completed
```

For barter campaigns, the product fulfillment flow should be connected
between:

``` text
Influencer Approved
       ↓
Product / Variant Assigned
       ↓
Order / Fulfillment
       ↓
Influencer Receives Product
       ↓
Content Creation
```

For commission campaigns:

``` text
Influencer Approved
       ↓
Referral Link / Code
       ↓
Customer Visit
       ↓
Shopify Order
       ↓
Attribution
       ↓
Eligible Order
       ↓
Commission
       ↓
Payout
```

------------------------------------------------------------------------

# 21. Recommended Final Store Campaign Form

The store owner should ultimately see:

``` text
CREATE CAMPAIGN

1. Basic Details
   ├── Campaign Title
   ├── Campaign Brief
   ├── Category
   ├── Campaign Type
   └── Objective

2. Content Deliverables
   ├── Platform
   ├── Reels
   ├── Stories
   ├── Posts
   ├── YouTube
   ├── UGC
   └── Content Requirements

3. Compensation
   ├── Fixed Pricing
   ├── Barter
   ├── Commission
   ├── Hybrid
   ├── Performance
   └── Negotiable

4. Product
   ├── Product
   ├── Variant
   ├── Quantity
   └── Shipping

5. Influencer Requirements
   ├── Followers
   ├── Engagement
   ├── Category
   ├── Location
   ├── Language
   └── Platform

6. Timeline
   ├── Application Deadline
   ├── Content Deadline
   └── Campaign End Date

7. Campaign Rules
   ├── Approval
   ├── Revisions
   ├── Usage Rights
   ├── Whitelisting
   ├── Exclusivity
   └── Instructions

8. Preview & Publish
   ├── Save Draft
   ├── Preview
   └── Publish
```

This structure keeps the **Store Side campaign creation** flexible while
allowing the same campaign to later connect with the **Influencer Side,
referral/attribution system, Shopify orders, commission calculation, and
payout system**.
