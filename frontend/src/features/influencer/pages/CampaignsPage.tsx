import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Search,
  Sparkles,
} from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAssignedCampaigns } from "@/features/campaigns/api/campaigns.api";

function compensation(campaign: {
  compensationType: string;
  budgetMin: number | null;
  budgetMax: number | null;
}) {
  if (campaign.compensationType === "BARTER") return "Product exchange";
  if (campaign.compensationType === "COMMISSION") return "Commission based";
  if (campaign.budgetMin && campaign.budgetMax)
    return `₹${campaign.budgetMin.toLocaleString()} – ₹${campaign.budgetMax.toLocaleString()}`;
  if (campaign.budgetMin) return `From ₹${campaign.budgetMin.toLocaleString()}`;
  return campaign.compensationType.replaceAll("_", " ");
}

export function CampaignsPage() {
  const query = useQuery({ queryKey: ["assigned-campaigns"], queryFn: getAssignedCampaigns });
  const assignments = query.data ?? [];
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="My campaigns"
        description="Campaigns you have been approved for or assigned by a store."
        actions={
          <Button asChild>
            <Link to="/influencer/discover">
              <Sparkles className="h-4 w-4" />
              Discover opportunities
            </Link>
          </Button>
        }
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Assigned campaigns"
          value={String(assignments.length)}
          hint="Ready for your review"
        />
        <Stat
          label="In progress"
          value={String(assignments.length)}
          hint="Current collaborations"
        />
        <Stat
          label="Next step"
          value={assignments.length ? "Review brief" : "Discover"}
          hint={assignments.length ? "Open a campaign to begin" : "Find your next opportunity"}
        />
      </section>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="h-11 pl-9" placeholder="Search your campaigns" />
      </div>
      <section className="grid gap-5 lg:grid-cols-2">
        {assignments.map(({ id, campaign }) => (
          <Card key={id} className="overflow-hidden shadow-card">
            <div className="relative h-32">
              <img src={campaign.imageUrl} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <Badge className="absolute bottom-3 left-4 bg-white/90 text-foreground hover:bg-white/90">
                Assigned
              </Badge>
            </div>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{campaign.organization?.name}</p>
              <h2 className="mt-1 font-display text-xl font-semibold">{campaign.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                {campaign.brief}
              </p>
              {campaign.product ? (
                <div className="mt-3 flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
                  {campaign.product.imageUrl ? (
                    <img src={campaign.product.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><FileText className="h-4 w-4" /></span>
                  )}
                  <div className="min-w-0"><p className="text-xs text-muted-foreground">Campaign product</p><p className="truncate text-sm font-semibold">{campaign.product.title}</p></div>
                </div>
              ) : null}
              <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-muted/50 p-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Deliverables</p>
                  <p className="mt-1 font-semibold">{campaign.deliverables}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Compensation</p>
                  <p className="mt-1 font-semibold">{compensation(campaign)}</p>
                </div>
              </div>
              <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                Content deadline{" "}
                {campaign.contentDeadline
                  ? new Date(campaign.contentDeadline).toLocaleDateString()
                  : "To be confirmed"}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="outline" asChild>
                  <Link to="/influencer/products">Go to products</Link>
                </Button>
                <Button asChild>
                  <Link to="/influencer/campaigns/$campaignId" params={{ campaignId: campaign.id }}>
                    Open campaign <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading your assigned campaigns…</p>
      ) : null}
      {!query.isLoading && !assignments.length ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Sparkles className="mx-auto h-7 w-7 text-primary" />
            <h2 className="mt-3 font-display text-lg font-semibold">No campaigns assigned yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Apply from Discover, or wait for a store to assign you directly.
            </p>
            <Button className="mt-5" asChild>
              <Link to="/influencer/discover">Explore opportunities</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="shadow-card">
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

export function CampaignDetailsPage({ campaignId }: { campaignId: string }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaign workspace"
        description="Review the campaign brief, deliverables, and next steps."
        actions={
          <Button variant="outline" asChild>
            <Link to="/influencer/campaigns">Back to campaigns</Link>
          </Button>
        }
      />
      <Card className="shadow-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">Campaign brief</h2>
          </div>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            This campaign has been assigned to your creator workspace. Review its full brief and
            deliverables in the campaign card, then coordinate with the store before submitting
            content.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <BriefItem label="Status" value="Assigned" />
            <BriefItem label="Campaign ID" value={campaignId} />
            <BriefItem label="Next step" value="Review brief" />
          </div>
          <Button className="mt-6">
            Mark brief reviewed <CheckCircle2 className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function BriefItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/50 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-all text-sm font-medium">{value}</p>
    </div>
  );
}
