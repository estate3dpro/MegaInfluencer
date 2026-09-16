import {
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Globe2,
  Instagram,
  PackageCheck,
  Palette,
  Pencil,
  ShieldCheck,
  ShoppingBag,
  Store,
  UserRound,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const integrations = [
  {
    name: "Shopify",
    description: "Sync products, orders and inventory from your Shopify store.",
    status: "Connected",
    detail: "urban-threads.myshopify.com",
    icon: ShoppingBag,
    tone: "bg-emerald-500",
    action: "Manage",
  },
  {
    name: "Instagram",
    description: "Enable creator discovery and track Instagram campaign content.",
    status: "Connected",
    detail: "@urbanthreads",
    icon: Instagram,
    tone: "bg-gradient-to-br from-violet to-coral",
    action: "Manage",
  },
  {
    name: "Razorpay",
    description: "Accept payments and reconcile your customer transactions.",
    status: "Not connected",
    detail: "Set up your payment account",
    icon: BadgeIndian,
    tone: "bg-primary",
    action: "Connect",
  },
  {
    name: "Google Analytics",
    description: "Understand customer behaviour beyond your storefront.",
    status: "Not connected",
    detail: "Add your measurement ID",
    icon: Globe2,
    tone: "bg-teal",
    action: "Connect",
  },
];

function BadgeIndian({ className }: { className?: string }) {
  return <span className={className}>₹</span>;
}
function IntegrationCard({ integration }: { integration: (typeof integrations)[number] }) {
  const Icon = integration.icon;
  const connected = integration.status === "Connected";
  return (
    <Card className="shadow-card">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg text-sm font-bold text-white ${integration.tone}`}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display font-semibold">{integration.name}</h2>
              <Badge
                variant={connected ? "outline" : "secondary"}
                className={connected ? "border-teal/30 bg-teal/5 text-teal" : ""}
              >
                {connected && <CheckCircle2 className="mr-1 h-3 w-3" />}
                {integration.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{integration.description}</p>
            <p className="mt-3 text-xs text-muted-foreground">{integration.detail}</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end border-t pt-4">
          <Button variant={connected ? "ghost" : "outline"} size="sm">
            {integration.action} <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
function SettingRow({
  title,
  description,
  active = false,
}: {
  title: string;
  description: string;
  active?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-4 last:border-0">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch defaultChecked={active} />
    </div>
  );
}

export function StorePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Store"
        description="Manage your storefront and business details."
        actions={
          <Button>
            <ExternalLink className="h-4 w-4" /> View store
          </Button>
        }
      />
      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="shadow-card xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 p-5">
            <div>
              <CardTitle>Store details</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                The details customers and creators see.
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          </CardHeader>
          <CardContent className="grid gap-5 border-t p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Store name</Label>
              <Input className="mt-2" defaultValue="Urban Threads" />
            </div>
            <div>
              <Label>Store URL</Label>
              <Input className="mt-2" defaultValue="urbanthreads.in" />
            </div>
            <div>
              <Label>Store contact</Label>
              <Input className="mt-2" defaultValue="hello@urbanthreads.in" />
            </div>
            <div className="sm:col-span-2">
              <Label>Store description</Label>
              <textarea
                className="mt-2 min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                defaultValue="Contemporary everyday clothing, designed for easy living."
              />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Store status</p>
            <div className="mt-4 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-teal/10 text-teal">
                <Store className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-lg font-semibold">Live</p>
                <p className="text-sm text-muted-foreground">Your store is accepting orders.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3 border-t pt-5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Products published</span>
                <span className="font-medium">48</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Storefront health</span>
                <span className="font-medium text-teal">Excellent</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      <Card className="shadow-card">
        <CardHeader className="p-5">
          <CardTitle>Store preferences</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure how your store appears and operates.
          </p>
        </CardHeader>
        <CardContent className="border-t px-5">
          <SettingRow
            title="Show inventory availability"
            description="Let customers see whether a product is in stock."
            active
          />
          <SettingRow
            title="Allow creator referrals"
            description="Allow approved creators to generate links for your products."
            active
          />
          <SettingRow
            title="Enable customer reviews"
            description="Collect product feedback after fulfilment."
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations"
        description="Connect the tools that power your store operations."
      />
      <div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-primary">
        <strong>2 integrations connected.</strong> Your products and orders sync automatically from
        Shopify.
      </div>
      <section>
        <h2 className="font-display text-base font-semibold">Connected & available apps</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Bring your store, payments and marketing data together.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {integrations.map((integration) => (
            <IntegrationCard key={integration.name} integration={integration} />
          ))}
        </div>
      </section>
      <Card className="shadow-card">
        <CardContent className="flex flex-wrap items-center gap-4 p-5">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-muted-foreground">
            <PackageCheck className="h-5 w-5" />
          </span>
          <div className="min-w-60 flex-1">
            <p className="font-medium">Need a different integration?</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Tell us what you use and we’ll help you connect it.
            </p>
          </div>
          <Button variant="outline">Contact support</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account, notifications and workspace preferences."
      />
      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="shadow-card xl:col-span-2">
          <CardHeader className="p-5">
            <CardTitle>Profile</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Your store-admin account information.
            </p>
          </CardHeader>
          <CardContent className="border-t p-5">
            <div className="mb-6 flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-primary/10 font-display text-base font-semibold text-primary">
                  AS
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">Aarav Shah</p>
                <p className="text-sm text-muted-foreground">Store administrator</p>
                <Button variant="link" className="h-auto p-0 text-primary">
                  Change avatar
                </Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Full name</Label>
                <Input className="mt-2" defaultValue="Aarav Shah" />
              </div>
              <div>
                <Label>Email address</Label>
                <Input className="mt-2" defaultValue="aarav@urbanthreads.in" />
              </div>
            </div>
            <Button className="mt-5">Save changes</Button>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="p-5">
            <CardTitle>Workspace</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Urban Threads</p>
          </CardHeader>
          <CardContent className="space-y-4 border-t p-5">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
              <Palette className="h-5 w-5" />
            </span>
            <div>
              <p className="font-medium">Store admin plan</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your brand, creators and sales.
              </p>
            </div>
            <Button variant="outline" className="w-full">
              Manage workspace
            </Button>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader className="p-5">
            <CardTitle>Notifications</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose what you want to hear about.
            </p>
          </CardHeader>
          <CardContent className="border-t px-5">
            <SettingRow
              title="New order notifications"
              description="Receive an update when a customer places an order."
              active
            />
            <SettingRow
              title="Creator sales activity"
              description="Get daily updates about attributed creator orders."
              active
            />
            <SettingRow
              title="Weekly performance digest"
              description="Receive a summary of store performance every Monday."
              active
            />
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader className="p-5">
            <CardTitle>Security</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Keep your account secure.</p>
          </CardHeader>
          <CardContent className="border-t px-5">
            <div className="flex items-center gap-3 border-b py-5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal/10 text-teal">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">Password</p>
                <p className="text-sm text-muted-foreground">Last changed 3 months ago</p>
              </div>
              <Button variant="outline" size="sm">
                Change
              </Button>
            </div>
            <div className="flex items-center gap-3 py-5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <UserRound className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">Two-factor authentication</p>
                <p className="text-sm text-muted-foreground">Add an extra layer of protection.</p>
              </div>
              <Button variant="outline" size="sm">
                Set up
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
