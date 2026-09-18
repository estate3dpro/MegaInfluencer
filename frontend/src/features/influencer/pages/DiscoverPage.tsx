import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, CalendarDays, Eye, Search, Sparkles } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/app/PageHeader";
import { applyCampaign, getDiscoverCampaigns, type Campaign } from "@/features/campaigns/api/campaigns.api";

function budget(campaign: Campaign) {
  if (campaign.compensationType === "BARTER") return "Product exchange";
  if (campaign.compensationType === "COMMISSION") return "Commission based";
  if (campaign.budgetMin && campaign.budgetMax) return `₹${campaign.budgetMin.toLocaleString()} – ₹${campaign.budgetMax.toLocaleString()}`;
  if (campaign.budgetMin) return `From ₹${campaign.budgetMin.toLocaleString()}`;
  return "Budget on request";
}

export function DiscoverPage() {
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<Campaign | null>(null);
  const [applyingTo, setApplyingTo] = useState<Campaign | null>(null);
  const [pitch, setPitch] = useState("");
  const query = useQuery({ queryKey: ["discover-campaigns"], queryFn: getDiscoverCampaigns });
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
  const campaigns = useMemo(() => (query.data ?? []).filter((campaign) => `${campaign.title} ${campaign.category} ${campaign.organization?.name ?? ""}`.toLowerCase().includes(search.toLowerCase())), [query.data, search]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Discover opportunities" description="Explore public campaigns, review every brief, and apply when you are a strong fit." />
      <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shadow-card"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><Sparkles className="h-5 w-5" /></span><div><p className="font-display text-lg font-semibold">Opportunities matched to creators</p><p className="mt-1 text-sm text-muted-foreground">Review a campaign before applying. Brands are notified as soon as you send your request.</p></div></CardContent></Card>
      <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="h-11 bg-card pl-9" placeholder="Search brands, categories, or campaigns" /></div>
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {campaigns.map((campaign) => <Opportunity key={campaign.id} campaign={campaign} onPreview={() => setPreview(campaign)} onApply={() => setApplyingTo(campaign)} />)}
      </section>
      {query.isLoading ? <p className="text-sm text-muted-foreground">Loading campaign opportunities…</p> : null}
      {!query.isLoading && !campaigns.length ? <Card><CardContent className="p-10 text-center text-muted-foreground">No open campaigns are available right now.</CardContent></Card> : null}

      <CampaignPreview campaign={preview} onOpenChange={(open) => !open && setPreview(null)} onApply={() => { setPreview(null); setApplyingTo(preview); }} />
      <Dialog open={Boolean(applyingTo)} onOpenChange={(open) => { if (!open) { setApplyingTo(null); setPitch(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Apply to {applyingTo?.title}</DialogTitle><DialogDescription>Introduce your audience, creative angle, and why this campaign is a good match. The store reviews every application before assigning creators.</DialogDescription></DialogHeader>
          <Textarea value={pitch} onChange={(event) => setPitch(event.target.value)} className="min-h-36" placeholder="I’m a strong fit because…" />
          {pitch.length > 0 && pitch.trim().length < 20 ? <p className="text-xs text-destructive">Please write at least 20 characters.</p> : null}
          {apply.error ? <p className="text-sm text-destructive">{apply.error instanceof Error ? apply.error.message : "Your application could not be sent."}</p> : null}
          <DialogFooter><Button disabled={apply.isPending || pitch.trim().length < 20} onClick={() => applyingTo && apply.mutate({ id: applyingTo.id, message: pitch.trim() })}>{apply.isPending ? "Sending…" : "Send application"}<ArrowUpRight className="h-4 w-4" /></Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Opportunity({ campaign, onPreview, onApply }: { campaign: Campaign; onPreview: () => void; onApply: () => void }) {
  const applied = campaign.applications?.[0];
  return <Card className="group overflow-hidden shadow-card transition-shadow hover:shadow-lg"><div className="relative h-40 overflow-hidden bg-muted"><img src={campaign.imageUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" /><div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" /><span className="absolute bottom-4 left-4 grid h-10 w-10 place-items-center rounded-xl bg-white/90 text-sm font-bold text-foreground">{campaign.organization?.name.slice(0, 2).toUpperCase()}</span></div><CardContent className="p-5"><p className="text-sm text-muted-foreground">{campaign.organization?.name}</p><div className="mt-1 flex items-start justify-between gap-3"><h2 className="font-display text-lg font-semibold">{campaign.title}</h2><Badge variant="outline">{campaign.category}</Badge></div><p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">{campaign.brief}</p><div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-muted/55 p-3 text-sm"><div><p className="text-xs text-muted-foreground">Compensation</p><p className="mt-1 truncate font-semibold">{budget(campaign)}</p></div><div><p className="text-xs text-muted-foreground">Deliverables</p><p className="mt-1 truncate font-semibold">{campaign.deliverables}</p></div></div><p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />Apply by {new Date(campaign.applicationDeadline).toLocaleDateString()}</p><div className="mt-4 grid grid-cols-2 gap-2"><Button variant="outline" onClick={onPreview}><Eye className="h-4 w-4" />Preview</Button>{applied ? <Button disabled variant="outline">{applied.status}</Button> : <Button onClick={onApply}>Apply <ArrowUpRight className="h-4 w-4" /></Button>}</div></CardContent></Card>;
}

function CampaignPreview({ campaign, onOpenChange, onApply }: { campaign: Campaign | null; onOpenChange: (open: boolean) => void; onApply: () => void }) {
  return <Dialog open={Boolean(campaign)} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">{campaign ? <><img src={campaign.imageUrl} alt="" className="h-56 w-full object-cover sm:h-64" /><div className="p-6 pt-2"><DialogHeader><div className="flex flex-wrap items-center gap-2 pr-8"><Badge>{campaign.category}</Badge><span className="text-sm text-muted-foreground">{campaign.organization?.name} · {campaign.campaignType}</span></div><DialogTitle className="pt-2 font-display text-2xl">{campaign.title}</DialogTitle><DialogDescription className="leading-6">{campaign.brief}</DialogDescription></DialogHeader><div className="mt-5 grid gap-3 sm:grid-cols-3"><Detail label="Deliverables" value={campaign.deliverables} /><Detail label="Compensation" value={budget(campaign)} /><Detail label="Application deadline" value={new Date(campaign.applicationDeadline).toLocaleDateString()} /></div>{campaign.applications?.[0] ? <Button className="mt-5 w-full" variant="outline" disabled>{campaign.applications[0].status}</Button> : <Button className="mt-5 w-full" onClick={onApply}>Apply to campaign <ArrowUpRight className="h-4 w-4" /></Button>}</div></> : null}</DialogContent></Dialog>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-muted p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>; }
