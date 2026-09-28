import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  Copy,
  Instagram,
  MessageCircle,
  Package,
  ShoppingBag,
  Store,
  Webhook,
} from "lucide-react";

const creatorPhoto =
  "https://lh3.googleusercontent.com/aida/AEtjO1Wq9uc_AOlf-2hZuB55LOah2l1s8iiNmpR0nqVDrxurastrFmlhkswEQgNaNncSPceX_T8vJMIaJKWcFGzwhRA3eoLcuThwP1_YOZYd5BWrcK1aq5cBhRFeTVsh8h3r0nMvq7FNcTFBd1JQVf7DylwVKOyynuqboCc5ny51PkM6gswL6OwdjXz-qqVL9r0kI0Z4wP7n3uTB-CMpAwcEeXIj1UVRukeVax6YVYERhsr_Y8knahDwvO1IGDeE";
const nav = [
  ["Platform", "#architecture"],
  ["Integrations", "#integrations"],
  ["Roadmap", "#roadmap"],
];
const flow = [
  [
    "01",
    "Connect your account",
    "Creators authorise Instagram securely. Stores connect their Shopify catalogue.",
  ],
  [
    "02",
    "Build your catalogue",
    "Products, availability and collections sync into creator-ready storefronts.",
  ],
  [
    "03",
    "Share tracked links",
    "Every storefront click and direct message link carries referral context.",
  ],
  [
    "04",
    "Drive engagement",
    "Instagram comment triggers can send approved product links in a direct message.",
  ],
  [
    "05",
    "Reconcile orders",
    "Shopify order webhooks connect a completed order to its creator referral.",
  ],
  [
    "06",
    "Pay with confidence",
    "Commission balances and payout-ready reporting stay visible for everyone.",
  ],
];
const roadmap = [
  [
    "Live",
    "Shopify product & order sync",
    "Catalogue, inventory and order webhooks connected to creator commerce.",
  ],
  [
    "Live",
    "Instagram OAuth & automation",
    "Connect Instagram and automate approved comment-to-DM journeys.",
  ],
  [
    "Live",
    "Commission tracking",
    "Track referred sales and commission balances in creator and brand dashboards.",
  ],
  [
    "In development",
    "WooCommerce sync",
    "Extend connected catalogues and referral attribution to more storefronts.",
  ],
  [
    "Roadmap",
    "Payout provider connections",
    "Streamline final payout workflows with supported payment partners.",
  ],
  [
    "Research",
    "Public creator discovery",
    "Help brands discover relevant creators and creators apply to opportunities.",
  ],
];
const features = [
  [
    "For creators & influencers",
    "Monetize audience questions automatically.",
    "Turn “Where did you get that?” comments into trackable affiliate referrals without manual DM fatigue.",
    [
      "Connect Instagram through secure OAuth",
      "Send direct affiliate links using keyword triggers",
      "Share a curated storefront in your bio",
      "See commissions and balances clearly",
    ],
    "/register",
    "Get started as creator",
  ],
  [
    "For brands & Shopify stores",
    "Track creator sales with real webhook data.",
    "Replace promo-code guesswork with direct affiliate referral attribution and automated product sync.",
    [
      "Sync product catalogues and inventory",
      "Reconcile Shopify orders in real time",
      "Set campaign and creator commission rules",
      "Review payout and referral audit trails",
    ],
    "/store/register",
    "Connect Shopify store",
  ],
] as const;

function SectionTitle({
  eyebrow,
  title,
  copy,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  copy?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="text-xs font-bold uppercase tracking-[.16em] text-[#5341cd]">{eyebrow}</p>
      <h2 className="mt-4 font-display text-3xl font-bold tracking-[-.03em] text-[#1b1b1e] sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {copy ? <p className="mt-5 text-base leading-7 text-[#474554]">{copy}</p> : null}
    </div>
  );
}

function Pill({
  children,
  tone = "violet",
}: {
  children: React.ReactNode;
  tone?: "violet" | "green" | "pink";
}) {
  const styles = {
    violet: "border-[#5341cd]/20 bg-[#5341cd]/10 text-[#5341cd]",
    green: "border-[#00655a]/20 bg-[#00655a]/10 text-[#00655a]",
    pink: "border-[#a53361]/20 bg-[#a53361]/10 text-[#a53361]",
  };
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${styles[tone]}`}
    >
      <i className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function LandingPage() {
  return (
    <main className="bg-[#fbf8fc] font-sans text-[#1b1b1e]">
      <header className="sticky top-0 z-50 border-b border-[#c8c4d7]/60 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
          <a
            href="#top"
            className="flex shrink-0 items-center gap-2.5 font-display text-lg font-bold tracking-tight"
          >
            <img src="/logo/MI_Logo.svg" alt="" className="h-9 w-9" />
            MegaInfluencer
            <span className="hidden rounded-full border border-[#c8c4d7]/60 bg-[#f0edf1] px-2.5 py-0.5 text-[11px] font-medium text-[#474554] sm:inline">
              Creator Commerce
            </span>
          </a>
          <nav className="hidden rounded-full border border-[#c8c4d7]/50 bg-[#f6f2f7] p-1.5 md:flex">
            {nav.map(([name, href], index) => (
              <a
                key={href}
                href={href}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${index === 0 ? "bg-white text-[#1b1b1e] shadow-sm" : "text-[#474554] hover:text-[#1b1b1e]"}`}
              >
                {name}
                {name === "Roadmap" ? (
                  <i className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-[#5341cd]" />
                ) : null}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-4">
            <Pill tone="green">Shopify & IG active</Pill>
            <Link
              to="/login"
              className="hidden text-sm font-semibold text-[#474554] hover:text-[#1b1b1e] sm:block"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center rounded-xl bg-[#5341cd] px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4029ba] sm:px-5"
            >
              Launch app <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <section id="top" className="overflow-hidden px-5 pb-20 pt-12 sm:px-8 md:pb-28 md:pt-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <Pill tone="green">
              Shopify webhook engine{" "}
              <span className="font-normal text-[#474554]">/ real-time affiliate attribution</span>
            </Pill>
            <h1 className="max-w-4xl font-display text-4xl font-bold leading-[1.08] tracking-[-.04em] sm:text-5xl md:text-6xl">
              Creator commerce and affiliate operations{" "}
              <span className="underline decoration-[#a53361] decoration-4 underline-offset-8">
                built for real brands.
              </span>
            </h1>
            <p className="max-w-xl text-lg leading-8 text-[#474554]">
              Connect with influencers, track referred sales, automate Instagram engagement, and
              manage commissions with Shopify-connected product and order tracking.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center rounded-xl bg-[#5341cd] px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#4029ba]"
              >
                Start as creator <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                to="/store/register"
                className="inline-flex items-center rounded-xl border border-[#c8c4d7] bg-white px-6 py-3.5 text-sm font-semibold hover:bg-[#f0edf1]"
              >
                For brands & stores
              </Link>
            </div>
            <div className="grid max-w-xl grid-cols-3 gap-5 border-t border-[#e6e6ef] pt-6 text-sm">
              <div>
                <b className="flex items-center text-lg">
                  Shopify <CheckCircle2 className="ml-1 h-4 w-4 text-[#00655a]" />
                </b>
                <span className="text-[#787586]">Product & order sync</span>
              </div>
              <div>
                <b className="flex items-center text-lg text-[#a53361]">
                  Instagram <Instagram className="ml-1 h-4 w-4" />
                </b>
                <span className="text-[#787586]">OAuth & auto-DM webhooks</span>
              </div>
              <div>
                <b className="text-lg text-[#00655a]">100%</b>
                <span className="block text-[#787586]">Webhook reconciled</span>
              </div>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none">
            <div className="rounded-xl border border-[#e6e6ef] bg-white p-2 shadow-[0_16px_32px_rgba(24,24,27,.08)]">
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
                <img
                  src={creatorPhoto}
                  alt="Creator portrait in studio"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 pt-20 text-white">
                  <div className="flex items-center gap-2">
                    <img
                      src={creatorPhoto}
                      alt=""
                      className="h-10 w-10 rounded-full border-2 border-white object-cover"
                    />
                    <div>
                      <b className="text-sm">@ananya.curates</b>
                      <p className="text-xs text-white/80">
                        Beauty & decor creator · Instagram connected
                      </p>
                    </div>
                    <Pill tone="green">Active</Pill>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-7 -left-3 w-64 rounded-xl border border-[#e6e6ef] bg-white p-4 shadow-[0_16px_32px_rgba(24,24,27,.12)] sm:-left-10">
              <p className="text-xs text-[#787586]">Live product referral</p>
              <div className="mt-2 flex items-center justify-between">
                <b className="text-sm">Botanical renewal serum</b>
                <span className="font-bold text-[#00655a]">₹1,899</span>
              </div>
              <p className="mt-2 text-xs text-[#5341cd]">
                mi.shop/ananya/serum <Copy className="inline h-3 w-3" />
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="architecture"
        className="border-y border-[#e6e6ef] bg-[#f6f2f7] px-5 py-20 sm:px-8 md:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="How it works"
            title="A referral flow that stays connected from content to payout."
            copy="MegaInfluencer connects creators, product catalogues, customer intent, and verified orders through a practical creator-commerce workflow."
            align="center"
          />
          <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {flow.map(([number, title, copy]) => (
              <article
                key={number}
                className="rounded-xl border border-[#e6e6ef] bg-white p-6 shadow-[0_4px_12px_rgba(24,24,27,.03)]"
              >
                <span className="text-xs font-bold text-[#5341cd]">{number}</span>
                <h3 className="mt-6 text-lg font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#474554]">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="storefront" className="px-5 py-20 sm:px-8 md:py-24">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Creator storefronts"
            title="A storefront that makes recommendations shoppable."
            copy="Curate products for your audience and keep each recommendation connected to the creator and product referral."
          />
          <div className="mt-12 overflow-hidden rounded-2xl border border-[#e6e6ef] bg-white shadow-[0_12px_28px_rgba(24,24,27,.05)]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e6e6ef] p-5">
              <div className="flex items-center gap-3">
                <img src={creatorPhoto} alt="" className="h-12 w-12 rounded-full object-cover" />
                <div>
                  <b>@ananya.curates</b>
                  <p className="text-sm text-[#787586]">Edited beauty, home and wardrobe finds</p>
                </div>
              </div>
              <Pill tone="pink">Creator storefront</Pill>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              {["Botanical renewal serum", "Ribbed vessel lamp", "Terracotta linen overshirt"].map(
                (name, index) => (
                  <div key={name} className="group rounded-xl border border-[#e6e6ef] p-3">
                    <div
                      className={`aspect-square rounded-lg bg-gradient-to-br ${["from-rose-100 to-amber-50", "from-stone-200 to-orange-100", "from-orange-200 to-rose-100"][index]}`}
                    />
                    <h3 className="mt-3 font-semibold">{name}</h3>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm text-[#787586]">Curated by Ananya</span>
                      <b>{["₹1,899", "₹3,499", "₹2,299"][index]}</b>
                    </div>
                    <div className="mt-3 border-t border-[#e6e6ef] pt-3 text-xs text-[#5341cd]">
                      Referral tracked · Creator commission eligible
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      <section
        id="instagram-flow"
        className="border-y border-[#e6e6ef] bg-[#f6f2f7] px-5 py-20 sm:px-8 md:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Instagram automation"
            title="Turn a comment into a relevant shopping journey."
            copy="Use secure Instagram connections and configurable triggers to deliver appropriate product links directly to interested people."
            align="center"
          />
          <div className="mt-14 grid gap-3 md:grid-cols-5">
            {[
              ["Reel post", "Creator shares a product recommendation."],
              ["Comment trigger", "A follower asks where to find it."],
              ["Automated DM", "A matching referral link is delivered."],
              ["Shopify checkout", "The customer completes an order."],
              ["Commission", "The referred order is reconciled."],
            ].map(([title, copy], index) => (
              <div key={title} className="relative rounded-xl border border-[#e6e6ef] bg-white p-5">
                <span className="text-xs font-bold text-[#a53361]">0{index + 1}</span>
                <h3 className="mt-6 font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#474554]">{copy}</p>
                {index < 4 ? (
                  <ArrowRight className="absolute -right-5 top-1/2 z-10 hidden h-7 w-7 rounded-full border border-[#e6e6ef] bg-white p-1 text-[#5341cd] md:block" />
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4 rounded-xl border border-[#c8c4d7] bg-white p-4 text-sm">
            <Instagram className="text-[#a53361]" />
            <span>
              <b>@ananya.curates</b> received “Where is this from?”
            </span>
            <ArrowRight className="text-[#5341cd]" />
            <MessageCircle className="text-[#5341cd]" />
            <span>Automated DM: “Here’s the serum I used.”</span>
          </div>
        </div>
      </section>

      <section id="attribution" className="px-5 py-20 sm:px-8 md:py-24">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Attribution intelligence"
            title="See creator performance in verified commerce context."
            copy="Product, order, affiliate and commission records sit together so each team can understand what drove a sale."
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-5">
            <div className="rounded-2xl border border-[#e6e6ef] bg-white p-6 lg:col-span-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">Revenue timeline</h3>
                <Pill tone="green">Demo data</Pill>
              </div>
              <div className="mt-8 flex h-52 items-end gap-2 border-b border-[#e6e6ef] pb-4">
                {[34, 54, 42, 72, 58, 90, 76, 96, 84, 65, 78, 100].map((value, index) => (
                  <div
                    key={index}
                    className="flex-1 rounded-t bg-gradient-to-t from-[#5341cd] to-[#c6bfff]"
                    style={{ height: `${value}%` }}
                  />
                ))}
              </div>
              <div className="mt-4 flex justify-between text-xs text-[#787586]">
                <span>Creator referrals</span>
                <span>Verified orders</span>
                <span>Commission eligible</span>
              </div>
            </div>
            <div className="rounded-2xl border border-[#e6e6ef] bg-[#1b1b1e] p-6 text-white lg:col-span-2">
              <div className="flex items-center gap-2">
                <Webhook className="h-4 w-4 text-[#54dbc8]" />
                <b className="text-sm">Referral webhook log</b>
              </div>
              <div className="mt-6 space-y-4 font-mono text-xs text-white/70">
                {[
                  "order.created · #SH-10482",
                  "attribution.resolved · @ananya.curates",
                  "commission.calculated · ₹189.90",
                  "balance.updated · creator wallet",
                ].map((event) => (
                  <p key={event}>
                    <i className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#54dbc8]" />
                    {event}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="brands"
        className="border-y border-[#e6e6ef] bg-[#f6f2f7] px-5 py-20 sm:px-8 md:py-24"
      >
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionTitle
              eyebrow="Brand operating system"
              title="Manage creators, campaigns and commerce without the busywork."
              copy="Move from campaign planning to product assignment, creator activity and order-level performance with a single source of truth."
            />
            <ul className="mt-8 space-y-4">
              {[
                "Creator relationship management",
                "Campaign creation and assignments",
                "Products and catalogue visibility",
                "Attribution and commission controls",
                "Order and payout reporting",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-medium">
                  <CheckCircle2 className="h-5 w-5 text-[#00655a]" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/store/register"
              className="mt-9 inline-flex items-center rounded-xl bg-[#1b1b1e] px-6 py-3.5 text-sm font-semibold text-white"
            >
              Connect your store <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-2xl border border-[#e6e6ef] bg-white p-5 shadow-[0_12px_28px_rgba(24,24,27,.05)] lg:col-span-7">
            <div className="flex items-center justify-between border-b border-[#e6e6ef] pb-4">
              <div>
                <b>Merchant dashboard</b>
                <p className="text-sm text-[#787586]">Campaign and referral overview</p>
              </div>
              <Pill tone="green">Live view</Pill>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Active creators", "24"],
                ["Campaigns", "08"],
                ["Attributed orders", "186"],
                ["Commission due", "₹34,280"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-[#f6f2f7] p-4">
                  <p className="text-xs text-[#787586]">{label}</p>
                  <b className="mt-2 block text-xl">{value}</b>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[#e6e6ef] p-4">
                <b className="text-sm">Top creators</b>
                {["@ananya.curates", "@neel.styles", "@riya.cooks"].map((name, index) => (
                  <div key={name} className="mt-4 flex items-center justify-between text-sm">
                    <span>{name}</span>
                    <span className="font-semibold text-[#00655a]">
                      ₹{(42 - index * 7).toString()}K sales
                    </span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-[#e6e6ef] p-4">
                <b className="text-sm">Active campaign</b>
                <p className="mt-4 font-semibold">Monsoon launch collection</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e4e1e6]">
                  <div className="h-full w-2/3 bg-[#5341cd]" />
                </div>
                <p className="mt-2 text-xs text-[#787586]">16 of 24 creator assignments active</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="integrations" className="px-5 py-20 sm:px-8 md:py-24">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Ecosystem status"
            title="Build on connected commerce infrastructure."
            align="center"
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Shopify", "Live", "Product catalogues, inventory and order webhooks", Store],
              [
                "Instagram",
                "Live",
                "OAuth, inbox workflows and direct message automation",
                Instagram,
              ],
              [
                "WooCommerce",
                "In development",
                "Additional catalogue and referral integration",
                Package,
              ],
              [
                "Payout providers",
                "Roadmap",
                "Future settlement and payout connections",
                CircleDollarSign,
              ],
            ].map(([name, status, copy, Icon]) => {
              const Component = Icon as typeof Store;
              return (
                <div
                  key={name as string}
                  className="rounded-xl border border-[#e6e6ef] bg-white p-6"
                >
                  <Component className="h-8 w-8 text-[#5341cd]" />
                  <div className="mt-6 flex items-center justify-between">
                    <h3 className="font-bold">{name as string}</h3>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${status === "Live" ? "bg-[#00655a]/10 text-[#00655a]" : "bg-[#f0edf1] text-[#787586]"}`}
                    >
                      {status as string}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#474554]">{copy as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="roadmap"
        className="border-y border-[#e6e6ef] bg-[#f6f2f7] px-5 py-20 sm:px-8 md:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Roadmap"
            title="Clear about what is live, next, and being explored."
            copy="We distinguish operating product capabilities from integrations and workflows currently being developed."
            align="center"
          />
          <div className="mt-12 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {roadmap.map(([status, title, copy]) => (
              <article key={title} className="rounded-xl border border-[#e6e6ef] bg-white p-6">
                <span
                  className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${status === "Live" ? "bg-[#00655a]/10 text-[#00655a]" : status === "In development" ? "bg-[#5341cd]/10 text-[#5341cd]" : "bg-[#f0edf1] text-[#787586]"}`}
                >
                  {status}
                </span>
                <h3 className="mt-5 font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#474554]">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          {features.map(([eyebrow, title, copy, list, href, action], index) => (
            <article
              key={eyebrow}
              className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[#e6e6ef] bg-white p-8 shadow-[0_8px_20px_rgba(24,24,27,.03)] md:p-11"
            >
              <div>
                <span
                  className={`inline-flex rounded-xl p-3 ${index === 0 ? "bg-[#a53361]/10 text-[#a53361]" : "bg-[#00655a]/10 text-[#00655a]"}`}
                >
                  {index === 0 ? <Instagram /> : <ShoppingBag />}
                </span>
                <p
                  className={`mt-7 text-xs font-bold uppercase tracking-[.16em] ${index === 0 ? "text-[#a53361]" : "text-[#00655a]"}`}
                >
                  {eyebrow}
                </p>
                <h2 className="mt-4 font-display text-3xl font-bold tracking-tight">{title}</h2>
                <p className="mt-5 text-lg leading-8 text-[#474554]">{copy}</p>
                <ul className="mt-7 space-y-3">
                  {list.map((item) => (
                    <li key={item} className="flex gap-3 text-sm">
                      <CheckCircle2
                        className={`h-5 w-5 shrink-0 ${index === 0 ? "text-[#a53361]" : "text-[#00655a]"}`}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                to={href}
                className={`mt-10 inline-flex w-fit items-center rounded-xl px-6 py-3.5 text-sm font-semibold ${index === 0 ? "bg-[#5341cd] text-white" : "bg-[#1b1b1e] text-white"}`}
              >
                {action}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-[#e6e6ef] bg-[#f0edf1] px-5 py-20 text-center sm:px-8 md:py-24">
        <div className="mx-auto max-w-3xl">
          <Pill tone="green">Shopify & Instagram affiliate infrastructure</Pill>
          <h2 className="mt-6 font-display text-4xl font-bold tracking-[-.03em] sm:text-5xl">
            Build a high-performance creator affiliate program.
          </h2>
          <p className="mt-6 text-lg leading-8 text-[#474554]">
            Connect your Shopify catalogue, automate Instagram referral delivery, and track real
            sales with verified webhook attribution.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center rounded-xl bg-[#5341cd] px-6 py-3.5 text-sm font-semibold text-white"
            >
              Connect creator account <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              to="/store/register"
              className="inline-flex items-center rounded-xl border border-[#c8c4d7] bg-white px-6 py-3.5 text-sm font-semibold"
            >
              Install on Shopify
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#e6e6ef] px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 border-b border-[#e6e6ef] pb-10 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 font-display text-lg font-bold">
                <img src="/logo/MI_Logo.svg" alt="" className="h-8 w-8" />
                MegaInfluencer
              </div>
              <p className="mt-4 max-w-sm text-sm leading-6 text-[#474554]">
                Creator commerce and affiliate operations connecting influencers, Shopify
                storefronts, and automated Instagram engagement.
              </p>
              <div className="mt-5 flex gap-3 text-sm font-semibold text-[#5341cd]">
                <a href="#top">X.com</a>
                <a href="#instagram-flow">Instagram</a>
                <a href="#brands">LinkedIn</a>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider">Platform</h3>
              <div className="mt-4 grid gap-3 text-sm text-[#474554]">
                <a href="#architecture">How it works</a>
                <a href="#instagram-flow">Instagram automation</a>
                <a href="#attribution">Webhook attribution</a>
                <a href="#roadmap">Roadmap</a>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider">Access</h3>
              <div className="mt-4 grid gap-3 text-sm text-[#474554]">
                <Link to="/register">Creator registration</Link>
                <Link to="/login">Creator login</Link>
                <Link to="/store/register">Brand registration</Link>
                <Link to="/store/login">Brand login</Link>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider">Support</h3>
              <div className="mt-4 grid gap-3 text-sm text-[#474554]">
                <Link to="/contact">Contact MegaInfluencer</Link>
                <a href="#integrations">Integration status</a>
                <a href="#roadmap">Product roadmap</a>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-4 pt-8 text-sm text-[#787586] sm:flex-row">
            <span>© 2026 MegaInfluencer. Creator commerce & affiliate operations.</span>
            <span className="flex items-center gap-2">
              <i className="h-2 w-2 rounded-full bg-[#00655a]" />
              Shopify & Instagram API webhooks operational
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
