import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CreatorProfileGrid } from "@/features/shared/components/CreatorProfileGrid";
import { getStoreCreators } from "../api/creators.api";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export function CreatorDirectoryPage() {
  const [search, setSearch] = useState("");
  const query = useQuery({ queryKey: ["store", "creator-directory"], queryFn: getStoreCreators });
  const creators = (query.data ?? []).filter((creator) =>
    `${creator.displayName} ${creator.email ?? ""} ${creator.instagramUsername ?? ""} ${creator.creatorCode ?? ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader title="All Creators" description="Explore your store’s creator partners in a visual profile directory." />
      <Card className="shadow-card">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><UsersRound className="h-4 w-4" /></span>
            <span><strong className="text-foreground">{query.data?.length ?? 0}</strong> creator partners</span>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search creators..." />
          </div>
        </CardContent>
      </Card>
      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <Card key={index} className="h-72 animate-pulse bg-muted/50" />)}</div>
      ) : (
        <CreatorProfileGrid
          creators={creators.map((creator) => ({
            ...creator,
            detailPath: "/store-admin/creators/$creatorId",
            detailParams: { creatorId: creator.id },
            meta: [
              { label: "Attributed sales", value: formatCurrency(creator.totalSales ?? 0) },
              { label: "Orders", value: String(creator.totalOrders ?? 0) },
            ],
          }))}
          emptyMessage="No creator partners match this search."
        />
      )}
    </div>
  );
}
