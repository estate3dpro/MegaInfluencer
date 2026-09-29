import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

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
            <a
              href="https://megascale.in"
              target="_blank"
              rel="noreferrer"
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#5341cd]/10 px-2.5 py-1 text-[11px] font-semibold text-[#5341cd] transition hover:bg-[#5341cd]/20"
            >
              <Sparkles className="h-3 w-3" /> Powered by Megascale
            </a>
            <p className="mt-3 max-w-sm text-sm leading-6 text-[#474554]">
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
            <h3 className="text-xs font-bold uppercase tracking-wider">Support & Legal</h3>
            <div className="mt-4 grid gap-3 text-sm text-[#474554]">
              <Link to="/contact" className="hover:text-[#1b1b1e]">Contact MegaInfluencer</Link>
              <Link to="/privacy-policy" className="hover:text-[#1b1b1e]">Privacy Policy</Link>
              <Link to="/terms-of-service" className="hover:text-[#1b1b1e]">Terms of Service</Link>
              <Link to="/data-deletion" className="hover:text-[#1b1b1e]">Data Deletion</Link>
              <a href="#integrations" className="hover:text-[#1b1b1e]">Integration status</a>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-sm text-[#787586] lg:flex-row">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <span>© 2026 MegaInfluencer. All rights reserved.</span>
            <span className="hidden sm:inline">•</span>
            <span>
              Powered by{" "}
              <a
                href="https://megascale.in"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[#1b1b1e] hover:underline"
              >
                Megascale
              </a>
            </span>
            <span className="hidden sm:inline">•</span>
            <Link to="/privacy-policy" className="hover:text-[#1b1b1e] transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/terms-of-service" className="hover:text-[#1b1b1e] transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link to="/data-deletion" className="hover:text-[#1b1b1e] transition-colors">
              Data Deletion
            </Link>
          </div>
          <span className="flex items-center gap-2 text-xs">
            <i className="h-2 w-2 rounded-full bg-[#00655a]" />
            Shopify & Instagram API webhooks operational
          </span>
        </div>
      </div>
    </footer>
  );
}
