import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Images, Instagram, ShieldCheck, UserPlus, Users } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAdminInstagramProfile,
  getInfluencer,
  updateInfluencerStatus,
  type InfluencerStatus,
} from "../api/influencers.api";

const compactNumber = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function InfluencerDetailsPage({ influencerId }: { influencerId: string }) {
  const client = useQueryClient();
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ["admin", "influencer", influencerId],
    queryFn: () => getInfluencer(influencerId),
  });
  const instagramQuery = useQuery({
    queryKey: ["admin", "influencer", influencerId, "instagram-profile"],
    queryFn: () => getAdminInstagramProfile(influencerId),
    enabled: Boolean(query.data),
    staleTime: 60_000,
  });
  const mutation = useMutation({
    mutationFn: (status: InfluencerStatus) => updateInfluencerStatus(influencerId, status),
    onSuccess: (influencer) => {
      client.setQueryData(["admin", "influencer", influencerId], (current: typeof query.data) =>
        current ? { ...current, ...influencer } : current,
      );
      void client.invalidateQueries({ queryKey: ["admin", "influencers"] });
    },
  });
  if (query.isLoading) return <div className="h-72 animate-pulse rounded-xl bg-muted" />;
  if (!query.data)
    return (
      <Card>
        <CardContent className="p-6 text-destructive">Unable to load this influencer.</CardContent>
      </Card>
    );
  const influencer = query.data;
  const connection = influencer.instagramConnection;
  return (
    <div className="max-w-5xl space-y-6">
      <Button asChild variant="ghost" className="-ml-3">
        <Link to="/admin/influencers">
          <ArrowLeft className="h-4 w-4" /> Back to influencers
        </Link>
      </Button>
      <PageHeader
        title={influencer.displayName}
        description={influencer.email ?? "No email address"}
        actions={
          <Select
            value={influencer.status}
            disabled={mutation.isPending}
            onValueChange={(value) => mutation.mutate(value as InfluencerStatus)}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      {mutation.isError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          Unable to update account status.
        </p>
      ) : null}
      <section className="grid gap-4 sm:grid-cols-3">
        <Metric
          label="Account status"
          value={influencer.status === "ACTIVE" ? "Active" : "Suspended"}
        />
        <Metric label="Instagram" value={connection ? "Connected" : "Not connected"} />
        <Metric label="Joined" value={new Date(influencer.createdAt).toLocaleDateString()} />
      </section>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5 text-primary" /> Instagram statistics
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Live account data fetched securely from the connected Instagram account.
          </p>
        </CardHeader>
        <CardContent>
          {instagramQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <InstagramStat label="Followers" value="Loading…" icon={Users} />
              <InstagramStat label="Following" value="Loading…" icon={UserPlus} />
              <InstagramStat label="Media posts" value="Loading…" icon={Images} />
            </div>
          ) : instagramQuery.data?.profile ? (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <InstagramStat
                  label="Followers"
                  value={formatInstagramNumber(instagramQuery.data.profile.followers_count)}
                  icon={Users}
                />
                <InstagramStat
                  label="Following"
                  value={formatInstagramNumber(instagramQuery.data.profile.follows_count)}
                  icon={UserPlus}
                />
                <InstagramStat
                  label="Media posts"
                  value={formatInstagramNumber(instagramQuery.data.profile.media_count)}
                  icon={Images}
                />
              </div>
              <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <InstagramDetail
                  label="Instagram profile"
                  value={`@${instagramQuery.data.profile.username}`}
                />
                <InstagramDetail
                  label="Instagram account ID"
                  value={instagramQuery.data.profile.id}
                />
                <InstagramDetail
                  label="Profile name"
                  value={instagramQuery.data.profile.name ?? "Not supplied by Instagram"}
                />
                <InstagramDetail label="Data refresh" value="On page load" />
              </div>
            </>
          ) : (
            <p className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
              {instagramQuery.data?.unavailableReason ??
                "Instagram statistics could not be loaded."}
            </p>
          )}
        </CardContent>
      </Card>
      <section className="grid gap-6 lg:grid-cols-2">
        <DetailsCard
          title="Platform profile"
          icon={ShieldCheck}
          rows={[
            ["Display name", influencer.displayName],
            ["Email", influencer.email ?? "Not set"],
            ["Last updated", new Date(influencer.updatedAt).toLocaleString()],
          ]}
        />
        <DetailsCard
          title="Instagram connection"
          icon={Instagram}
          rows={[
            ["Username", connection ? `@${connection.username}` : "Not connected"],
            ["Instagram ID", connection?.instagramUserId ?? "Not connected"],
            ["Connection status", connection?.status ?? "Not connected"],
            [
              "Token expires",
              connection?.tokenExpiresAt
                ? new Date(connection.tokenExpiresAt).toLocaleString()
                : "Not available",
            ],
          ]}
        />
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Account controls</CardTitle>
          <p className="text-sm text-muted-foreground">
            Suspending an influencer prevents future authenticated platform activity. Instagram
            connection data is retained.
          </p>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => void navigate({ to: "/admin/influencers" })}>
            Return to list
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
function InstagramStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Users;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-4">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold">{value}</p>
      </div>
    </div>
  );
}
function InstagramDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 break-all font-medium">{value}</p>
    </div>
  );
}
function formatInstagramNumber(value: number | undefined) {
  return typeof value === "number" ? compactNumber.format(value) : "Not available";
}
function DetailsCard({
  title,
  icon: Icon,
  rows,
}: {
  title: string;
  icon: typeof Instagram;
  rows: Array<[string, string]>;
}) {
  return (
    <Card className="shadow-none">
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <Icon className="h-4 w-4 text-primary" />
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-6 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-right font-medium">{value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
