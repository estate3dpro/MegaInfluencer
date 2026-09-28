import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Instagram, ShoppingBag } from "lucide-react";

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

export function FeaturesSection() {
  return (
    <section className="px-5 py-20 sm:px-8 md:py-24">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
        {features.map(([eyebrow, title, copy, list, href, action], index) => (
          <article
            key={eyebrow}
            className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[#e6e6ef] bg-white p-8 shadow-[0_8px_20px_rgba(24,24,27,.03)] md:p-11"
          >
            <div>
              <span
                className={`inline-flex rounded-xl p-3 ${
                  index === 0 ? "bg-[#a53361]/10 text-[#a53361]" : "bg-[#00655a]/10 text-[#00655a]"
                }`}
              >
                {index === 0 ? <Instagram /> : <ShoppingBag />}
              </span>
              <p
                className={`mt-7 text-xs font-bold uppercase tracking-[.16em] ${
                  index === 0 ? "text-[#a53361]" : "text-[#00655a]"
                }`}
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
              className={`mt-10 inline-flex w-fit items-center rounded-xl px-6 py-3.5 text-sm font-semibold ${
                index === 0 ? "bg-[#5341cd] text-white" : "bg-[#1b1b1e] text-white"
              }`}
            >
              {action}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
