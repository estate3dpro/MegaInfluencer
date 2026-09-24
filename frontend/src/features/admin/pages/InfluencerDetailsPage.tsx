import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Images, Instagram, Package, Plus, ShieldCheck, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAdminInfluencerAssignedProducts,
  getAdminInstagramProfile,
  getInfluencer,
  provisionInfluencerCredentials,
  updateAdminInfluencerAssignedProducts,
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

      <ProvisionCredentialsCard
        influencerId={influencerId}
        email={influencer.email}
        onProvisioned={(updated) => {
          client.setQueryData(["admin", "influencer", influencerId], (current: typeof query.data) =>
            current ? { ...current, ...updated } : current,
          );
          void client.invalidateQueries({ queryKey: ["admin", "influencers"] });
        }}
      />

      {/* Assigned Products Section */}
      <AssignedProductsSection influencerId={influencerId} displayName={influencer.displayName} />

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

function ProvisionCredentialsCard({
  influencerId,
  email: currentEmail,
  onProvisioned,
}: {
  influencerId: string;
  email: string | null;
  onProvisioned: (updated: { id: string; email: string | null; updatedAt: string }) => void;
}) {
  const [email, setEmail] = useState(currentEmail ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: () => provisionInfluencerCredentials(influencerId, { email, password }),
    onSuccess: (updated) => {
      onProvisioned(updated);
      setPassword("");
      setConfirmPassword("");
      toast.success("Login credentials saved. Share the email and temporary password securely.");
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    mutation.mutate();
  }

  const errorMessage =
    formError ??
    (mutation.error ? "Unable to save credentials. Check the email and try again." : null);

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Influencer login credentials</CardTitle>
        <p className="text-sm text-muted-foreground">
          Use this for creators who previously signed in through Instagram only. The password is securely hashed and cannot be viewed again after saving.
        </p>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
          <label className="grid gap-2 text-sm font-medium sm:col-span-2">
            Login email
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="off" required />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Temporary password
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} autoComplete="new-password" required />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Confirm temporary password
            <Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={12} autoComplete="new-password" required />
          </label>
          {errorMessage ? <p className="text-sm text-destructive sm:col-span-2">{errorMessage}</p> : null}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving credentials..." : currentEmail ? "Reset login credentials" : "Create login credentials"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function AssignedProductsSection({ influencerId, displayName }: { influencerId: string; displayName: string }) {
  const client = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const productsQuery = useQuery({
    queryKey: ["admin", "influencer-products", influencerId],
    queryFn: () => getAdminInfluencerAssignedProducts(influencerId),
  });

  const mutation = useMutation({
    mutationFn: (productIds: string[]) => updateAdminInfluencerAssignedProducts(influencerId, productIds),
    onSuccess: (data) => {
      client.invalidateQueries({ queryKey: ["admin", "influencer-products", influencerId] });
      setDialogOpen(false);
      toast.success(`Assigned ${data.assignedCount} products to ${displayName}`);
    },
    onError: () => toast.error("Failed to update product assignments"),
  });

  const stores = productsQuery.data?.stores ?? [];
  const allProducts = stores.flatMap((s) => s.products.map((p) => ({ ...p, storeName: s.name })));
  const assignedProducts = allProducts.filter((p) => p.isAssigned);

  const openModal = () => {
    setSelectedIds(assignedProducts.map((p) => p.id));
    setDialogOpen(true);
  };

  const toggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const filtered = allProducts.filter((p) => p.title.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <Card className="shadow-none">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" /> Assigned Products
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {assignedProducts.length > 0
              ? `${assignedProducts.length} specific products assigned to this influencer.`
              : "No restricted assignments. All products from assigned stores are visible."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={openModal}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Manage Assignments
        </Button>
      </CardHeader>
      <CardContent>
        {assignedProducts.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {assignedProducts.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="grid h-12 w-12 place-items-center overflow-hidden rounded bg-muted shrink-0">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Package className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.storeName} · {p.price ? (p.price.startsWith("₹") ? p.price : `₹${p.price}`) : "—"}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => {
                    const newIds = assignedProducts.filter((x) => x.id !== p.id).map((x) => x.id);
                    mutation.mutate(newIds);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-sm font-medium">No restricted product assignments</p>
            <p className="mt-1 text-xs text-muted-foreground">
              By default, the influencer can see all products from their assigned stores. Click &quot;Manage Assignments&quot; to limit visibility to specific products.
            </p>
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Assign Products to {displayName}</DialogTitle>
              <DialogDescription>
                Select which products from assigned stores should appear on this creator&apos;s panel.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2">
              <Input
                placeholder="Search products by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 border rounded-lg p-2 min-h-60 max-h-96">
              {filtered.map((p) => {
                const isChecked = selectedIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => toggle(p.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer ${
                      isChecked ? "bg-primary/10 border-primary" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`grid h-5 w-5 place-items-center rounded border ${
                          isChecked ? "bg-primary text-primary-foreground border-primary" : "border-muted-foreground"
                        }`}
                      >
                        {isChecked && <Check className="h-3.5 w-3.5" />}
                      </div>
                      <div className="grid h-10 w-10 place-items-center overflow-hidden rounded bg-muted shrink-0">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Package className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">{p.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {p.storeName} · {p.price ? (p.price.startsWith("₹") ? p.price : `₹${p.price}`) : "—"}
                        </p>
                      </div>
                    </div>
                    {isChecked && <Badge variant="secondary">Selected</Badge>}
                  </div>
                );
              })}
              {!filtered.length && (
                <p className="py-10 text-center text-sm text-muted-foreground">No products found.</p>
              )}
            </div>

            <DialogFooter className="flex items-center justify-between pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                <b>{selectedIds.length}</b> products selected
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => mutation.mutate(selectedIds)} disabled={mutation.isPending}>
                  {mutation.isPending ? "Saving..." : "Save Assignments"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
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
