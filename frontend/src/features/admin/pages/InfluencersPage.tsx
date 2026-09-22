import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Instagram,
  Power,
  Search,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  getInfluencers,
  updateInfluencerStatus,
  type InfluencerStatus,
} from "../api/influencers.api";

function CreatorAvatar({ name, tone = "bg-primary/10 text-primary" }: { name: string; tone?: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold ${tone}`}>
      {initials || "C"}
    </span>
  );
}

export function InfluencersPage() {
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [status, setStatus] = useState<InfluencerStatus | undefined>();
  const [page, setPage] = useState(1);

  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", "influencers", page, status, appliedSearch],
    queryFn: () => getInfluencers({ page, status, search: appliedSearch || undefined }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: InfluencerStatus }) =>
      updateInfluencerStatus(id, nextStatus),
    onSuccess: (data) => {
      client.invalidateQueries({ queryKey: ["admin", "influencers"] });
      toast.success(`Influencer account set to ${data.status.toLowerCase()}`);
    },
    onError: () => toast.error("Could not update influencer account status"),
  });

  const data = query.data;
  const influencers = data?.influencers ?? [];
  const total = data?.pagination.total ?? 0;

  const tones = [
    "bg-coral/15 text-coral",
    "bg-primary/15 text-primary",
    "bg-teal/15 text-teal",
    "bg-indigo/15 text-indigo",
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Creator Directory"
        description="Comprehensive management of creator accounts, verified Instagram handles, and platform participation."
      />

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-4">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">Total Creators</p>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <UsersRound className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">{total.toLocaleString()}</p>
            <p className="mt-1 text-xs text-muted-foreground">Registered on MegaInfluencer</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">Instagram Verified</p>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-pink-500/10 text-pink-600">
                <Instagram className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">
              {influencers.filter((i) => i.instagramUsername).length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">With connected profile</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">Active Status</p>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal/10 text-teal">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">
              {influencers.filter((i) => i.status === "ACTIVE").length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">In good standing</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">Suspended / Review</p>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-amber-500/10 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">
              {influencers.filter((i) => i.status === "SUSPENDED").length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Access restricted</p>
          </CardContent>
        </Card>
      </section>

      <Card className="shadow-card overflow-hidden">
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
                className="pl-9 h-9 text-sm"
                placeholder="Search name, Instagram handle, or email..."
              />
            </div>
            <Button type="submit" size="sm">Search</Button>
          </form>

          <div className="flex rounded-lg border bg-muted/30 p-0.5">
            {([undefined, "ACTIVE", "SUSPENDED"] as const).map((item) => (
              <button
                key={item ?? "all"}
                onClick={() => {
                  setStatus(item);
                  setPage(1);
                }}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                  status === item
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item ? item[0] + item.slice(1).toLowerCase() : "All"}
              </button>
            ))}
          </div>
        </div>

        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Influencer Profile</th>
                <th className="px-4 py-3 font-medium">Instagram Handle</th>
                <th className="px-4 py-3 font-medium">Account Status</th>
                <th className="px-4 py-3 font-medium">Joined Date</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {query.isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td colSpan={5} className="px-5 py-4">
                      <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                    </td>
                  </tr>
                ))
              ) : influencers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                    No influencer accounts found.
                  </td>
                </tr>
              ) : (
                influencers.map((influencer, index) => {
                  const isActive = influencer.status === "ACTIVE";
                  return (
                    <tr key={influencer.id} className="border-b last:border-0 hover:bg-muted/15 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <CreatorAvatar
                            name={influencer.displayName}
                            tone={tones[index % tones.length]}
                          />
                          <div>
                            <p className="font-semibold text-foreground">{influencer.displayName}</p>
                            <p className="text-xs text-muted-foreground">
                              {influencer.email ?? "No email address"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {influencer.instagramUsername ? (
                          <span className="inline-flex items-center gap-1 font-medium text-xs text-pink-600 dark:text-pink-400">
                            <Instagram className="h-3.5 w-3.5" />
                            @{influencer.instagramUsername}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not connected</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
                          variant={isActive ? "outline" : "secondary"}
                          className={isActive ? "border-teal/30 bg-teal/5 text-teal text-xs font-medium" : "text-xs"}
                        >
                          {isActive ? "Active" : "Suspended"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(
                          new Date(influencer.createdAt)
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant={isActive ? "outline" : "default"}
                            size="sm"
                            className={`h-7 text-xs ${
                              isActive
                                ? "text-muted-foreground hover:text-destructive hover:border-destructive/40"
                                : "bg-teal hover:bg-teal/90 text-teal-foreground"
                            }`}
                            disabled={statusMutation.isPending}
                            onClick={() =>
                              statusMutation.mutate({
                                id: influencer.id,
                                nextStatus: isActive ? "SUSPENDED" : "ACTIVE",
                              })
                            }
                          >
                            <Power className="h-3 w-3 mr-1" />
                            {isActive ? "Suspend" : "Activate"}
                          </Button>
                          <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-primary">
                            <Link
                              to="/admin/influencers/$influencerId"
                              params={{ influencerId: influencer.id }}
                            >
                              Details <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>

        {data && data.pagination.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t px-5 py-3.5 text-xs">
            <span className="text-muted-foreground">
              Page {data.pagination.page} of {data.pagination.totalPages} · {data.pagination.total} accounts
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
