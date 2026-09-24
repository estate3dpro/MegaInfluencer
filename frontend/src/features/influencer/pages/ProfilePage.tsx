import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  ExternalLink,
  Images,
  Instagram,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isApiError } from "@/lib/api/api-error";
import { queryKeys } from "@/lib/query-keys";
import { initials } from "@/lib/format";
import {
  getInstagramProfile,
  startInstagramConnection,
} from "@/features/influencer/api/instagram.api";
import { useAuthStore } from "@/stores/auth-store";

const numberFormatter = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value))
    : "Not available";
}

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const profileQuery = useQuery({
    queryKey: queryKeys.instagram.profile,
    queryFn: getInstagramProfile,
    staleTime: 60_000,
  });
  const connectMutation = useMutation({
    mutationFn: startInstagramConnection,
    onSuccess: (authorizationUrl) => window.location.assign(authorizationUrl),
  });
  const data = profileQuery.data;
  const profileName =
    data?.profile.name || data?.connection.displayName || user?.name || "Influencer";
  const username = data?.profile.username || data?.connection.username;
  const errorMessage = isApiError(profileQuery.error)
    ? profileQuery.error.message
    : "Instagram profile details could not be loaded.";
  const connectionError = isApiError(connectMutation.error)
    ? connectMutation.error.message
    : connectMutation.error
      ? "Instagram connection could not be started. Please try again."
      : null;

  function handleConnectInstagram() {
    connectMutation.mutate();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your creator identity and connected Instagram account."
      />

      <Card className="overflow-hidden">
        <div className="h-24 bg-[linear-gradient(115deg,#6c5ce7,#ec6b9a,#f59e0b)]" />
        <CardContent className="relative px-6 pb-6 pt-0">
          <Avatar className="-mt-11 h-24 w-24 border-4 border-card">
            <AvatarFallback className="bg-primary text-xl font-bold text-accent dark:text-accent-foreground">
              {initials(profileName)}
            </AvatarFallback>
          </Avatar>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-2xl font-semibold">{profileName}</h2>
                <Badge className="gap-1 bg-success/15 text-success hover:bg-success/15">
                  <ShieldCheck className="h-3.5 w-3.5" /> Influencer
                </Badge>
              </div>
              {username ? <p className="mt-1 text-sm text-muted-foreground">@{username}</p> : null}
              <p className="mt-1 text-sm text-muted-foreground">Creator code: <span className="font-mono font-medium text-foreground">{data?.creatorCode ?? "—"}</span></p>
              {user?.email ? (
                <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleConnectInstagram} disabled={connectMutation.isPending}>
                <Instagram className="h-4 w-4" />
                {connectMutation.isPending
                  ? "Opening Instagram..."
                  : username
                    ? "Reconnect Instagram"
                    : "Connect Instagram"}
              </Button>
              {username ? (
                <a
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  href={`https://instagram.com/${username}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  View Instagram <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          </div>
          {connectionError ? <p className="mt-4 text-sm text-destructive">{connectionError}</p> : null}
        </CardContent>
      </Card>

      {profileQuery.isLoading ? <ProfileLoading /> : null}
      {profileQuery.isError ? (
        <Card>
          <CardContent className="space-y-2 p-6">
            <p className="font-medium">Instagram is not connected</p>
            <p className="text-sm text-muted-foreground">
              Connect your Instagram account to view profile insights, publish automations, and use inbox tools.
            </p>
            {!isApiError(profileQuery.error) || profileQuery.error.code !== "INSTAGRAM_NOT_CONNECTED" ? (
              <p className="text-sm text-destructive">{errorMessage}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
      {data ? (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={Users}
              label="Followers"
              value={data.profile.followers_count}
              help="Available when granted by Instagram"
            />
            <StatCard
              icon={UserPlus}
              label="Following"
              value={data.profile.follows_count}
              help="Available when granted by Instagram"
            />
            <StatCard
              icon={Images}
              label="Media posts"
              value={data.profile.media_count}
              help="Connected account total"
            />
          </section>
          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <CardHeader>
                <CardTitle>Instagram account</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
                <Detail label="Instagram username" value={`@${data.connection.username}`} />
                <Detail label="Creator code" value={data.creatorCode ?? "—"} mono />
                <Detail label="Instagram account ID" value={data.connection.instagramUserId} mono />
                <Detail
                  label="Connection status"
                  value={
                    data.connection.status === "ACTIVE"
                      ? "Connected and active"
                      : data.connection.status
                  }
                />
                <Detail label="Connected on" value={formatDate(data.connection.connectedAt)} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Connection health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="flex items-center gap-2 font-medium text-success">
                  <ShieldCheck className="h-4 w-4" /> Instagram is connected
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" /> Token expiry:{" "}
                  {formatDate(data.connection.tokenExpiresAt)}
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  Reconnect Instagram before the token expires to keep posts and automation data
                  available.
                </p>
              </CardContent>
            </Card>
          </section>
        </>
      ) : null}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  help,
}: {
  icon: typeof Users;
  label: string;
  value?: number;
  help: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-2xl font-semibold">
            {typeof value === "number" ? numberFormatter.format(value) : "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{help}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 break-all font-medium ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
    </div>
  );
}

function ProfileLoading() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {["one", "two", "three"].map((key) => (
        <Card key={key}>
          <CardContent className="h-28 animate-pulse p-5">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="mt-4 h-7 w-16 rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
