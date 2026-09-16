import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Instagram, Search } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getInfluencers, type InfluencerStatus } from "../api/influencers.api";

export function InfluencersPage() {
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [status, setStatus] = useState<InfluencerStatus | undefined>();
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["admin", "influencers", page, status, appliedSearch],
    queryFn: () => getInfluencers({ page, status, search: appliedSearch || undefined }),
  });
  const data = query.data;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Influencers"
        description="Instagram-connected creator accounts managed by the platform."
      />
      <Card className="shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
          <form
            className="flex w-full max-w-md gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setPage(1);
              setAppliedSearch(search.trim());
            }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Search name, Instagram, or email"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
          <div className="flex rounded-lg bg-muted p-1">
            {([undefined, "ACTIVE", "SUSPENDED"] as const).map((item) => (
              <button
                key={item ?? "all"}
                onClick={() => {
                  setStatus(item);
                  setPage(1);
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${status === item ? "bg-background shadow-sm" : "text-muted-foreground"}`}
              >
                {item ? item[0] + item.slice(1).toLowerCase() : "All"}
              </button>
            ))}
          </div>
        </div>
        {query.isError ? (
          <p className="m-5 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            Unable to load influencers. Please try again.
          </p>
        ) : null}
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Influencer</th>
                <th className="px-4 py-3 font-medium">Instagram</th>
                <th className="px-4 py-3 font-medium">Connection</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {query.isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-5 py-5">
                        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                      </td>
                    </tr>
                  ))
                : data?.influencers.map((influencer) => (
                    <tr key={influencer.id} className="border-b last:border-0">
                      <td className="px-5 py-4">
                        <p className="font-medium">{influencer.displayName}</p>
                        <p className="text-xs text-muted-foreground">
                          {influencer.email ?? "No email address"}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        {influencer.instagramUsername
                          ? `@${influencer.instagramUsername}`
                          : "Not connected"}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={
                            influencer.instagramId ? "text-emerald-600" : "text-muted-foreground"
                          }
                        >
                          {influencer.instagramId ? "Connected" : "Not connected"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={influencer.status === "ACTIVE" ? "default" : "secondary"}>
                          {influencer.status[0] + influencer.status.slice(1).toLowerCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {new Date(influencer.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link
                            to="/admin/influencers/$influencerId"
                            params={{ influencerId: influencer.id }}
                          >
                            View details
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
              {!query.isLoading && data?.influencers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-muted-foreground">
                    No influencer accounts found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
        {data && data.pagination.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t px-5 py-4 text-sm">
            <span className="text-muted-foreground">
              Page {data.pagination.page} of {data.pagination.totalPages} · {data.pagination.total}{" "}
              accounts
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Instagram className="h-4 w-4" /> Connection details reflect the latest stored Instagram
        authorization.
      </div>
    </div>
  );
}
