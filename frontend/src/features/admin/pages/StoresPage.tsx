import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Boxes,
  Link2,
  Plus,
  Settings2,
  Store as StoreIcon,
  UserRound,
  UsersRound,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createStore,
  getAssignments,
  getStores,
  saveAssignments,
  updateStore,
  type Store,
  type StoreInput,
} from "../api/stores.api";

const blank: StoreInput = {
  name: "",
  ownerName: "",
  ownerEmail: "",
  password: "",
  platform: "SHOPIFY",
  connectionStatus: "PENDING",
  category: "",
  logoUrl: "",
  shopDomain: "",
  appUrl: "",
  apiUrl: "",
  shopifyConnectionMethod: "CLI_APP",
  shopifyAccessToken: "",
};

function connectionState(store: Store) {
  if (store.platform !== "SHOPIFY") {
    return {
      ready: store.connectionStatus === "CONNECTED",
      label: store.connectionStatus[0] + store.connectionStatus.slice(1).toLowerCase(),
      detail: null,
    };
  }
  const method = store.shopifyConnectionMethod ?? (store.appUrl ? "CLI_APP" : "ADMIN_API");
  const missing = [
    !store.shopDomain ? "Shopify store domain" : null,
    !store.hasShopifyAccessToken ? method === "CLI_APP" ? "bridge token" : "Admin API access token" : null,
    method === "CLI_APP" && !store.appUrl ? "CLI app URL" : null,
  ].filter(Boolean) as string[];
  if (store.connectionStatus !== "CONNECTED") {
    return { ready: false, label: "Pending setup", detail: "Set the connection status to Connected after completing setup." };
  }
  if (missing.length) return { ready: false, label: "Setup incomplete", detail: `Missing: ${missing.join(", ")}.` };
  return { ready: true, label: "Connected", detail: null };
}

export function StoresPage() {
  const client = useQueryClient();
  const [editor, setEditor] = useState<Store | null | undefined>();
  const [assigning, setAssigning] = useState<Store | null>(null);
  const stores = useQuery({ queryKey: ["admin", "stores"], queryFn: getStores });
  const refresh = () => client.invalidateQueries({ queryKey: ["admin", "stores"] });
  const save = useMutation({
    mutationFn: ({ store, input }: { store?: Store; input: StoreInput }) =>
      store ? updateStore(store.id, input) : createStore(input),
    onSuccess: () => {
      void refresh();
      setEditor(undefined);
    },
  });
  return (
    <div className="space-y-6">
      <PageHeader
        title="Stores"
        description="Manage commerce partners, owner access, connections and creator distribution."
        actions={
          <Button onClick={() => setEditor(null)}>
            <Plus className="h-4 w-4" /> Add store
          </Button>
        }
      />
      <section className="grid gap-4 md:grid-cols-3">
        {[
          [
            "Active stores",
            stores.data?.filter((store) => connectionState(store).ready).length ?? "—",
            Link2,
          ],
          [
            "Creator assignments",
            stores.data?.reduce((n, s) => n + s._count.assignments, 0) ?? "—",
            UsersRound,
          ],
          ["Total partners", stores.data?.length ?? "—", StoreIcon],
        ].map(([label, value, Icon]) => {
          const MetricIcon = Icon as typeof Link2;
          return (
            <Card key={label as string} className="shadow-none">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{label as string}</p>
                  <p className="mt-2 text-2xl font-semibold">{value as string | number}</p>
                </div>
                <MetricIcon className="h-5 w-5 text-primary" />
              </CardContent>
            </Card>
          );
        })}
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        {stores.data?.map((store) => {
          const connection = connectionState(store);
          return <Card key={store.id} className="overflow-hidden shadow-none">
            <div className="h-1 bg-primary" />
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Boxes className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-semibold">{store.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {store.category ?? "Uncategorized"} · {store.platform}
                    </p>
                  </div>
                </div>
                <Badge variant={connection.ready ? "default" : "secondary"}>
                  {connection.label}
                </Badge>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 rounded-lg bg-muted/40 p-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Store owner</p>
                  <p className="mt-1 font-medium">{store.owner.displayName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Assigned creators</p>
                  <p className="mt-1 font-medium">{store._count.assignments}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Connection</p>
                  <p className="mt-1 truncate font-medium">
                    {store.shopDomain ?? store.appUrl ?? store.apiUrl ?? "Not configured"}
                  </p>
                  {connection.detail ? <p className="mt-1 text-xs text-destructive">{connection.detail}</p> : null}
                </div>
              </div>
              <div className="mt-5 flex justify-between">
                <Button variant="ghost" size="sm" onClick={() => setAssigning(store)}>
                  <UsersRound className="h-4 w-4" /> Assign creators
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditor(store)}>
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>;
        })}
      </div>
      {!stores.isLoading && !stores.data?.length ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No stores yet. Add your first commerce partner.
          </CardContent>
        </Card>
      ) : null}
      <StoreDialog
        key={editor?.id ?? (editor === null ? "create-store" : "closed")}
        store={editor}
        saving={save.isPending}
        onClose={() => setEditor(undefined)}
        onSave={(input) => save.mutate({ store: editor ?? undefined, input })}
      />
      <AssignmentDialog store={assigning} onClose={() => setAssigning(null)} onSaved={refresh} />
    </div>
  );
}
function StoreDialog({
  store,
  saving,
  onClose,
  onSave,
}: {
  store: Store | null | undefined;
  saving: boolean;
  onClose: () => void;
  onSave: (input: StoreInput) => void;
}) {
  const [form, setForm] = useState<StoreInput>(
    store
      ? {
          ...blank,
          name: store.name,
          ownerName: store.owner.displayName,
          ownerEmail: store.owner.email ?? "",
          platform: store.platform,
          connectionStatus: store.connectionStatus,
          category: store.category ?? "",
          logoUrl: store.logoUrl ?? "",
          shopDomain: store.shopDomain ?? "",
          appUrl: store.appUrl ?? "",
          apiUrl: store.apiUrl ?? "",
        }
      : blank,
  );
  if (store === undefined) return null;
  const field = (key: keyof StoreInput) => ({
    value: form[key] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [key]: e.target.value }),
  });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-0 bg-background p-0 shadow-2xl">
        <div className="relative overflow-hidden bg-[linear-gradient(120deg,#312e81_0%,#5b21b6_52%,#7c3aed_100%)] px-6 py-7 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_10%,rgba(255,255,255,0.22),transparent_34%)]" />
          <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10" />
          <div className="relative flex items-start gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 backdrop-blur">
              <StoreIcon className="h-6 w-6" />
            </span>
            <div>
              <DialogHeader>
                <DialogTitle className="text-xl text-white">
                  {store ? `Configure ${store.name}` : "Add a commerce partner"}
                </DialogTitle>
              </DialogHeader>
              <p className="mt-1 text-sm text-white/75">
                Set up the store workspace, owner access, and connection details.
              </p>
            </div>
          </div>
        </div>
        <form
          className="space-y-6 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
          }}
        >
          <section>
            <SectionTitle
              icon={StoreIcon}
              title="Store identity"
              subtitle="Details creators will recognize."
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Labeled label="Store name">
                <Input required placeholder="e.g. Northstar Home" {...field("name")} />
              </Labeled>
              <Labeled label="Category">
                <Input placeholder="e.g. Home & living" {...field("category")} />
              </Labeled>
              <Select
                value={form.platform}
                onValueChange={(value) =>
                  setForm({ ...form, platform: value as Store["platform"] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SHOPIFY">Shopify</SelectItem>
                  <SelectItem value="WOOCOMMERCE">WooCommerce</SelectItem>
                  <SelectItem value="CUSTOM">Custom commerce</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={form.connectionStatus}
                onValueChange={(value) =>
                  setForm({ ...form, connectionStatus: value as Store["connectionStatus"] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending setup</SelectItem>
                  <SelectItem value="CONNECTED">Connected</SelectItem>
                  <SelectItem value="DISABLED">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>
          <section className="rounded-xl border bg-muted/30 p-4">
            <SectionTitle
              icon={UserRound}
              title="Workspace owner"
              subtitle="This person signs in to the store portal."
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Labeled label="Owner name">
                <Input required placeholder="Full name" {...field("ownerName")} />
              </Labeled>
              <Labeled label="Work email">
                <Input
                  required
                  type="email"
                  placeholder="owner@store.com"
                  {...field("ownerEmail")}
                />
              </Labeled>
              <div className="sm:col-span-2">
                <Labeled label={store ? "New password (optional)" : "Temporary password"}>
                  <Input
                    required={!store}
                    type="password"
                    placeholder={
                      store ? "Leave blank to keep existing password" : "At least 12 characters"
                    }
                    {...field("password")}
                  />
                </Labeled>
              </div>
            </div>
          </section>
          <section>
            <SectionTitle
              icon={Settings2}
              title="Connection details"
              subtitle="Optional technical settings for integrations."
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {form.platform === "SHOPIFY" ? (
                <div className="sm:col-span-2">
                  <p className="mb-2 text-sm font-medium">Shopify connection method</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, shopifyConnectionMethod: "CLI_APP" })}
                      className={`rounded-xl border p-4 text-left transition ${form.shopifyConnectionMethod === "CLI_APP" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`}
                    >
                      <p className="font-semibold">Shopify CLI app</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Connect a deployed CLI app using its app URL and bridge token.
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, shopifyConnectionMethod: "ADMIN_API" })}
                      className={`rounded-xl border p-4 text-left transition ${form.shopifyConnectionMethod === "ADMIN_API" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`}
                    >
                      <p className="font-semibold">Shopify Admin API</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Connect directly with the store domain and Admin API access token.
                      </p>
                    </button>
                  </div>
                </div>
              ) : null}
              {form.platform === "SHOPIFY" && form.shopifyConnectionMethod === "CLI_APP" ? (
                <>
                  <Labeled label="Shopify store domain">
                    <Input
                      required
                      placeholder="your-store.myshopify.com"
                      {...field("shopDomain")}
                    />
                  </Labeled>
                  <div className="sm:col-span-2">
                    <Labeled label="Shopify CLI app URL">
                      <Input
                        required
                        placeholder="https://your-cli-app.example.com"
                        {...field("appUrl")}
                      />
                    </Labeled>
                  </div>
                  <div className="sm:col-span-2">
                    <Labeled label="Bridge token">
                      <Input
                        required={!store?.hasShopifyAccessToken}
                        type="password"
                        placeholder={
                          store?.hasShopifyAccessToken
                            ? "Leave blank to retain the encrypted bridge token"
                            : "Paste the CLI app bridge token"
                        }
                        {...field("shopifyAccessToken")}
                      />
                    </Labeled>
                  </div>
                </>
              ) : null}
              {form.platform === "SHOPIFY" && form.shopifyConnectionMethod === "ADMIN_API" ? (
                <>
                  <Labeled label="Shopify store domain">
                    <Input
                      required
                      placeholder="your-store.myshopify.com"
                      {...field("shopDomain")}
                    />
                  </Labeled>
                  <Labeled label="Admin API access token">
                    <Input
                      required={!store?.hasShopifyAccessToken}
                      type="password"
                      placeholder={
                        store?.hasShopifyAccessToken
                          ? "Leave blank to retain the encrypted token"
                          : "shpat_…"
                      }
                      {...field("shopifyAccessToken")}
                    />
                  </Labeled>
                </>
              ) : null}
              {form.platform !== "SHOPIFY" ? (
                <>
                  <Labeled label="Store domain">
                    <Input placeholder="store.example.com" {...field("shopDomain")} />
                  </Labeled>
                  <Labeled label="Application URL">
                    <Input placeholder="https://app.example.com" {...field("appUrl")} />
                  </Labeled>
                  <div className="sm:col-span-2">
                    <Labeled label="API URL">
                      <Input placeholder="https://api.example.com" {...field("apiUrl")} />
                    </Labeled>
                  </div>
                </>
              ) : null}
            </div>
          </section>
          <div className="flex justify-end gap-2 border-t pt-5">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={saving}>
              {saving ? "Saving…" : store ? "Save store" : "Create store"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function SectionTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof StoreIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </label>
  );
}
function AssignmentDialog({
  store,
  onClose,
  onSaved,
}: {
  store: Store | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const query = useQuery({
    queryKey: ["admin", "stores", store?.id, "assignments"],
    queryFn: () => getAssignments(store!.id),
    enabled: Boolean(store),
    onSuccess: undefined,
  });
  const mutation = useMutation({
    mutationFn: () => saveAssignments(store!.id, selected),
    onSuccess: () => {
      onSaved();
      onClose();
    },
  });
  if (!store) return null;
  const list = query.data?.influencers ?? [];
  const current = selected.length
    ? selected
    : list.filter((item) => item.assigned).map((item) => item.id);
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign creators to {store.name}</DialogTitle>
        </DialogHeader>
        <div className="max-h-80 space-y-2 overflow-auto">
          {list.map((item) => (
            <label key={item.id} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
              <input
                type="checkbox"
                checked={current.includes(item.id)}
                onChange={() =>
                  setSelected(
                    current.includes(item.id)
                      ? current.filter((id) => id !== item.id)
                      : [...current, item.id],
                  )
                }
              />
              <span>
                {item.displayName}
                <span className="ml-2 text-muted-foreground">
                  {item.instagramUsername ? `@${item.instagramUsername}` : ""}
                </span>
              </span>
            </label>
          ))}
        </div>
        <div className="flex justify-end">
          <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            Save assignments
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
