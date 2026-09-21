import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  BadgeIndianRupee,
  ChevronRight,
  Copy,
  ExternalLink,
  Link2,
  Megaphone,
  Plus,
  Search,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getStoreCreators } from "../api/creators.api";
import { getStoreProducts } from "../api/products.api";
import { createAffiliateLink, getAffiliateLinks, updateAffiliateLink } from "../api/affiliate-links.api";

const creators = [
  {
    name: "Meera Kapoor",
    handle: "@meerastyles",
    audience: "124K",
    sales: "₹18,420",
    orders: 28,
    commission: "₹1,842",
    status: "Active",
    tone: "bg-coral/15 text-coral",
  },
  {
    name: "Aditi Nair",
    handle: "@aditiedits",
    audience: "87K",
    sales: "₹12,840",
    orders: 19,
    commission: "₹1,284",
    status: "Active",
    tone: "bg-primary/15 text-primary",
  },
  {
    name: "Kabir Singh",
    handle: "@kabirwears",
    audience: "62K",
    sales: "₹9,760",
    orders: 14,
    commission: "₹976",
    status: "Active",
    tone: "bg-teal/15 text-teal",
  },
  {
    name: "Tanya Bhatia",
    handle: "@tanyatries",
    audience: "45K",
    sales: "₹6,420",
    orders: 9,
    commission: "₹642",
    status: "Invited",
    tone: "bg-indigo/15 text-indigo",
  },
];
const campaigns = [
  {
    title: "Festive Edit Launch",
    creators: 12,
    budget: "₹48,000",
    sales: "₹1,24,680",
    status: "Live",
    end: "Ends Sep 28",
  },
  {
    title: "Linen Days",
    creators: 8,
    budget: "₹30,000",
    sales: "₹72,340",
    status: "Live",
    end: "Ends Oct 04",
  },
  {
    title: "Monsoon Essentials",
    creators: 15,
    budget: "₹60,000",
    sales: "₹1,48,290",
    status: "Completed",
    end: "Ended Sep 08",
  },
  {
    title: "New Creator Welcome",
    creators: 6,
    budget: "₹15,000",
    sales: "—",
    status: "Draft",
    end: "Not scheduled",
  },
];
const commissions = [
  {
    creator: "Meera Kapoor",
    order: "#UT-10482",
    sale: "₹3,498",
    rate: "10%",
    amount: "₹350",
    status: "Pending",
    date: "Today",
  },
  {
    creator: "Aditi Nair",
    order: "#UT-10480",
    sale: "₹5,247",
    rate: "10%",
    amount: "₹525",
    status: "Pending",
    date: "Yesterday",
  },
  {
    creator: "Kabir Singh",
    order: "#UT-10475",
    sale: "₹2,499",
    rate: "10%",
    amount: "₹250",
    status: "Approved",
    date: "Sep 12",
  },
  {
    creator: "Meera Kapoor",
    order: "#UT-10469",
    sale: "₹1,899",
    rate: "10%",
    amount: "₹190",
    status: "Paid",
    date: "Sep 09",
  },
];

function SearchBox({ placeholder }: { placeholder: string }) {
  return (
    <div className="relative min-w-60 flex-1">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input className="pl-9" placeholder={placeholder} />
    </div>
  );
}
function Avatar({ name, tone }: { name: string; tone: string }) {
  return (
    <span
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-semibold ${tone}`}
    >
      {name
        .split(" ")
        .map((part) => part[0])
        .join("")}
    </span>
  );
}
function Summary({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof Sparkles;
}) {
  return (
    <Card className="shadow-card">
      <CardContent className="flex items-center gap-3 p-5">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-display text-xl font-semibold">{value}</p>
          <p className="text-xs text-muted-foreground">{note}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function CreatorsPage() {
  const query = useQuery({ queryKey: ["store", "creators"], queryFn: getStoreCreators });
  const assignedCreators = query.data ?? [];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Creators"
        description="Build relationships with creators who grow your brand."
        actions={
          <Button>
            <Plus className="h-4 w-4" /> Invite creator
          </Button>
        }
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <Summary label="Assigned creators" value={String(assignedCreators.length)} note="Available to this store" icon={UsersRound} />
        <Summary
          label="Creator sales"
          value="₹52,680"
          note="28.6% of store sales"
          icon={BadgeIndianRupee}
        />
        <Summary
          label="Avg. creator conversion"
          value="3.8%"
          note="Across all creator links"
          icon={Sparkles}
        />
      </section>
      <div className="flex flex-wrap gap-3">
        <SearchBox placeholder="Search creators" />
        <Button variant="outline">All creators</Button>
        <Button variant="outline">Top performers</Button>
      </div>
      <Card className="shadow-card">
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-y bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Creator</th>
                <th className="px-5 py-3 font-medium">Audience</th>
                <th className="px-5 py-3 font-medium">Attributed sales</th>
                <th className="px-5 py-3 font-medium">Orders</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {assignedCreators.map((creator) => (
                <tr key={creator.id} className="border-b last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={creator.displayName} tone="bg-primary/10 text-primary" />
                      <div>
                        <p className="font-medium">{creator.displayName}</p>
                        <p className="text-xs text-muted-foreground">{creator.instagramUsername ? `@${creator.instagramUsername}` : creator.email ?? "No Instagram connected"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">—</td>
                  <td className="px-5 py-3 font-medium">—</td>
                  <td className="px-5 py-3">—</td>
                  <td className="px-5 py-3">
                    <Badge
                      variant={creator.status === "ACTIVE" ? "outline" : "secondary"}
                      className={
                        creator.status === "ACTIVE" ? "border-teal/30 bg-teal/5 text-teal" : ""
                      }
                    >
                      {creator.status === "ACTIVE" ? "Active" : "Suspended"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Button asChild variant="ghost" size="sm"><Link to="/store-admin/creators/$creatorId" params={{ creatorId: creator.id }}>View <ChevronRight className="h-4 w-4" /></Link></Button>
                  </td>
                </tr>
              ))}
              {!query.isLoading && assignedCreators.length === 0 ? <tr><td colSpan={6} className="px-5 py-16 text-center text-muted-foreground">No creators are assigned to this store.</td></tr> : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

export function CampaignsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="Plan, launch and measure creator partnerships."
        actions={
          <Button>
            <Plus className="h-4 w-4" /> Create campaign
          </Button>
        }
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <Summary
          label="Live campaigns"
          value="2"
          note="20 creators participating"
          icon={Megaphone}
        />
        <Summary
          label="Campaign sales"
          value="₹1,97,020"
          note="Across active campaigns"
          icon={BadgeIndianRupee}
        />
        <Summary label="Total creators" value="20" note="Contributing this month" icon={Sparkles} />
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        {campaigns.map((campaign) => (
          <Card key={campaign.title} className="shadow-card">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge variant={campaign.status === "Live" ? "default" : "secondary"}>
                    {campaign.status}
                  </Badge>
                  <h2 className="mt-3 font-display text-lg font-semibold">{campaign.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {campaign.creators} creators · {campaign.end}
                  </p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Megaphone className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 border-t pt-4">
                <div>
                  <p className="text-xs text-muted-foreground">Creator budget</p>
                  <p className="mt-1 font-semibold">{campaign.budget}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Attributed sales</p>
                  <p className="mt-1 font-semibold">{campaign.sales}</p>
                </div>
              </div>
              <Button variant="ghost" className="mt-4 -ml-3 text-primary">
                View campaign <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function AffiliatePage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creatorId, setCreatorId] = useState("");
  const [productId, setProductId] = useState("store");
  const [productSearch, setProductSearch] = useState("");
  const [commissionRate, setCommissionRate] = useState("10");
  const client = useQueryClient();
  const linksQuery = useQuery({ queryKey: ["store", "affiliate-links", search], queryFn: () => getAffiliateLinks(search ? { search } : undefined) });
  const creatorsQuery = useQuery({ queryKey: ["store", "creators"], queryFn: getStoreCreators, enabled: dialogOpen });
  const productsQuery = useQuery({ queryKey: ["store", "products", "affiliate-link"], queryFn: () => getStoreProducts(1, { all: true }), enabled: dialogOpen });
  const createMutation = useMutation({ mutationFn: createAffiliateLink, onSuccess: () => { client.invalidateQueries({ queryKey: ["store", "affiliate-links"] }); setDialogOpen(false); setCreatorId(""); setProductId("store"); toast.success("Affiliate link created"); }, onError: () => toast.error("Could not create the affiliate link") });
  const statusMutation = useMutation({ mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "PAUSED" }) => updateAffiliateLink(id, { status }), onSuccess: () => client.invalidateQueries({ queryKey: ["store", "affiliate-links"] }), onError: () => toast.error("Could not update link status") });
  const links = linksQuery.data ?? [];
  const affiliateProducts = (productsQuery.data?.products ?? []).filter((product) => `${product.name} ${product.sku}`.toLowerCase().includes(productSearch.trim().toLowerCase()));
  const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);
  const totalOrders = links.reduce((sum, link) => sum + link.orders, 0);
  const totalRevenue = links.reduce((sum, link) => sum + link.revenue, 0);
  const copyLink = async (url: string) => {
    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.setAttribute("readonly", "");
        textarea.style.cssText = "position:fixed;opacity:0;pointer-events:none";
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand("copy");
        textarea.remove();
        if (!copied) throw new Error("Clipboard command was rejected");
      }
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };
  const submitLink = () => {
    if (!creatorId) { toast.error("Select a creator"); return; }
    const rate = Number(commissionRate); if (!Number.isFinite(rate) || rate < 0 || rate > 100) { toast.error("Commission must be between 0 and 100%"); return; }
    createMutation.mutate({ creatorId, productId: productId === "store" ? null : productId, commissionRate: rate });
  };
  return (
    <div className="space-y-6">
      <PageHeader
        title="Affiliate links"
        description="Track the links creators use to refer customers."
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Create link
          </Button>
        }
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <Summary label="Active links" value={String(links.filter((link) => link.status === "ACTIVE").length)} note={`Across ${new Set(links.map((link) => link.creatorId)).size} creators`} icon={Link2} />
        <Summary label="Total clicks" value={totalClicks.toLocaleString()} note="All tracked links" icon={ExternalLink} />
        <Summary
          label="Link conversion"
          value={totalClicks ? `${((totalOrders / totalClicks) * 100).toFixed(1)}%` : "—"}
          note={`${totalOrders} orders · ₹${totalRevenue.toLocaleString("en-IN")}`}
          icon={BadgeIndianRupee}
        />
      </section>
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-60 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search creator, product or link" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <Button variant="outline" onClick={() => setSearch("")}>All links</Button>
        <Button asChild variant="outline">
          <Link to="/store-admin/analytics">View link analytics</Link>
        </Button>
      </div>
      <Card className="shadow-card">
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-y bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Creator</th>
                <th className="px-5 py-3 font-medium">Affiliate link</th>
                <th className="px-5 py-3 font-medium">Clicks</th>
                <th className="px-5 py-3 font-medium">Orders</th>
                <th className="px-5 py-3 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={link.id} className="border-b last:border-0">
                  <td className="px-5 py-3 font-medium">{link.creator}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Link2 className="h-3.5 w-3.5" />
                      <span className="max-w-72 truncate" title={link.url}>{link.url}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyLink(link.url)} aria-label={`Copy ${link.creator}'s link`}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{link.product ?? "Store-wide"} · {link.commissionRate}% commission</p>
                  </td>
                  <td className="px-5 py-3">{link.clicks.toLocaleString()}</td>
                  <td className="px-5 py-3">{link.orders}</td>
                  <td className="px-5 py-3 text-right font-semibold">
                    <div className="flex items-center justify-end gap-2">₹{link.revenue.toLocaleString("en-IN")}<Button variant="ghost" size="sm" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ id: link.id, status: link.status === "ACTIVE" ? "PAUSED" : "ACTIVE" })}>{link.status === "ACTIVE" ? "Pause" : "Resume"}</Button></div>
                  </td>
                </tr>
              ))}
              {!linksQuery.isLoading && links.length === 0 ? <tr><td colSpan={5} className="px-5 py-16 text-center text-muted-foreground">No affiliate links yet. Create one to start tracking creator traffic.</td></tr> : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create affiliate link</DialogTitle><DialogDescription>Choose a creator and optionally limit the link to one Shopify product.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2"><Label>Creator</Label><Select value={creatorId} onValueChange={setCreatorId}><SelectTrigger><SelectValue placeholder="Select a creator" /></SelectTrigger><SelectContent>{(creatorsQuery.data ?? []).map((creator) => <SelectItem key={creator.id} value={creator.id}>{creator.displayName}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2"><Label>Destination</Label><Input placeholder="Search all Shopify products" value={productSearch} onChange={(event) => setProductSearch(event.target.value)} /><Select value={productId} onValueChange={setProductId}><SelectTrigger><SelectValue placeholder={productsQuery.isLoading ? "Loading products…" : "Choose a product or entire store"} /></SelectTrigger><SelectContent><SelectItem value="store">Entire store</SelectItem>{affiliateProducts.map((product) => <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>)}</SelectContent></Select><p className="text-xs text-muted-foreground">{productsQuery.isLoading ? "Loading Shopify products…" : `${affiliateProducts.length} of ${productsQuery.data?.pagination.total ?? 0} products`}</p></div>
            <div className="grid gap-2"><Label htmlFor="commission-rate">Commission rate (%)</Label><Input id="commission-rate" type="number" min="0" max="100" value={commissionRate} onChange={(event) => setCommissionRate(event.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={submitLink} disabled={createMutation.isPending}>{createMutation.isPending ? "Creating…" : "Create link"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function CommissionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Commissions"
        description="Review and pay creator earnings from attributed orders."
        actions={
          <Button>
            <BadgeIndianRupee className="h-4 w-4" /> Pay commissions
          </Button>
        }
      />
      <section className="grid gap-4 sm:grid-cols-3">
        <Summary
          label="Pending approval"
          value="₹8,460"
          note="28 commissions"
          icon={BadgeIndianRupee}
        />
        <Summary
          label="Approved to pay"
          value="₹16,280"
          note="42 commissions"
          icon={BadgeIndianRupee}
        />
        <Summary label="Paid this month" value="₹42,850" note="To 31 creators" icon={UsersRound} />
      </section>
      <div className="flex flex-wrap gap-3">
        <SearchBox placeholder="Search creator or order" />
        <Button variant="outline">All statuses</Button>
        <Button variant="outline">This month</Button>
      </div>
      <Card className="shadow-card">
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="border-y bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Creator</th>
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-5 py-3 font-medium">Sale</th>
                <th className="px-5 py-3 font-medium">Commission</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((commission) => (
                <tr key={commission.order} className="border-b last:border-0">
                  <td className="px-5 py-3">
                    <p className="font-medium">{commission.creator}</p>
                    <p className="text-xs text-muted-foreground">{commission.date}</p>
                  </td>
                  <td className="px-5 py-3">{commission.order}</td>
                  <td className="px-5 py-3">{commission.sale}</td>
                  <td className="px-5 py-3 text-muted-foreground">{commission.rate}</td>
                  <td className="px-5 py-3">
                    <Badge
                      variant={commission.status === "Pending" ? "secondary" : "outline"}
                      className={
                        commission.status === "Paid" ? "border-teal/30 bg-teal/5 text-teal" : ""
                      }
                    >
                      {commission.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold">{commission.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
