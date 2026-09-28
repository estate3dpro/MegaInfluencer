import { SectionTitle } from "./section-title";

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

export function RoadmapSection() {
  return (
    <section
      id="roadmap"
      className="scroll-mt-24 border-y border-[#e6e6ef] bg-[#f6f2f7] px-5 py-20 sm:px-8 md:py-24"
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
                className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${
                  status === "Live"
                    ? "bg-[#00655a]/10 text-[#00655a]"
                    : status === "In development"
                      ? "bg-[#5341cd]/10 text-[#5341cd]"
                      : "bg-[#f0edf1] text-[#787586]"
                }`}
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
  );
}
