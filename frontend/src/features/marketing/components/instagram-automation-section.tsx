import { ArrowRight, Instagram, MessageCircle } from "lucide-react";
import { SectionTitle } from "./section-title";

const steps = [
  ["Reel post", "Creator shares a product recommendation."],
  ["Comment trigger", "A follower asks where to find it."],
  ["Automated DM", "A matching referral link is delivered."],
  ["Shopify checkout", "The customer completes an order."],
  ["Commission", "The referred order is reconciled."],
];

export function InstagramAutomationSection() {
  return (
    <section
      id="instagram-flow"
      className="scroll-mt-24 border-y border-[#e6e6ef] bg-[#f6f2f7] px-5 py-20 sm:px-8 md:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <SectionTitle
          eyebrow="Instagram automation"
          title="Turn a comment into a relevant shopping journey."
          copy="Use secure Instagram connections and configurable triggers to deliver appropriate product links directly to interested people."
          align="center"
        />
        <div className="mt-14 grid gap-3 md:grid-cols-5">
          {steps.map(([title, copy], index) => (
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
  );
}
