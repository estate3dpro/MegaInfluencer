import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Check, Instagram, Search, UserPlus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  assignStoreCreator,
  getAvailableCreators,
  getStoreCreators,
  type AvailableCreator,
  type StoreCreator,
} from "../api/creators.api";

type DirectoryCreator = (StoreCreator | AvailableCreator) & { connectedToStore: boolean };
const avatarTones = [
  "bg-coral/15 text-coral",
  "bg-primary/15 text-primary",
  "bg-teal/15 text-teal",
  "bg-indigo/15 text-indigo",
];

function creatorInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "C"
  );
}

function isStoreCreator(
  creator: DirectoryCreator,
): creator is StoreCreator & { connectedToStore: true } {
  return creator.connectedToStore;
}

export function CreatorDirectoryPage() {
  const [search, setSearch] = useState("");
  const [selectedCreator, setSelectedCreator] = useState<DirectoryCreator | null>(null);
  const client = useQueryClient();
  const connectedQuery = useQuery({ queryKey: ["store", "creators"], queryFn: getStoreCreators });
  const availableQuery = useQuery({
    queryKey: ["store", "creators", "available"],
    queryFn: getAvailableCreators,
  });
  const allCreators = useMemo<DirectoryCreator[]>(
    () => [
      ...(connectedQuery.data ?? []).map((creator) => ({
        ...creator,
        connectedToStore: true as const,
      })),
      ...(availableQuery.data ?? []).map((creator) => ({
        ...creator,
        connectedToStore: false as const,
      })),
    ],
    [availableQuery.data, connectedQuery.data],
  );
  const creators = allCreators.filter((creator) =>
    `${creator.displayName} ${creator.email ?? ""} ${creator.instagramUsername ?? ""} ${creator.creatorCode ?? ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  const connectMutation = useMutation({
    mutationFn: assignStoreCreator,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["store", "creators"] });
      toast.success("Creator connected to your store");
      setSelectedCreator(null);
    },
    onError: () => toast.error("Could not connect this creator to your store"),
  });
  const loading = connectedQuery.isLoading || availableQuery.isLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Creators"
        description="Discover platform creators and manage the partners connected to your store."
      />
      <Card className="shadow-card">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <UsersRound className="h-4 w-4" />
            </span>
            <span>
              <strong className="text-foreground">{allCreators.length}</strong> platform creators ·{" "}
              {connectedQuery.data?.length ?? 0} connected to your store
            </span>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
              placeholder="Search creators..."
            />
          </div>
        </CardContent>
      </Card>
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="h-96 animate-pulse bg-muted/50" />
          ))}
        </div>
      ) : creators.length === 0 ? (
        <Card className="border-dashed shadow-card">
          <CardContent className="p-12 text-center text-sm text-muted-foreground">
            No creators match this search.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {creators.map((creator, index) => {
            const connected = isStoreCreator(creator);
            return (
              <Card
                key={creator.id}
                className="group overflow-hidden shadow-card transition-shadow hover:shadow-lg"
              >
                <div className="relative h-28 bg-gradient-to-br from-primary/90 via-fuchsia-500/75 to-coral/80">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,.35),transparent_35%)]" />
                  <Badge className="absolute right-3 top-3 border-white/30 bg-white/90 text-foreground hover:bg-white">
                    {connected ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Connected
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-3.5 w-3.5" /> View profile
                      </>
                    )}
                  </Badge>
                </div>
                <CardContent className="relative p-5 pt-0">
                  <span
                    className={`-mt-9 grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full border-4 border-card text-lg font-bold ${avatarTones[index % avatarTones.length]}`}
                  >
                    {creatorInitials(creator.displayName)}
                  </span>
                  <div className="mt-3 min-w-0">
                    <p className="truncate font-display text-xl font-semibold">
                      {creator.displayName}
                    </p>
                    {creator.instagramUsername ? (
                      <p className="mt-1 flex items-center gap-1 text-sm text-pink-600 dark:text-pink-400">
                        <Instagram className="h-3.5 w-3.5" /> @{creator.instagramUsername}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">Platform creator</p>
                    )}
                    <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
                      {connected
                        ? "A connected creator partner with access to your store’s tracking and product tools."
                        : "View this creator’s platform profile before connecting them to your store."}
                    </p>
                  </div>
                  <div className="mt-4 grid grid-cols-3 divide-x rounded-xl border bg-muted/30 text-center">
                    <div className="px-2 py-3">
                      <p className="text-sm font-semibold">
                        {connected ? (creator.totalOrders ?? 0) : "—"}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">Orders</p>
                    </div>
                    <div className="px-2 py-3">
                      <p className="text-sm font-semibold">
                        {connected ? (creator.activeLinks ?? 0) : "—"}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">Links</p>
                    </div>
                    <div className="px-2 py-3">
                      <p className="text-sm font-semibold">{creator.creatorCode ?? "—"}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">Code</p>
                    </div>
                  </div>
                  {connected ? (
                    <Button asChild className="mt-4 w-full" variant="outline">
                      <Link
                        to="/store-admin/creators/$creatorId"
                        params={{ creatorId: creator.id }}
                      >
                        Open full profile
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      className="mt-4 w-full"
                      variant="outline"
                      onClick={() => setSelectedCreator(creator)}
                    >
                      View profile
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <Dialog
        open={Boolean(selectedCreator)}
        onOpenChange={(open) => !open && setSelectedCreator(null)}
      >
        <DialogContent className="sm:max-w-md">
          {selectedCreator ? (
            <>
              <DialogHeader>
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-xl font-bold text-primary sm:mx-0">
                  {creatorInitials(selectedCreator.displayName)}
                </div>
                <DialogTitle className="pt-2">{selectedCreator.displayName}</DialogTitle>
                <DialogDescription>
                  {selectedCreator.instagramUsername
                    ? `@${selectedCreator.instagramUsername}`
                    : "MegaInfluencer platform creator"}
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                This is a platform profile preview. Connect this creator to unlock their full store
                profile, including product assignment and tracking tools.
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedCreator(null)}>
                  Close
                </Button>
                <Button
                  disabled={connectMutation.isPending}
                  onClick={() => connectMutation.mutate(selectedCreator.id)}
                >
                  <UserPlus className="h-4 w-4" />{" "}
                  {connectMutation.isPending ? "Connecting…" : "Connect creator"}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
