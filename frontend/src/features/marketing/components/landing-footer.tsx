import { Link } from "@tanstack/react-router";

export function LandingFooter() {
  return (
    <footer className="border-t border-[#e6e6ef] px-5 py-14 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 border-b border-[#e6e6ef] pb-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 font-display text-lg font-bold">
              <img src="/logo/MI_Logo.svg" alt="" className="h-8 w-8" />
              MegaInfluencer
            </div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-[#474554]">
              Creator commerce and affiliate operations connecting influencers, Shopify
              storefronts, and automated Instagram engagement.
            </p>
            <div className="mt-5 flex gap-3 text-sm font-semibold text-[#5341cd]">
              <a href="#top">X.com</a>
              <a href="#instagram-flow">Instagram</a>
              <a href="#brands">LinkedIn</a>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider">Platform</h3>
            <div className="mt-4 grid gap-3 text-sm text-[#474554]">
              <a href="#architecture">How it works</a>
              <a href="#instagram-flow">Instagram automation</a>
              <a href="#attribution">Webhook attribution</a>
              <a href="#roadmap">Roadmap</a>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider">Access</h3>
            <div className="mt-4 grid gap-3 text-sm text-[#474554]">
              <Link to="/register">Creator registration</Link>
              <Link to="/login">Creator login</Link>
              <Link to="/store/register">Brand registration</Link>
              <Link to="/store/login">Brand login</Link>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider">Support</h3>
            <div className="mt-4 grid gap-3 text-sm text-[#474554]">
              <Link to="/contact">Contact MegaInfluencer</Link>
              <a href="#integrations">Integration status</a>
              <a href="#roadmap">Product roadmap</a>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-sm text-[#787586] sm:flex-row">
          <span>© 2026 MegaInfluencer. Creator commerce & affiliate operations.</span>
          <span className="flex items-center gap-2">
            <i className="h-2 w-2 rounded-full bg-[#00655a]" />
            Shopify & Instagram API webhooks operational
          </span>
        </div>
      </div>
    </footer>
  );
}
