import { Link } from "@tanstack/react-router";

export function ContactPage() {
  return (
    <main className="min-h-screen bg-[#fbf8fc] px-5 py-16 text-[#1b1b1e] sm:px-8">
      <div className="mx-auto max-w-xl rounded-2xl border border-[#e6e6ef] bg-white p-8 shadow-sm">
        <Link to="/" className="text-sm font-semibold text-[#5341cd]">
          ← MegaInfluencer
        </Link>
        <h1 className="mt-8 font-display text-4xl font-bold tracking-tight">
          Contact MegaInfluencer
        </h1>
        <p className="mt-4 leading-7 text-[#474554]">
          For help with creator accounts, brand stores, or integrations, email our support team.
        </p>
        <a
          href="mailto:creator-support@megainfluencer.in"
          className="mt-8 inline-flex rounded-xl bg-[#5341cd] px-5 py-3 text-sm font-semibold text-white"
        >
          Email support
        </a>
      </div>
    </main>
  );
}
