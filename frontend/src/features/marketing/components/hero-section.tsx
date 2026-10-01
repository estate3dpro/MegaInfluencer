import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Copy, Instagram } from "lucide-react";
import { Pill } from "./pill";

const creatorPhoto = "/images/creator-portrait.png";
const serumPhoto = "/images/botanical-serum.png";

export function HeroSection() {
  return (
    <section id="top" className="scroll-mt-24 overflow-hidden px-5 pb-20 pt-12 sm:px-8 md:pb-28 md:pt-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <Pill tone="green">
            <span className="font-normal text-[#474554]">Real-Time affiliate attribution</span>
          </Pill>
          <h1 className="max-w-4xl font-display text-4xl font-bold leading-[1.08] tracking-[-.04em] sm:text-5xl md:text-6xl">
            Turn creator influence into measurable revenue{" "}
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
              <span className="text-[#787586]">Catalog & order sync</span>
            </div>
            <div>
              <b className="flex items-center text-lg text-[#a53361]">
                Instagram <Instagram className="ml-1 h-4 w-4" />
              </b>
              <span className="text-[#787586]">Auto-DM link delivery</span>
            </div>
            <div>
              <b className="text-lg text-[#00655a]">100%</b>
              <span className="block text-[#787586]">Accurate attribution</span>
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
          <div className="absolute -bottom-7 -left-3 w-72 rounded-xl border border-[#e6e6ef] bg-white p-3.5 shadow-[0_16px_32px_rgba(24,24,27,.12)] sm:-left-10">
            <div className="flex items-center gap-3">
              <img
                src={serumPhoto}
                alt="Botanical renewal serum"
                className="h-12 w-12 rounded-lg object-cover border border-[#e6e6ef]"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-[#787586]">Live product referral</p>
                <div className="flex items-center justify-between gap-1">
                  <b className="truncate text-xs font-semibold">Botanical renewal serum</b>
                  <span className="shrink-0 text-xs font-bold text-[#00655a]">₹1,899</span>
                </div>
                <p className="mt-0.5 text-[11px] text-[#5341cd]">
                  mi.shop/ananya/serum <Copy className="inline h-2.5 w-2.5" />
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
