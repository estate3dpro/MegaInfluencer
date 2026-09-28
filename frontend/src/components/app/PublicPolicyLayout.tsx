import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { FileText, Lock, ShieldCheck, Trash2 } from "lucide-react";
import { LandingFooter, LandingHeader, Pill } from "@/features/marketing/components";

export function PublicPolicyLayout({
  title,
  subtitle,
  lastUpdated,
  children,
}: {
  title: string;
  subtitle: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#fbf8fc] font-sans text-[#1b1b1e] flex flex-col">
      {/* Shared Sticky Landing Header */}
      <LandingHeader />

      {/* Hero Header Banner */}
      <section className="px-5 pt-12 pb-6 sm:px-8 sm:pt-16 sm:pb-8">
        <div className="mx-auto max-w-4xl text-center">
          <Pill tone="violet">
            <span className="font-normal text-[#474554]">Legal & Compliance</span>
          </Pill>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-[#1b1b1e] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-3 text-base leading-7 text-[#474554] sm:text-lg max-w-2xl mx-auto">
            {subtitle}
          </p>
          <p className="mt-3 text-xs font-medium text-[#787586]">
            Last updated: <span className="font-semibold text-[#1b1b1e]">{lastUpdated}</span>
          </p>

          {/* Sub-nav Tab Bar for Policies */}
          <div className="mt-8 flex items-center justify-center gap-2 overflow-x-auto p-1.5 rounded-full border border-[#c8c4d7]/50 bg-[#f6f2f7] w-fit mx-auto">
            <Link
              to="/privacy-policy"
              activeProps={{
                className: "bg-white text-[#1b1b1e] shadow-sm font-semibold",
              }}
              inactiveProps={{
                className: "text-[#474554] hover:text-[#1b1b1e] hover:bg-white/50 font-medium",
              }}
              className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs sm:text-sm transition-all duration-200 shrink-0"
            >
              <Lock className="h-3.5 w-3.5" /> Privacy Policy
            </Link>
            <Link
              to="/terms-of-service"
              activeProps={{
                className: "bg-white text-[#1b1b1e] shadow-sm font-semibold",
              }}
              inactiveProps={{
                className: "text-[#474554] hover:text-[#1b1b1e] hover:bg-white/50 font-medium",
              }}
              className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs sm:text-sm transition-all duration-200 shrink-0"
            >
              <FileText className="h-3.5 w-3.5" /> Terms of Service
            </Link>
            <Link
              to="/data-deletion"
              activeProps={{
                className: "bg-white text-[#1b1b1e] shadow-sm font-semibold",
              }}
              inactiveProps={{
                className: "text-[#474554] hover:text-[#1b1b1e] hover:bg-white/50 font-medium",
              }}
              className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs sm:text-sm transition-all duration-200 shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" /> Data Deletion
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Card */}
      <section className="flex-1 px-5 pb-20 sm:px-8 md:pb-28">
        <div className="mx-auto max-w-4xl rounded-3xl border border-[#e6e6ef] bg-white p-6 sm:p-12 shadow-sm">
          <article className="prose prose-slate max-w-none space-y-8 text-sm sm:text-base leading-relaxed text-[#474554] [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#1b1b1e] [&_h2]:border-b [&_h2]:border-[#e6e6ef] [&_h2]:pb-2 [&_strong]:text-[#1b1b1e] [&_code]:bg-[#f0edf1] [&_code]:text-[#5341cd] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:font-mono [&_code]:text-xs [&_a]:text-[#5341cd] [&_a]:underline">
            {children}
          </article>
        </div>
      </section>

      {/* Shared Landing Footer */}
      <LandingFooter />
    </main>
  );
}
