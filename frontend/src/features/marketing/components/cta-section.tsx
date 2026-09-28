import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Pill } from "./pill";

export function CtaSection() {
  return (
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
  );
}
