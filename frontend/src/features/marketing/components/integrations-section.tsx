import { CircleDollarSign, Instagram, Package, Store } from "lucide-react";
import { SectionTitle } from "./section-title";

const integrations = [
  {
    name: "Shopify",
    status: "Live",
    copy: "Product catalogues, inventory and order webhooks",
    Icon: Store,
  },
  {
    name: "Instagram",
    status: "Live",
    copy: "OAuth, inbox workflows and direct message automation",
    Icon: Instagram,
  },
  {
    name: "WooCommerce",
    status: "Coming soon",
    copy: "Additional catalogue and referral integration",
    Icon: Package,
  },
  {
    name: "Payout providers",
    status: "Coming soon",
    copy: "Future settlement and payout connections",
    Icon: CircleDollarSign,
  },
];

export function IntegrationsSection() {
  return (
    <section id="integrations" className="scroll-mt-24 px-5 py-20 sm:px-8 md:py-24">
      <div className="mx-auto max-w-7xl">
        <SectionTitle
          eyebrow="Ecosystem status"
          title="Build on connected commerce infrastructure."
          align="center"
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {integrations.map(({ name, status, copy, Icon }) => (
            <div key={name} className="rounded-xl border border-[#e6e6ef] bg-white p-6">
              <Icon className="h-8 w-8 text-[#5341cd]" />
              <div className="mt-6 flex items-center justify-between">
                <h3 className="font-bold">{name}</h3>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                    status === "Live" ? "bg-[#00655a]/10 text-[#00655a]" : "bg-[#f0edf1] text-[#787586]"
                  }`}
                >
                  {status}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#474554]">{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
