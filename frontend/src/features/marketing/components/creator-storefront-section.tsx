import { ArrowRight, CheckCircle2, ShoppingBag } from "lucide-react";
import { Pill } from "./pill";
import { SectionTitle } from "./section-title";

const creatorPhoto =
  "https://lh3.googleusercontent.com/aida/AEtjO1Wq9uc_AOlf-2hZuB55LOah2l1s8iiNmpR0nqVDrxurastrFmlhkswEQgNaNncSPceX_T8vJMIaJKWcFGzwhRA3eoLcuThwP1_YOZYd5BWrcK1aq5cBhRFeTVsh8h3r0nMvq7FNcTFBd1JQVf7DylwVKOyynuqboCc5ny51PkM6gswL6OwdjXz-qqVL9r0kI0Z4wP7n3uTB-CMpAwcEeXIj1UVRukeVax6YVYERhsr_Y8knahDwvO1IGDeE";

const storefrontProducts = [
  {
    name: "Artisan pour-over kettle set",
    brand: "Ceramic Studio",
    price: "₹3,499",
    tag: "Kitchen & Living",
    commission: "12% commission",
    image:
      "https://lh3.googleusercontent.com/aida/AEtjO1UKVEmyMg9mc_MruZURy-ABLqgPF4j1LmzronKrhy_X44s7_0bE61EKi0iKZiuld48ZpLJD9TPTm2Y2e-HrR-GktOedE2rcO_j1SyDj1HSjz3zeN7j5uCI5VdmRqz-EmCZC3jlE5swKmFStMeVQ5RUB1tLpItr7T9fXIKF_mg0wYIugQojsteY22YnUXJWuC0AAa2J9irX_bbsaOR5UpBEq2aNdAUze1fF9iWEnzHREdb-7bngKg0RvEQ8=s1600",
  },
  {
    name: "Botanical renewal serum & mist",
    brand: "Amara Clean Beauty",
    price: "₹1,899",
    tag: "Skincare",
    commission: "15% commission",
    image:
      "https://lh3.googleusercontent.com/aida/AEtjO1WEyuoY6WNsF7Pg96LlxpI2e0oHLOfgpDLk5mEmVldjRtL_1Rp5geRUvb9Nud6il3jUN6f2T9yVC1E6sZqYLKyyYNshTIqa0Z1CXWVLO2tufB9fb11_jNgx68TtR3F29uLhP_L3BX6FYnG8XpOT40spPPJS9wFnibUZmHJCG-AyeGI_qztdHpP7s1wiXDGFvuO2DZpnabNmJmqAoJjuQnoiZTZMFbnoVm989OsOREpJy5rLIQWoa7w5ohWP=s1600",
  },
  {
    name: "Vegetable-tanned leather cardholder",
    brand: "Crafted Goods",
    price: "₹2,299",
    tag: "Accessories",
    commission: "10% commission",
    image:
      "https://lh3.googleusercontent.com/aida/AEtjO1Xdu_FCnU2N_AUxzDssuFxtSLCm2rYcva0Sdak3oHRybpP8QKUnfokEEtT6LvbGit2qiqK9xshBal5FHDjIXAxaIwk9zfDhUCBdG2AVt1tzTEKA8xU1m4r52zsEeKsi0f1R5_spc0gcfySPAMiLTAYTsBxdEU3sHwv2n1FHFHMfq6--VLVTjskw2aB2nSAmduvHtQlg5hLCENetzzhvElYS-_lzBMtuvx_iLP___AnN5m3KxM2EEzmHrrjD=s1600",
  },
];

export function CreatorStorefrontSection() {
  return (
    <section id="storefront" className="scroll-mt-24 px-5 py-20 sm:px-8 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <Pill tone="pink">Coming Soon</Pill>
            <span className="text-xs font-bold uppercase tracking-[.16em] text-[#5341cd]">
              Creator storefronts
            </span>
          </div>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-[-.03em] text-[#1b1b1e] sm:text-4xl md:text-5xl">
            A storefront that makes recommendations shoppable.
          </h2>
          <p className="mt-5 text-base leading-7 text-[#474554]">
            Curate products for your audience and keep each recommendation connected to the creator and product referral.
          </p>
        </div>
        <div className="mt-12 overflow-hidden rounded-2xl border border-[#e6e6ef] bg-white shadow-[0_16px_36px_rgba(24,24,27,.06)]">
          {/* Storefront Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e6e6ef] bg-[#faf8fc]/60 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={creatorPhoto}
                  alt="Ananya portrait"
                  className="h-11 w-11 rounded-full border border-white object-cover shadow-xs"
                />
                <CheckCircle2 className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-white text-[#5341cd]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <b className="text-sm text-[#1b1b1e]">@ananya.curates</b>
                  <span className="rounded-full bg-[#5341cd]/10 px-2 py-0.5 text-[10px] font-semibold text-[#5341cd]">
                    Verified Creator
                  </span>
                </div>
                <p className="text-xs text-[#787586]">
                  Curated beauty, home & everyday lifestyle finds
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-[#787586] sm:inline">
                megainfluencer.in/ananya
              </span>
              <Pill tone="violet">Coming soon</Pill>
            </div>
          </div>

          {/* Storefront Products Grid */}
          <div className="grid gap-6 p-6 sm:grid-cols-3">
            {storefrontProducts.map((product) => (
              <div
                key={product.name}
                className="group flex flex-col justify-between rounded-2xl border border-[#e6e6ef] bg-white p-4 transition-all duration-300 hover:border-[#5341cd]/30 hover:shadow-lg"
              >
                <div>
                  {/* Product Image */}
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-[#f6f2f7]">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-semibold text-[#1b1b1e] shadow-xs backdrop-blur-xs">
                      {product.tag}
                    </span>
                    <span className="absolute right-2.5 top-2.5 rounded-full bg-[#00655a]/90 px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-xs backdrop-blur-xs">
                      {product.commission}
                    </span>
                  </div>

                  {/* Product Metadata */}
                  <div className="mt-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-[#1b1b1e] leading-snug tracking-tight transition-colors group-hover:text-[#5341cd]">
                        {product.name}
                      </h3>
                    </div>
                    <div className="mt-1.5 flex items-baseline justify-between">
                      <span className="text-xs text-[#787586]">{product.brand}</span>
                      <b className="font-display text-base font-bold text-[#1b1b1e]">
                        {product.price}
                      </b>
                    </div>
                  </div>
                </div>

                {/* Buy Button */}
                <div className="mt-5">
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b1b1e] py-2.5 text-xs font-semibold text-white shadow-xs transition-all duration-200 hover:bg-[#5341cd] active:scale-[0.99] cursor-pointer"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>Buy now</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>
                  <p className="mt-2 text-center text-[10px] font-medium text-[#787586]">
                    Coming soon · Reconciled with Shopify storefronts
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
