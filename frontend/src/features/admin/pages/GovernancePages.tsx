import { Blocks, FileBarChart, LifeBuoy, Settings, UserCog } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GovernanceListPage } from "./GovernanceListPage";

const data = {
  users: {
    title: "Users & roles",
    description: "Control platform access, roles and account security.",
    singular: "user",
    icon: UserCog,
    metrics: [
      { label: "Total users", value: "3,428", detail: "+146 this month" },
      { label: "Platform admins", value: "8", detail: "2 super administrators" },
      { label: "Pending invites", value: "12", detail: "Expire within 7 days" },
    ],
    columns: ["Role", "Last active", "Joined"],
    rows: [
      [
        "Ananya Sharma",
        "ananya@megainfluencer.com",
        ["Platform Admin", "5 min ago", "Mar 12, 2026"],
        "Active",
      ],
      [
        "Rohan Mehta",
        "rohan@megainfluencer.com",
        ["Finance Manager", "2 hrs ago", "Apr 08, 2026"],
        "Active",
      ],
      [
        "Sana Khan",
        "sana@megainfluencer.com",
        ["Support Agent", "—", "Invite sent Sep 12"],
        "Invited",
      ],
    ],
  },
  integrations: {
    title: "Integrations",
    description: "Configure external services, credentials and connection health.",
    singular: "integration",
    icon: Blocks,
    metrics: [
      { label: "Connected services", value: "8", detail: "7 operating normally" },
      { label: "Syncs today", value: "18,492", detail: "98.7% successful" },
      { label: "Attention needed", value: "1", detail: "Instagram sync latency" },
    ],
    columns: ["Category", "Last sync", "Health"],
    rows: [
      ["Instagram Graph API", "Social connection", ["Social", "4 min ago", "98.4%"], "Connected"],
      ["Razorpay", "Payment processing", ["Payments", "2 min ago", "99.9%"], "Connected"],
      ["Resend", "Transactional email", ["Communication", "12 min ago", "100%"], "Connected"],
    ],
  },
  support: {
    title: "Support desk",
    description: "Triage customer and partner conversations across the platform.",
    singular: "ticket",
    icon: LifeBuoy,
    metrics: [
      { label: "Open tickets", value: "42", detail: "8 need response today" },
      { label: "First response", value: "28 min", detail: "Within 1 hour target" },
      { label: "Resolved today", value: "86", detail: "94% satisfaction score" },
    ],
    columns: ["Requester", "Priority", "Updated"],
    rows: [
      [
        "#SUP-482",
        "Instagram connection unavailable",
        ["Mira Kapoor", "High", "8 min ago"],
        "Open",
      ],
      ["#SUP-481", "Commission payment question", ["Kabir Singh", "Normal", "24 min ago"], "Open"],
      ["#SUP-480", "Store product import", ["Urban Threads", "Normal", "1 hr ago"], "Resolved"],
    ],
  },
  reports: {
    title: "Reports",
    description: "Create, schedule and manage platform performance reports.",
    singular: "report",
    icon: FileBarChart,
    metrics: [
      { label: "Saved reports", value: "18", detail: "6 shared with team" },
      { label: "Scheduled reports", value: "7", detail: "Next delivery tomorrow" },
      { label: "Exports this month", value: "146", detail: "+18% from last month" },
    ],
    columns: ["Owner", "Schedule", "Last run"],
    rows: [
      [
        "Platform revenue summary",
        "Finance team",
        ["Ananya Sharma", "Monthly", "Sep 01, 2026"],
        "Ready",
      ],
      [
        "Creator campaign performance",
        "Growth team",
        ["Rohan Mehta", "Weekly", "Sep 14, 2026"],
        "Ready",
      ],
      [
        "Payout reconciliation",
        "Finance team",
        ["Ananya Sharma", "Weekly", "Sep 13, 2026"],
        "Ready",
      ],
    ],
  },
} as const;
type GovernanceKey = keyof typeof data;
function makePage(key: GovernanceKey) {
  return () => <GovernanceListPage config={data[key]} />;
}
export const UsersPage = makePage("users");
export const IntegrationsPage = makePage("integrations");
export const SupportPage = makePage("support");
export const ReportsPage = makePage("reports");

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage global platform preferences, security and operational defaults."
      />
      <section className="grid gap-6 xl:grid-cols-2">
        {[
          [
            "Platform preferences",
            "Currency, regional formats and marketplace defaults",
            ["Default currency", "Indian Rupee (INR)"],
            ["Timezone", "Asia/Kolkata"],
          ],
          [
            "Security & access",
            "Control password, session and administrator policies",
            ["Session duration", "12 hours"],
            ["Multi-factor authentication", "Required for platform admins"],
          ],
          [
            "Notifications",
            "Configure operational alerts and delivery channels",
            ["Incident alerts", "Email and Slack"],
            ["Daily digest", "Enabled"],
          ],
          [
            "Data retention",
            "Review data lifecycle and account deletion settings",
            ["Event data", "24 months"],
            ["Audit logs", "36 months"],
          ],
        ].map(([title, description, ...items]) => (
          <Card key={title as string} className="shadow-none">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" />
                    <h2 className="font-semibold">{title as string}</h2>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{description as string}</p>
                </div>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>
              <div className="mt-5 space-y-3 border-t pt-4">
                {(items as string[][]).map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="text-right font-medium">{value}</span>
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
