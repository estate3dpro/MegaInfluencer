import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Eye,
  Megaphone,
  Package,
  Search,
  Share2,
  Sparkles,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  applyCampaign,
  getAssignedCampaigns,
  getDiscoverCampaigns,
  type Campaign,
  type CampaignAssignment,
} from "@/features/campaigns/api/campaigns.api";

function budget(campaign: Campaign) {
  if (campaign.compensationType === "BARTER") return "🎁 Product exchange (Barter)";
  if (campaign.compensationType === "COMMISSION") return "💵 Commission based (15%)";
  if (campaign.compensationType === "HYBRID") return "⚡ Hybrid (Free sample + 15%)";
  if (campaign.budgetMin && campaign.budgetMax)
    return `₹${campaign.budgetMin.toLocaleString()} – ₹${campaign.budgetMax.toLocaleString()}`;
  if (campaign.budgetMin) return `From ₹${campaign.budgetMin.toLocaleString()}`;
  return "Budget on request";
}

export function DiscoverPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "assigned" | "discover">("all");
  const [preview, setPreview] = useState<Campaign | null>(null);
  const [applyingTo, setApplyingTo] = useState<Campaign | null>(null);
  const [pitch, setPitch] = useState("");

  const discoverQuery = useQuery({
    queryKey: ["discover-campaigns"],
    queryFn: getDiscoverCampaigns,
  });

  const assignedQuery = useQuery({
    queryKey: ["assigned-campaigns"],
    queryFn: getAssignedCampaigns,
  });

  const client = useQueryClient();
  const apply = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) => applyCampaign(id, message),
    onSuccess: () => {
      setApplyingTo(null);
      setPitch("");
      void client.invalidateQueries({ queryKey: ["discover-campaigns"] });
      void client.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const assignedList = assignedQuery.data ?? [];
  const openList = discoverQuery.data ?? [];

  const filteredAssigned = useMemo(
    () =>
      assignedList.filter((item) =>
        `${item.campaign.title} ${item.campaign.category} ${item.campaign.organization?.name ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [assignedList, search]
  );

  const filteredOpen = useMemo(
    () =>
      openList.filter((item) =>
        `${item.title} ${item.category} ${item.organization?.name ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [openList, search]
  );

  const totalAssignedCount = assignedList.length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Campaigns & Opportunities"
        description="Review campaigns you are assigned to, and explore open brand opportunities across the community."
      />

      {/* Top Welcome Banner */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shadow-card">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="font-display text-lg font-semibold">Creator Campaign Center</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Directly assigned brand campaigns appear under <b>Assigned to You</b>. Public brand opportunities appear under <b>Discover New</b>.
            </p>
          </div>
          {totalAssignedCount > 0 && (
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs px-3 py-1 font-bold">
              {totalAssignedCount} Active Assignment{totalAssignedCount === 1 ? "" : "s"}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border">
          <Button
            size="sm"
            variant={activeTab === "all" ? "default" : "ghost"}
            className="h-8 text-xs font-semibold rounded-lg"
            onClick={() => setActiveTab("all")}
          >
            All ({filteredAssigned.length + filteredOpen.length})
          </Button>
          <Button
            size="sm"
            variant={activeTab === "assigned" ? "default" : "ghost"}
            className="h-8 text-xs font-semibold rounded-lg gap-1.5"
            onClick={() => setActiveTab("assigned")}
          >
            <Zap className="h-3.5 w-3.5 text-amber-500" /> Assigned to You ({filteredAssigned.length})
          </Button>
          <Button
            size="sm"
            variant={activeTab === "discover" ? "default" : "ghost"}
            className="h-8 text-xs font-semibold rounded-lg gap-1.5"
            onClick={() => setActiveTab("discover")}
          >
            <Megaphone className="h-3.5 w-3.5 text-primary" /> Open Discover ({filteredOpen.length})
          </Button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-10 bg-card pl-9 text-xs"
            placeholder="Search brands, products, or campaigns"
          />
        </div>
      </div>

      {/* 1. ASSIGNED CAMPAIGNS SECTION */}
      {(activeTab === "all" || activeTab === "assigned") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <h2 className="text-base font-bold text-foreground">Your Active & Assigned Campaigns</h2>
            </div>
            <span className="text-xs text-muted-foreground">{filteredAssigned.length} assigned</span>
          </div>

          {filteredAssigned.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredAssigned.map((item) => (
                <AssignedOpportunity key={item.id} assignment={item} onPreview={() => setPreview(item.campaign)} />
              ))}
            </div>
          ) : activeTab === "assigned" ? (
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground text-sm">
                No active campaign assignments found. When a brand partners with you or assigns you to a campaign, it will appear here.
              </CardContent>
            </Card>
          ) : null}
        </section>
      )}

      {/* 2. OPEN DISCOVER OPPORTUNITIES SECTION */}
      {(activeTab === "all" || activeTab === "discover") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2 pt-2">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" />
              <h2 className="text-base font-bold text-foreground">Discover Open Brand Opportunities</h2>
            </div>
            <span className="text-xs text-muted-foreground">{filteredOpen.length} open</span>
          </div>

          {filteredOpen.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredOpen.map((campaign) => (
                <Opportunity
                  key={campaign.id}
                  campaign={campaign}
                  onPreview={() => setPreview(campaign)}
                  onApply={() => setApplyingTo(campaign)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground text-sm">
                No open public campaigns match your search right now.
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* Modals */}
      <CampaignPreview
        campaign={preview}
        onOpenChange={(open) => !open && setPreview(null)}
        onApply={() => {
          setPreview(null);
          setApplyingTo(preview);
        }}
      />

      <Dialog
        open={Boolean(applyingTo)}
        onOpenChange={(open) => {
          if (!open) {
            setApplyingTo(null);
            setPitch("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply to {applyingTo?.title}</DialogTitle>
            <DialogDescription>
              Introduce your audience, creative angle, and why this campaign is a good match.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={pitch}
            onChange={(event) => setPitch(event.target.value)}
            className="min-h-36"
            placeholder="I'm a strong fit because…"
          />
          {pitch.length > 0 && pitch.trim().length < 20 ? (
            <p className="text-xs text-destructive">Please write at least 20 characters.</p>
          ) : null}
          {apply.error ? (
            <p className="text-sm text-destructive">
              {apply.error instanceof Error ? apply.error.message : "Your application could not be sent."}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              disabled={apply.isPending || pitch.trim().length < 20}
              onClick={() => applyingTo && apply.mutate({ id: applyingTo.id, message: pitch.trim() })}
            >
              {apply.isPending ? "Sending…" : "Send application"}
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Assigned Opportunity Card
function AssignedOpportunity({
  assignment,
  onPreview,
}: {
  assignment: CampaignAssignment;
  onPreview: () => void;
}) {
  const campaign = assignment.campaign;
  return (
    <Card className="group overflow-hidden shadow-card border-primary/30 bg-card transition-all hover:shadow-lg">
      <div className="relative h-40 overflow-hidden bg-muted">
        <img
          src={campaign.imageUrl}
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <span className="absolute bottom-3 left-3 grid h-9 w-9 place-items-center rounded-xl bg-white/95 text-xs font-bold text-foreground shadow-sm">
          {campaign.organization?.name?.slice(0, 2).toUpperCase() || "ST"}
        </span>
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <Badge className="bg-emerald-600 text-white font-bold text-[11px] shadow-sm flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Assigned
          </Badge>
        </div>
      </div>

      <CardContent className="p-5 space-y-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{campaign.organization?.name || "Partner Store"}</p>
          <div className="mt-1 flex items-start justify-between gap-2">
            <h3 className="font-display text-base font-bold line-clamp-1 text-foreground" title={campaign.title}>
              {campaign.title}
            </h3>
            <Badge variant="outline" className="text-[10px] shrink-0">
              {campaign.category}
            </Badge>
          </div>
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{campaign.brief}</p>
        </div>

        {campaign.product && (
          <div className="flex items-center gap-2.5 rounded-xl border bg-muted/40 p-2.5">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-background border flex items-center justify-center">
              {campaign.product.imageUrl ? (
                <img src={campaign.product.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <Package className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted-foreground font-medium">Assigned Campaign Product</p>
              <p className="truncate text-xs font-bold text-foreground">{campaign.product.title}</p>
            </div>
            {campaign.product.price && (
              <p className="text-xs font-bold text-primary shrink-0">₹{campaign.product.price}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/50 p-2.5 text-xs">
          <div>
            <p className="text-[10px] text-muted-foreground">Compensation</p>
            <p className="mt-0.5 font-bold truncate text-foreground">{budget(campaign)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Deliverables</p>
            <p className="mt-0.5 font-bold truncate text-foreground">{campaign.deliverables}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button variant="outline" size="sm" className="h-8 text-xs font-medium" onClick={onPreview}>
            <Eye className="h-3.5 w-3.5 mr-1" /> Brief
          </Button>
          <Button size="sm" className="h-8 text-xs font-bold gap-1 bg-primary text-primary-foreground" asChild>
            <Link to="/influencer/products" search={{ campaignId: campaign.id, campaignTitle: campaign.title }}>
              <Share2 className="h-3.5 w-3.5" /> Product Links
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Public Discovery Opportunity Card
function Opportunity({
  campaign,
  onPreview,
  onApply,
}: {
  campaign: Campaign;
  onPreview: () => void;
  onApply: () => void;
}) {
  const applied = campaign.applications?.[0];
  return (
    <Card className="group overflow-hidden shadow-card transition-shadow hover:shadow-lg">
      <div className="relative h-40 overflow-hidden bg-muted">
        <img
          src={campaign.imageUrl}
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <span className="absolute bottom-4 left-4 grid h-10 w-10 place-items-center rounded-xl bg-white/90 text-sm font-bold text-foreground">
          {campaign.organization?.name.slice(0, 2).toUpperCase()}
        </span>
      </div>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{campaign.organization?.name}</p>
        <div className="mt-1 flex items-start justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">{campaign.title}</h2>
          <Badge variant="outline">{campaign.category}</Badge>
        </div>
        <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">{campaign.brief}</p>
        {campaign.product ? (
          <div className="mt-3 flex items-center gap-3 rounded-xl border bg-muted/35 p-3">
            <img
              src={campaign.product.imageUrl || campaign.imageUrl}
              alt=""
              className="h-11 w-11 rounded-lg object-cover"
            />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Campaign product</p>
              <p className="truncate text-sm font-semibold">{campaign.product.title}</p>
              {campaign.product.price ? <p className="text-xs text-primary">{campaign.product.price}</p> : null}
            </div>
          </div>
        ) : null}
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-muted/55 p-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Compensation</p>
            <p className="mt-1 truncate font-semibold">{budget(campaign)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Deliverables</p>
            <p className="mt-1 truncate font-semibold">{campaign.deliverables}</p>
          </div>
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          Apply by {new Date(campaign.applicationDeadline).toLocaleDateString()}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onPreview}>
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          {applied?.status === "ACCEPTED" ? (
            <Button asChild>
              <Link to="/influencer/products" search={{ campaignId: campaign.id, campaignTitle: campaign.title }}>
                Go to products <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : applied ? (
            <Button disabled variant="outline">
              {applied.status}
            </Button>
          ) : (
            <Button onClick={onApply}>
              Apply <ArrowUpRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CampaignPreview({
  campaign,
  onOpenChange,
  onApply,
}: {
  campaign: Campaign | null;
  onOpenChange: (open: boolean) => void;
  onApply: () => void;
}) {
  const application = campaign?.applications?.[0];
  return (
    <Dialog open={Boolean(campaign)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
        {campaign ? (
          <>
            <img src={campaign.imageUrl} alt="" className="h-56 w-full object-cover sm:h-64" />
            <div className="p-6 pt-2">
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2 pr-8">
                  <Badge>{campaign.category}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {campaign.organization?.name} · {campaign.campaignType}
                  </span>
                </div>
                <DialogTitle className="pt-2 font-display text-2xl">{campaign.title}</DialogTitle>
                <DialogDescription className="leading-6">{campaign.brief}</DialogDescription>
              </DialogHeader>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Detail label="Deliverables" value={campaign.deliverables} />
                <Detail label="Compensation" value={budget(campaign)} />
                <Detail label="Application deadline" value={new Date(campaign.applicationDeadline).toLocaleDateString()} />
              </div>
              {application?.status === "ACCEPTED" ? (
                <Button className="mt-5 w-full" asChild>
                  <Link to="/influencer/products" search={{ campaignId: campaign.id, campaignTitle: campaign.title }}>
                    Go to products <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : application ? (
                <Button className="mt-5 w-full" variant="outline" disabled>
                  {application.status}
                </Button>
              ) : (
                <Button className="mt-5 w-full" onClick={onApply}>
                  Apply to campaign <ArrowUpRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

