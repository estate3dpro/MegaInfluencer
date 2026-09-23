import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronLeft, Image, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createCampaign,
  getStoreCampaign,
  updateCampaign,
  type CampaignInput,
} from "@/features/campaigns/api/campaigns.api";
import { getStoreProducts } from "@/features/store-admin/api/products.api";
const images = [
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
];
const plans = [
  ["FIXED", "Fixed pricing"],
  ["BARTER", "Barter / product"],
  ["COMMISSION", "Commission"],
  ["HYBRID", "Fixed + commission"],
  ["PERFORMANCE", "Performance / CPA"],
  ["NEGOTIABLE", "Negotiable"],
] as const;
export function CampaignCreationPage({ campaignId }: { campaignId?: string }) {
  const nav = useNavigate();
  const [image, setImage] = useState(images[0]!);
  const [plan, setPlan] = useState<CampaignInput["compensationType"]>("FIXED");
  const [saving, setSaving] = useState(false);
  const [productId, setProductId] = useState("none");
  const [error, setError] = useState("");
  const [f, setF] = useState({
    title: "",
    brief: "",
    category: "Fashion",
    campaignType: "Instagram",
    objective: "Brand Awareness",
    deliverables: "1 Reel + 2 Stories",
    deadline: "",
    amount: "",
    max: "",
    rate: "",
    product: "",
    followers: "",
    applicationType: "OPEN" as CampaignInput["applicationType"],
  });
  const campaignQuery = useQuery({
    queryKey: ["store-campaign", campaignId],
    queryFn: () => getStoreCampaign(campaignId!),
    enabled: Boolean(campaignId),
  });
  const productsQuery = useQuery({
    queryKey: ["store-products", "campaign-selector"],
    queryFn: () => getStoreProducts(1, { all: true }),
  });
  useEffect(() => {
    const campaign = campaignQuery.data;
    if (!campaign) return;
    const details = campaign.compensationDetails ?? {};
    setImage(campaign.imageUrl);
    setPlan(campaign.compensationType as CampaignInput["compensationType"]);
    setProductId(campaign.productId ?? "none");
    setF({
      title: campaign.title,
      brief: campaign.brief,
      category: campaign.category,
      campaignType: campaign.campaignType,
      objective: campaign.objective,
      deliverables: campaign.deliverables,
      deadline: campaign.applicationDeadline.slice(0, 10),
      amount: String(details.amount ?? campaign.budgetMin ?? ""),
      max: String(campaign.budgetMax ?? ""),
      rate: String(details.commissionRate ?? ""),
      product: String(details.product ?? ""),
      followers: String(campaign.minimumFollowers ?? ""),
      applicationType: campaign.applicationType ?? "OPEN",
    });
  }, [campaignQuery.data]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (f.brief.trim().length < 20) {
      setError(
        "Campaign brief must be at least 20 characters. Explain the product, goal, and creator angle.",
      );
      return;
    }
    try {
      setSaving(true);
      const input: CampaignInput = {
        title: f.title,
        brief: f.brief,
        category: f.category,
        imageUrl: image,
        campaignType: f.campaignType,
        objective: f.objective,
        deliverables: f.deliverables,
        deliverableDetails: { reel: 1, story: 2, post: 0, ugc: 0 },
        compensationType: plan,
        compensationDetails: { amount: f.amount, commissionRate: f.rate, product: f.product },
        productId: productId === "none" ? null : productId,
        minimumFollowers: f.followers ? Number(f.followers) : undefined,
        applicationType: f.applicationType,
        budgetMin: f.amount ? Number(f.amount) : undefined,
        budgetMax: f.max ? Number(f.max) : undefined,
        applicationDeadline: new Date(`${f.deadline}T23:59:59`).toISOString(),
      };
      if (campaignId) await updateCampaign({ id: campaignId, input });
      else await createCampaign(input);
      await nav({ to: "/store-admin/campaigns" });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to save the campaign. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }
  const field = (key: keyof typeof f, label: string, type = "text") => (
    <div>
      <Label>{label}</Label>
      <Input
        required={
          key === "title" || key === "deliverables" || key === "amount" || key === "deadline"
        }
        className="mt-2"
        type={type}
        value={f[key]}
        onChange={(e) => setF({ ...f, [key]: e.target.value })}
      />
    </div>
  );
  return (
    <form onSubmit={submit} className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <Button type="button" asChild variant="outline" size="icon">
            <Link to="/store-admin/campaigns">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <p className="text-sm font-medium text-primary">Campaign marketplace</p>
            <h1 className="font-display text-2xl font-semibold">
              {campaignId ? "Edit campaign" : "Create campaign"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Build a clear opportunity creators can confidently apply to.
            </p>
          </div>
        </div>
        <Button disabled={saving || campaignQuery.isLoading} type="submit">
          <Send className="h-4 w-4" />
          {saving ? "Saving…" : campaignId ? "Save changes" : "Save draft"}
        </Button>
      </div>
      {error ? (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Section title="1. Basic details">
            <div className="grid gap-4 md:grid-cols-2">
              {field("title", "Campaign title *")}
              <div>
                <Label>Category *</Label>
                <select
                  className="mt-2 h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={f.category}
                  onChange={(e) => setF({ ...f, category: e.target.value })}
                >
                  {[
                    "Fashion",
                    "Beauty",
                    "Lifestyle",
                    "Food",
                    "Travel",
                    "Fitness",
                    "Technology",
                    "Education",
                    "Gaming",
                    "Finance",
                    "Other",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Campaign type *</Label>
                <select
                  className="mt-2 h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={f.campaignType}
                  onChange={(e) => setF({ ...f, campaignType: e.target.value })}
                >
                  {["Instagram", "YouTube", "Facebook", "UGC"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Objective *</Label>
                <select
                  className="mt-2 h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={f.objective}
                  onChange={(e) => setF({ ...f, objective: e.target.value })}
                >
                  {[
                    "Sales",
                    "Brand Awareness",
                    "Product Launch",
                    "Website Traffic",
                    "Content Creation",
                    "UGC",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <Label>Campaign brief *</Label>
                <Textarea
                  required
                  minLength={20}
                  maxLength={3000}
                  className="mt-2"
                  value={f.brief}
                  onChange={(e) => setF({ ...f, brief: e.target.value })}
                  placeholder="Explain the product, story, and desired creator angle."
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {f.brief.trim().length}/20 characters minimum
                </p>
              </div>
            </div>
          </Section>
          <Section title="Campaign cover image *">
            <div className="flex flex-wrap gap-3">
              {images.map((x) => (
                <button
                  type="button"
                  onClick={() => setImage(x)}
                  key={x}
                  className={`relative h-20 w-28 overflow-hidden rounded-xl border-2 ${image === x ? "border-primary" : "border-transparent"}`}
                >
                  <img src={x} alt="Campaign cover" className="h-full w-full object-cover" />
                  {image === x ? (
                    <Check className="absolute right-2 top-2 h-4 w-4 rounded-full bg-primary p-0.5 text-white" />
                  ) : null}
                </button>
              ))}
              <label className="grid h-20 w-28 cursor-pointer place-items-center rounded-xl border border-dashed text-xs">
                <Image className="h-4 w-4" />
                Upload
                <input
                  className="hidden"
                  accept="image/png,image/jpeg,image/webp"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 3 * 1024 * 1024) {
                        setError("Choose a PNG, JPEG, or WebP image smaller than 3 MB.");
                        e.target.value = "";
                        return;
                      }
                      const r = new FileReader();
                      r.onload = () => setImage(String(r.result));
                      r.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          </Section>
          <Section title="Campaign product (optional)">
            <p className="text-sm text-muted-foreground">
              Select a store product to automatically add it to every accepted creator’s Products page.
            </p>
            <select
              className="mt-4 h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="none">No product selected</option>
              {(productsQuery.data?.products ?? []).map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} {product.price ? `— ${product.price}` : ""}
                </option>
              ))}
            </select>
            {productsQuery.isLoading ? <p className="mt-2 text-xs text-muted-foreground">Loading your product catalog…</p> : null}
            {productsQuery.isError ? <p className="mt-2 text-xs text-destructive">Products could not be loaded. You can still save this campaign without one.</p> : null}
          </Section>
          <Section title="2. Deliverables & compensation">
            <div className="grid gap-4 md:grid-cols-2">
              {field("deliverables", "Deliverables *")}
              <div>{field("deadline", "Application deadline *", "date")}</div>
            </div>
            <Label className="mt-5 block">Compensation plan *</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {plans.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPlan(id)}
                  className={`rounded-xl border p-3 text-left text-sm ${plan === id ? "border-primary bg-primary/5" : "hover:border-primary/40"}`}
                >
                  <b>{label}</b>
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {plan === "BARTER"
                ? field("product", "Product provided *")
                : field(
                    "amount",
                    plan === "COMMISSION"
                      ? "Commission rate / amount *"
                      : plan === "PERFORMANCE"
                        ? "Amount per conversion *"
                        : "Payment per creator *",
                    "number",
                  )}
              {plan === "COMMISSION" || plan === "HYBRID"
                ? field("rate", "Commission rate (%) *", "number")
                : field(
                    "max",
                    plan === "BARTER" ? "Product quantity" : "Total campaign budget",
                    "number",
                  )}
            </div>
          </Section>
          <Section title="3. Influencer requirements">
            <div className="grid gap-4 md:grid-cols-2">
              {field("followers", "Minimum followers", "number")}
              <div>
                <Label>Application type</Label>
                <select
                  className="mt-2 h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={f.applicationType}
                  onChange={(e) =>
                    setF({
                      ...f,
                      applicationType: e.target.value as CampaignInput["applicationType"],
                    })
                  }
                >
                  <option value="OPEN">Open to everyone</option>
                  <option value="APPROVAL_REQUIRED">Approval required</option>
                  <option value="INVITE_ONLY">Invite only</option>
                </select>
              </div>
            </div>
          </Section>
        </div>
        <Preview
          image={image}
          title={f.title}
          category={f.category}
          deliverables={f.deliverables}
          plan={plans.find((p) => p[0] === plan)?.[1] ?? ""}
          brief={f.brief}
        />
      </div>
    </form>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="shadow-card">
      <CardContent className="p-5">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <div className="mt-4">{children}</div>
      </CardContent>
    </Card>
  );
}
function Preview(p: {
  image: string;
  title: string;
  category: string;
  deliverables: string;
  plan: string;
  brief: string;
}) {
  return (
    <aside className="lg:sticky lg:top-6 lg:h-fit">
      <Card className="overflow-hidden shadow-card">
        <img src={p.image} alt="Campaign preview" className="h-40 w-full object-cover" />
        <CardContent className="p-5">
          <p className="text-xs font-semibold uppercase text-primary">Live preview</p>
          <h2 className="mt-2 font-display text-xl font-semibold">
            {p.title || "Your campaign title"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {p.category} · {p.plan}
          </p>
          <p className="mt-4 text-sm">{p.brief || "Your campaign brief will appear here."}</p>
          <div className="mt-4 rounded-xl bg-muted p-3 text-sm">
            <b>Deliverables</b>
            <p className="mt-1 text-muted-foreground">{p.deliverables}</p>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
