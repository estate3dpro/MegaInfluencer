import { SectionTitle } from "./section-title";

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

export function HowItWorksSection() {
  return (
    <section
      id="architecture"
      className="scroll-mt-24 border-y border-[#e6e6ef] bg-[#f6f2f7] px-5 py-20 sm:px-8 md:py-24"
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
  );
}
