import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck, Sparkles, Lock, FileText, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Public Header */}
      <header className="sticky top-0 z-40 border-b bg-card/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 font-display text-lg font-bold text-foreground">
            <img src="/logo/MI_Logo.svg" alt="MegaInfluencer" className="h-9 w-9 object-contain" />
            <span>MegaInfluencer</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-block"
            >
              Sign In
            </Link>
            <Button asChild size="sm" variant="outline" className="text-xs">
              <Link to="/login">
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to App
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Header Banner */}
      <div className="border-b bg-gradient-to-b from-primary/5 via-card to-background py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-4">
            <Sparkles className="h-3.5 w-3.5" /> Powered by Megascale Compliance
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            {title}
          </h1>
          <p className="mt-3 text-base text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
          <p className="mt-4 text-xs font-medium text-muted-foreground">
            Last updated: <span className="text-foreground">{lastUpdated}</span>
          </p>
        </div>
      </div>

      {/* Policy Page Nav Links */}
      <div className="border-b bg-card/50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 flex items-center justify-center gap-2 sm:gap-6 py-3 text-xs sm:text-sm font-medium overflow-x-auto">
          <Link
            to="/privacy-policy"
            activeProps={{ className: "text-primary font-semibold border-b-2 border-primary pb-1" }}
            inactiveProps={{ className: "text-muted-foreground hover:text-foreground pb-1" }}
            className="flex items-center gap-1.5 shrink-0"
          >
            <Lock className="h-3.5 w-3.5" /> Privacy Policy
          </Link>
          <span className="text-muted-foreground/40">•</span>
          <Link
            to="/terms-of-service"
            activeProps={{ className: "text-primary font-semibold border-b-2 border-primary pb-1" }}
            inactiveProps={{ className: "text-muted-foreground hover:text-foreground pb-1" }}
            className="flex items-center gap-1.5 shrink-0"
          >
            <FileText className="h-3.5 w-3.5" /> Terms of Service
          </Link>
          <span className="text-muted-foreground/40">•</span>
          <Link
            to="/data-deletion"
            activeProps={{ className: "text-primary font-semibold border-b-2 border-primary pb-1" }}
            inactiveProps={{ className: "text-muted-foreground hover:text-foreground pb-1" }}
            className="flex items-center gap-1.5 shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" /> Data Deletion Instructions
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <article className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-sm sm:text-base leading-relaxed">
          {children}
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card py-10 mt-auto">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 font-display font-semibold text-foreground">
            <img src="/logo/MI_Logo.svg" alt="MegaInfluencer" className="h-6 w-6 object-contain" />
            <span>MegaInfluencer</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link to="/data-deletion" className="hover:text-foreground transition-colors">
              Data Deletion
            </Link>
          </div>
          <p>© {new Date().getFullYear()} MegaInfluencer Inc. Powered by Megascale. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
