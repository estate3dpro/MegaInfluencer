import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Blocks,
  CheckCircle2,
  Download,
  FileBarChart,
  LifeBuoy,
  Search,
  Settings,
  ShieldCheck,
  Store,
  UserCog,
  UsersRound,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getAdminDashboard, getAdminOrders, getAdminUsers } from "../api/overview.api";

function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join(
      "\n"
    );
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// -------------------------------------------------------------
// 1. USERS & ROLES PAGE
// -------------------------------------------------------------
export function UsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const query = useQuery({
    queryKey: ["admin", "users", search, roleFilter],
    queryFn: () => getAdminUsers({ search, role: roleFilter }),
  });

  const users = query.data?.users ?? [];
  const metrics = query.data?.metrics ?? {
    totalUsers: 0,
    totalAdmins: 0,
    totalStores: 0,
    totalInfluencers: 0,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Users & Access Control"
        description="Manage accounts, user roles, security policies, and authentication status across the platform."
      />

      <section className="grid gap-4 sm:grid-cols-4">
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Total Accounts</p>
            <p className="mt-2 text-2xl font-bold">{metrics.totalUsers}</p>
            <p className="mt-1 text-xs text-muted-foreground">All registered users</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Platform Admins</p>
            <p className="mt-2 text-2xl font-bold text-primary">{metrics.totalAdmins}</p>
            <p className="mt-1 text-xs text-muted-foreground">Super administrators</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Store Merchants</p>
            <p className="mt-2 text-2xl font-bold text-teal">{metrics.totalStores}</p>
            <p className="mt-1 text-xs text-muted-foreground">Brand store owners</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Creator Influencers</p>
            <p className="mt-2 text-2xl font-bold text-coral">{metrics.totalInfluencers}</p>
            <p className="mt-1 text-xs text-muted-foreground">Verified creators</p>
          </CardContent>
        </Card>
      </section>

      <Card className="shadow-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div className="relative min-w-64 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9 h-9"
              placeholder="Search user by name, email, or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex rounded-lg border bg-muted/30 p-0.5">
            {(
              [
                { id: "ALL", label: "All" },
                { id: "ADMIN", label: "Admins" },
                { id: "STORE_OWNER", label: "Store Owners" },
                { id: "INFLUENCER", label: "Influencers" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setRoleFilter(t.id)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                  roleFilter === t.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-y bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">User Profile</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Associated Store / Handle</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Registered Date</th>
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
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                    No users found matching criteria.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-muted/15 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={
                          user.role === "ADMIN"
                            ? "default"
                            : user.role === "STORE_OWNER"
                            ? "outline"
                            : "secondary"
                        }
                        className={
                          user.role === "ADMIN"
                            ? "bg-primary text-primary-foreground text-xs"
                            : user.role === "STORE_OWNER"
                            ? "border-teal/30 bg-teal/5 text-teal text-xs"
                            : "text-xs"
                        }
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {user.storeName ? (
                        <span className="font-medium text-foreground">{user.storeName}</span>
                      ) : user.instagramUsername ? (
                        <span className="font-medium text-pink-600 dark:text-pink-400">
                          @{user.instagramUsername}
                        </span>
                      ) : user.creatorCode ? (
                        <span className="font-mono text-primary font-semibold">@{user.creatorCode}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={user.status === "ACTIVE" ? "outline" : "secondary"}
                        className={user.status === "ACTIVE" ? "border-teal/30 bg-teal/5 text-teal text-xs" : "text-xs"}
                      >
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(
                        new Date(user.createdAt)
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// -------------------------------------------------------------
// 2. INTEGRATIONS PAGE
// -------------------------------------------------------------
export function IntegrationsPage() {
  const integrations = [
    {
      name: "Shopify Webhook Bridge",
      category: "E-Commerce",
      description: "Real-time order synchronization, refunds, and creator attribution tags.",
      status: "Connected",
      uptime: "99.99%",
      lastSync: "Just now",
    },
    {
      name: "Instagram Graph API",
      category: "Social",
      description: "OAuth token exchanges, story mentions, and DM automation webhooks.",
      status: "Connected",
      uptime: "99.4%",
      lastSync: "3 min ago",
    },
    {
      name: "PostgreSQL Prisma DB",
      category: "Database",
      description: "Primary transactional data store with multi-tenant isolation.",
      status: "Connected",
      uptime: "100%",
      lastSync: "Continuous",
    },
    {
      name: "Transactional Notification Engine",
      category: "Notifications",
      description: "In-app alerts and email deliverability services.",
      status: "Connected",
      uptime: "100%",
      lastSync: "12 min ago",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Integrations & Webhook Services"
        description="Monitor upstream API connectors, webhook listeners, and third-party infrastructure status."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {integrations.map((item) => (
          <Card key={item.name} className="shadow-card">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Blocks className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">{item.name}</h3>
                  </div>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {item.category}
                  </Badge>
                </div>
                <Badge variant="outline" className="border-teal/30 bg-teal/5 text-teal text-xs font-medium">
                  {item.status}
                </Badge>
              </div>
              <p className="mt-3 text-xs text-muted-foreground leading-5">{item.description}</p>
              <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                <span>Availability: {item.uptime}</span>
                <span>Last heartbeat: {item.lastSync}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 3. SUPPORT DESK PAGE
// -------------------------------------------------------------
export function SupportPage() {
  const tickets = [
    {
      id: "SUP-104",
      subject: "Instagram webhook reconnection request",
      requester: "Mira Kapoor (@mirastyles)",
      priority: "High",
      status: "Open",
      updated: "14 min ago",
    },
    {
      id: "SUP-103",
      subject: "Custom tracking link domain alias inquiry",
      requester: "Urban Threads Admin",
      priority: "Normal",
      status: "In Progress",
      updated: "1 hr ago",
    },
    {
      id: "SUP-102",
      subject: "Product inventory sync latency check",
      requester: "Northstar Home",
      priority: "Low",
      status: "Resolved",
      updated: "Yesterday",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Support & Helpdesk"
        description="Triage support requests and account inquiries from brand merchants and influencer creators."
      />

      <Card className="shadow-card overflow-hidden">
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-y bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Ticket</th>
                <th className="px-5 py-3 font-medium">Requester</th>
                <th className="px-5 py-3 font-medium">Priority</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-muted/15 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-foreground font-mono text-xs">{t.id}</p>
                    <p className="text-xs text-muted-foreground">{t.subject}</p>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-foreground font-medium">{t.requester}</td>
                  <td className="px-5 py-3.5">
                    <Badge
                      variant={t.priority === "High" ? "default" : "secondary"}
                      className={t.priority === "High" ? "bg-amber-500 text-white text-xs" : "text-xs"}
                    >
                      {t.priority}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge
                      variant={t.status === "Resolved" ? "outline" : "secondary"}
                      className={t.status === "Resolved" ? "border-teal/30 bg-teal/5 text-teal text-xs" : "text-xs"}
                    >
                      {t.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-right text-xs text-muted-foreground">{t.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// -------------------------------------------------------------
// 4. REPORTS PAGE (Platform-wide)
// -------------------------------------------------------------
export function ReportsPage() {
  const dashQuery = useQuery({ queryKey: ["admin", "dashboard"], queryFn: getAdminDashboard });
  const metrics = dashQuery.data?.metrics ?? { platformGMV: 0, totalOrdersCount: 0, totalInfluencers: 0 };

  const handleExportPlatformOrders = async () => {
    try {
      const data = await getAdminOrders();
      const headers = ["Order ID", "Name", "Store", "Customer", "Total", "Financial Status", "Creator Attribution", "Date"];
      const rows = data.orders.map((o) => [o.id, o.name, o.storeName, o.customerEmail, o.total, o.financialStatus, o.creatorName ?? o.creatorCode ?? "Direct", o.processedAt]);
      downloadCSV(`platform_all_orders_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
      toast.success("Platform orders CSV exported");
    } catch {
      toast.error("Export failed");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Reports & Data Exports"
        description="Generate platform-wide analytical statements, multi-tenant reconciliations, and audit reports."
      />

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-card">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2">
                <FileBarChart className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Global Orders & Attribution Ledger</h3>
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-5">
                Complete cross-store ledger covering ₹{metrics.platformGMV.toLocaleString()} in GMV across {metrics.totalOrdersCount} orders.
              </p>
            </div>
            <Button onClick={handleExportPlatformOrders} className="mt-4 w-fit" size="sm">
              <Download className="h-4 w-4 mr-1" /> Export Platform Orders CSV
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2">
                <UsersRound className="h-5 w-5 text-teal" />
                <h3 className="font-semibold text-foreground">Creator Performance & Commission Audit</h3>
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-5">
                Aggregated performance metrics for {metrics.totalInfluencers} registered influencer partners.
              </p>
            </div>
            <Button asChild variant="outline" className="mt-4 w-fit" size="sm">
              <a href="/admin/commissions">View Commission Payouts</a>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// -------------------------------------------------------------
// 5. SETTINGS PAGE
// -------------------------------------------------------------
export function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Global Platform Settings"
        description="Manage system-wide defaults, security controls, webhook secrets, and regional preferences."
      />

      <section className="grid gap-6 xl:grid-cols-2">
        {[
          [
            "Platform Currency & Region",
            "Base transactional currency and timezone configurations",
            ["Default Currency", "Indian Rupee (INR)"],
            ["Timezone", "Asia/Kolkata (IST)"],
            ["Tax Calculation", "Shopify Native Multi-Store"],
          ],
          [
            "Security & Authentication",
            "Multi-factor authentication and token lifecycle policies",
            ["Session Duration", "12 Hours"],
            ["Admin Access Policy", "MFA Mandatory for Role: ADMIN"],
            ["Password Hash Algorithm", "Argon2id"],
          ],
          [
            "Webhook & Automation Listeners",
            "Shopify HMAC signature verification and Meta Graph tokens",
            ["Shopify Webhook Signature", "HMAC-SHA256 Active"],
            ["Instagram Automation Endpoint", "/api/v1/webhooks/instagram Active"],
          ],
          [
            "Data Retention & Compliance",
            "Event logs lifecycle and audit storage duration",
            ["Transaction Records", "7 Years Financial Audit"],
            ["Affiliate Click Tracking", "12 Months Retention"],
          ],
        ].map(([title, description, ...items]) => (
          <Card key={title as string} className="shadow-card">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" />
                    <h2 className="font-semibold text-foreground">{title as string}</h2>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{description as string}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2.5 border-t pt-3">
                {(items as string[][]).map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
