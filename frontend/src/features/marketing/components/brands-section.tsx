import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Pill } from "./pill";
import { SectionTitle } from "./section-title";

const checklist = [
  "Creator relationship management",
  "Campaign creation and assignments",
  "Products and catalogue visibility",
  "Attribution and commission controls",
  "Order and payout reporting",
];

const dashboardStats = [
  ["Active creators", "24"],
  ["Campaigns", "08"],
  ["Attributed orders", "186"],
  ["Commission due", "₹34,280"],
];

const topCreators = ["@ananya.curates", "@neel.styles", "@riya.cooks"];

export function BrandsSection() {
  return (
    <section
      id="brands"
      className="scroll-mt-24 border-y border-[#e6e6ef] bg-[#f6f2f7] px-5 py-20 sm:px-8 md:py-24"
    >
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionTitle
            eyebrow="Brand operating system"
            title="Manage creators, campaigns and commerce without the busywork."
            copy="Move from campaign planning to product assignment, creator activity and order-level performance with a single source of truth."
          />
          <ul className="mt-8 space-y-4">
            {checklist.map((item) => (
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
            {dashboardStats.map(([label, value]) => (
              <div key={label} className="rounded-xl bg-[#f6f2f7] p-4">
                <p className="text-xs text-[#787586]">{label}</p>
                <b className="mt-2 block text-xl">{value}</b>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#e6e6ef] p-4">
              <b className="text-sm">Top creators</b>
              {topCreators.map((name, index) => (
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
  );
}
