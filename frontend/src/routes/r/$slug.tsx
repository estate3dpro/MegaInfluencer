import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/r/$slug")({
  component: AffiliateRedirectRoute,
});

function AffiliateRedirectRoute() {
  const { slug } = Route.useParams();

  useEffect(() => {
    const rawApiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    let apiOrigin = "http://localhost:3000";
    try {
      apiOrigin = new URL(rawApiUrl).origin;
    } catch {
      apiOrigin = rawApiUrl.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");
    }

    const search = window.location.search || "";
    // Forward to backend tracking endpoint which records click analytics and 302 redirects to Shopify destination
    window.location.replace(`${apiOrigin}/r/${encodeURIComponent(slug)}${search}`);
  }, [slug]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-foreground">Redirecting to store…</p>
        <p className="text-xs text-muted-foreground">Taking you to the official partner store.</p>
      </div>
    </div>
  );
}
