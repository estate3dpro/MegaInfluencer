import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Eye,
  Megaphone,
  Pause,
  Pencil,
  Play,
  Plus,
  Send,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deleteCampaign,
  assignCampaignInfluencer,
  unassignCampaignInfluencer,
  decideCampaignApplication,
  getCampaignApplications,
  getCampaignInfluencers,
  getStoreCampaigns,
  publishCampaign,
  setCampaignStatus,
  type Campaign,
} from "@/features/campaigns/api/campaigns.api";

const statusStyles = {
  DRAFT: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  PUBLISHED: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  PAUSED: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  CLOSED: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  ARCHIVED: "bg-slate-100 text-slate-700 hover:bg-slate-100",
} as const;

function campaignBudget(campaign: Campaign) {
  if (campaign.compensationType === "BARTER") return "Product exchange";
  if (campaign.compensationType === "COMMISSION") return "Commission";
  if (campaign.budgetMin && campaign.budgetMax)
    return `₹${campaign.budgetMin.toLocaleString()} – ₹${campaign.budgetMax.toLocaleString()}`;
  if (campaign.budgetMin) return `From ₹${campaign.budgetMin.toLocaleString()}`;
  if (campaign.budgetMax) return `Up to ₹${campaign.budgetMax.toLocaleString()}`;
  return campaign.compensationType.replaceAll("_", " ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function CampaignMarketplacePage() {
  const client = useQueryClient();
  const [preview, setPreview] = useState<Campaign | null>(null);
  const [assigning, setAssigning] = useState<Campaign | null>(null);
  const [reviewing, setReviewing] = useState<Campaign | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Campaign | null>(null);
  const query = useQuery({ queryKey: ["store-campaigns"], queryFn: getStoreCampaigns });
  const refresh = () => client.invalidateQueries({ queryKey: ["store-campaigns"] });
  const publish = useMutation({ mutationFn: publishCampaign, onSuccess: refresh });
  const updateStatus = useMutation({ mutationFn: setCampaignStatus, onSuccess: refresh });
  const remove = useMutation({
    mutationFn: deleteCampaign,
    onSuccess: () => {
      setPendingDelete(null);
      void refresh();
    },
  });
  const campaigns = query.data ?? [];
  const activeCount = campaigns.filter((campaign) => campaign.status === "PUBLISHED").length;
  const applicationCount = campaigns.reduce(
    (total, campaign) => total + (campaign._count?.applications ?? 0),
    0,
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Campaigns"
        description="Create, manage, and monitor opportunities for your creator community."
        actions={
          <Button asChild>
            <Link to="/store-admin/campaigns/new">
              <Plus className="h-4 w-4" />
              Create campaign
            </Link>
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <Summary label="All campaigns" value={campaigns.length} icon={Megaphone} />
        <Summary label="Live campaigns" value={activeCount} icon={Play} tone="text-emerald-600" />
        <Summary
          label="Creator applications"
          value={applicationCount}
          icon={Users}
          tone="text-primary"
        />
      </section>

      {query.isLoading ? <CampaignGridSkeleton /> : null}
      {!query.isLoading && campaigns.length ? (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              busy={publish.isPending || updateStatus.isPending || remove.isPending}
              onPreview={() => setPreview(campaign)}
              onAssign={() => setAssigning(campaign)}
              onReview={() => setReviewing(campaign)}
              onDelete={() => setPendingDelete(campaign)}
              onPublish={() => publish.mutate(campaign.id)}
              onPause={() => updateStatus.mutate({ id: campaign.id, status: "PAUSED" })}
              onActivate={() => updateStatus.mutate({ id: campaign.id, status: "PUBLISHED" })}
            />
          ))}
        </section>
      ) : null}
      {!query.isLoading && !campaigns.length ? <EmptyState /> : null}

      <CampaignPreview campaign={preview} onOpenChange={(open) => !open && setPreview(null)} />
      <CreatorAssignmentDialog
        campaign={assigning}
        onOpenChange={(open) => !open && setAssigning(null)}
      />
      <ApplicationReviewDialog
        campaign={reviewing}
        onOpenChange={(open) => !open && setReviewing(null)}
      />
      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              “{pendingDelete?.title}” will no longer appear in your workspace or creator Discover.
              Its data is retained safely for audit purposes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={remove.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (pendingDelete) remove.mutate(pendingDelete.id);
              }}
            >
              {remove.isPending ? "Deleting…" : "Delete campaign"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Summary({
  label,
  value,
  icon: Icon,
  tone = "text-foreground",
}: {
  label: string;
  value: number;
  icon: typeof Megaphone;
  tone?: string;
}) {
  return (
    <Card className="shadow-card">
      <CardContent className="flex items-center gap-3 p-4">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className={`mt-0.5 text-2xl font-semibold ${tone}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function CampaignCard({
  campaign,
  busy,
  onPreview,
  onAssign,
  onReview,
  onDelete,
  onPublish,
  onPause,
  onActivate,
}: {
  campaign: Campaign;
  busy: boolean;
  onPreview: () => void;
  onAssign: () => void;
  onReview: () => void;
  onDelete: () => void;
  onPublish: () => void;
  onPause: () => void;
  onActivate: () => void;
}) {
  const canManageStatus =
    campaign.status === "DRAFT" || campaign.status === "PUBLISHED" || campaign.status === "PAUSED";
  return (
    <Card className="group overflow-hidden shadow-card transition-shadow hover:shadow-lg">
      <div className="relative h-36 overflow-hidden bg-muted">
        <img
          src={campaign.imageUrl}
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
        <Badge className={`absolute left-4 top-4 border-0 ${statusStyles[campaign.status]}`}>
          {campaign.status}
        </Badge>
        <span className="absolute bottom-3 left-4 rounded-md bg-black/45 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {campaign.category}
        </span>
      </div>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg font-semibold">{campaign.title}</h2>
            <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
              {campaign.brief}
            </p>
          </div>
          <Megaphone className="h-5 w-5 shrink-0 text-primary" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-muted/60 p-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Compensation</p>
            <p className="mt-1 truncate font-medium" title={campaignBudget(campaign)}>
              {campaignBudget(campaign)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Deliverables</p>
            <p className="mt-1 truncate font-medium" title={campaign.deliverables}>
              {campaign.deliverables}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            Closes {formatDate(campaign.applicationDeadline)}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {campaign._count?.applications ?? 0} applied
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-4">
          <Button variant="outline" size="sm" onClick={onPreview}>
            <Eye className="h-3.5 w-3.5" /> <span className="sr-only sm:not-sr-only">Preview</span>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/store-admin/campaigns/$campaignId/edit" params={{ campaignId: campaign.id }}>
              <Pencil className="h-3.5 w-3.5" />{" "}
              <span className="sr-only sm:not-sr-only">Edit</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
            disabled={busy}
          >
            <Trash2 className="h-3.5 w-3.5" />{" "}
            <span className="sr-only sm:not-sr-only">Delete</span>
          </Button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={onAssign} disabled={busy}>
            <UserPlus className="h-3.5 w-3.5" /> Assign creator
          </Button>
          <Button variant="outline" size="sm" onClick={onReview} disabled={busy}>
            <Users className="h-3.5 w-3.5" /> Review ({campaign._count?.applications ?? 0})
          </Button>
        </div>
        {canManageStatus ? (
          <Button
            className="mt-2 w-full"
            size="sm"
            variant={campaign.status === "PUBLISHED" ? "outline" : "default"}
            disabled={busy}
            onClick={
              campaign.status === "DRAFT"
                ? onPublish
                : campaign.status === "PUBLISHED"
                  ? onPause
                  : onActivate
            }
          >
            {campaign.status === "DRAFT" ? (
              <Send className="h-3.5 w-3.5" />
            ) : campaign.status === "PUBLISHED" ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {campaign.status === "DRAFT"
              ? "Publish campaign"
              : campaign.status === "PUBLISHED"
                ? "Set inactive"
                : "Set active"}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function CampaignPreview({
  campaign,
  onOpenChange,
}: {
  campaign: Campaign | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(campaign)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
        {campaign ? (
          <>
            <img src={campaign.imageUrl} alt="" className="h-56 w-full object-cover sm:h-64" />
            <div className="p-6 pt-2">
              <DialogHeader>
                <div className="flex items-center gap-2 pr-8">
                  <Badge className={`border-0 ${statusStyles[campaign.status]}`}>
                    {campaign.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {campaign.category} · {campaign.campaignType}
                  </span>
                </div>
                <DialogTitle className="pt-2 font-display text-2xl">{campaign.title}</DialogTitle>
                <DialogDescription className="leading-6">{campaign.brief}</DialogDescription>
              </DialogHeader>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <PreviewDetail label="Deliverables" value={campaign.deliverables} />
                <PreviewDetail label="Compensation" value={campaignBudget(campaign)} />
                <PreviewDetail label="Apply by" value={formatDate(campaign.applicationDeadline)} />
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CreatorAssignmentDialog({
  campaign,
  onOpenChange,
}: {
  campaign: Campaign | null;
  onOpenChange: (open: boolean) => void;
}) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["campaign-influencers", campaign?.id],
    queryFn: () => getCampaignInfluencers(campaign!.id),
    enabled: Boolean(campaign),
  });
  const assign = useMutation({
    mutationFn: assignCampaignInfluencer,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["campaign-influencers", campaign?.id] });
      void client.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
  const unassign = useMutation({
    mutationFn: unassignCampaignInfluencer,
    onSuccess: () =>
      void client.invalidateQueries({ queryKey: ["campaign-influencers", campaign?.id] }),
  });
  return (
    <Dialog open={Boolean(campaign)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign a creator</DialogTitle>
          <DialogDescription>
            Assigning a creator gives them immediate access to this campaign in their workspace.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg bg-muted p-3 text-sm">
          <span className="text-muted-foreground">Campaign: </span>
          <span className="font-medium">{campaign?.title}</span>
        </div>
        <div className="divide-y rounded-xl border">
          {query.data?.map((influencer) => (
            <div key={influencer.id} className="flex items-center gap-3 p-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {influencer.displayName.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{influencer.displayName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {influencer.instagramUsername
                    ? `@${influencer.instagramUsername}`
                    : (influencer.email ?? "No connected Instagram")}
                </p>
              </div>
              <Button
                size="sm"
                variant={influencer.assigned ? "outline" : "default"}
                disabled={assign.isPending || unassign.isPending}
                onClick={() =>
                  campaign &&
                  (influencer.assigned
                    ? unassign.mutate({ campaignId: campaign.id, influencerId: influencer.id })
                    : assign.mutate({ campaignId: campaign.id, influencerId: influencer.id }))
                }
              >
                {influencer.assigned ? "Unassign" : "Assign"}
              </Button>
            </div>
          ))}
          {query.isLoading ? (
            <p className="p-5 text-sm text-muted-foreground">Loading creators…</p>
          ) : null}
          {!query.isLoading && !query.data?.length ? (
            <p className="p-5 text-sm text-muted-foreground">
              No active influencer accounts are available yet.
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ApplicationReviewDialog({
  campaign,
  onOpenChange,
}: {
  campaign: Campaign | null;
  onOpenChange: (open: boolean) => void;
}) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["campaign-applications", campaign?.id],
    queryFn: () => getCampaignApplications(campaign!.id),
    enabled: Boolean(campaign),
  });
  const decide = useMutation({
    mutationFn: decideCampaignApplication,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["campaign-applications", campaign?.id] });
      void client.invalidateQueries({ queryKey: ["store-campaigns"] });
      void client.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
  return (
    <Dialog open={Boolean(campaign)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review applications</DialogTitle>
          <DialogDescription>
            Accepting an application assigns that creator and sends them a campaign notification.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {query.data?.map((application) => (
            <div key={application.id} className="rounded-xl border p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium">{application.influencer.displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {application.influencer.instagramConnection?.username
                      ? `@${application.influencer.instagramConnection.username}`
                      : application.influencer.email}
                  </p>
                </div>
                <Badge variant={application.status === "PENDING" ? "outline" : "secondary"}>
                  {application.status}
                </Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{application.pitch}</p>
              {application.status === "PENDING" ? (
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    disabled={decide.isPending}
                    onClick={() =>
                      campaign &&
                      decide.mutate({
                        campaignId: campaign.id,
                        applicationId: application.id,
                        decision: "accept",
                      })
                    }
                  >
                    Approve & assign
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={decide.isPending}
                    onClick={() =>
                      campaign &&
                      decide.mutate({
                        campaignId: campaign.id,
                        applicationId: application.id,
                        decision: "decline",
                      })
                    }
                  >
                    Decline
                  </Button>
                </div>
              ) : null}
              {application.status === "ACCEPTED" ? (
                <Button asChild size="sm" variant="outline" className="mt-4">
                  <Link to="/store-admin/products">Go to products</Link>
                </Button>
              ) : null}
            </div>
          ))}
          {query.isLoading ? (
            <p className="p-5 text-sm text-muted-foreground">Loading applications…</p>
          ) : null}
          {!query.isLoading && !query.data?.length ? (
            <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No creator applications yet.
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PreviewDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function CampaignGridSkeleton() {
  return (
    <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <Card key={index} className="overflow-hidden">
          <div className="h-36 animate-pulse bg-muted" />
          <CardContent className="space-y-3 p-5">
            <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-10 animate-pulse rounded bg-muted" />
            <div className="h-20 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed shadow-none">
      <CardContent className="grid place-items-center p-12 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
          <Megaphone className="h-6 w-6" />
        </span>
        <h2 className="mt-4 font-display text-lg font-semibold">Your marketplace is ready</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Create a campaign and publish it when it is ready for creators to discover.
        </p>
        <Button className="mt-5" asChild>
          <Link to="/store-admin/campaigns/new">
            <Plus className="h-4 w-4" />
            Create campaign
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
