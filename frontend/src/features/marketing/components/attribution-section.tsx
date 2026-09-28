import { Webhook } from "lucide-react";
import { Pill } from "./pill";
import { SectionTitle } from "./section-title";

const heights = [34, 54, 42, 72, 58, 90, 76, 96, 84, 65, 78, 100];
const webhookEvents = [
  "order.created · #SH-10482",
  "attribution.resolved · @ananya.curates",
  "commission.calculated · ₹189.90",
  "balance.updated · creator wallet",
];

export function AttributionSection() {
  return (
    <section id="attribution" className="scroll-mt-24 px-5 py-20 sm:px-8 md:py-24">
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
              {heights.map((value, index) => (
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
              {webhookEvents.map((event) => (
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
  );
}
