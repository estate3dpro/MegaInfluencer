import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CreatorProfileGrid } from "@/features/shared/components/CreatorProfileGrid";
import { getInfluencers } from "../api/influencers.api";

export function CreatorDirectoryPage() {
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const query = useQuery({
    queryKey: ["admin", "creator-directory", appliedSearch],
    queryFn: () => getInfluencers({ page: 1, search: appliedSearch || undefined }),
  });
  const creators = query.data?.influencers ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Creators"
        description="Browse every MegaInfluencer creator and open their full platform profile."
      />
      <Card className="shadow-card">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><UsersRound className="h-4 w-4" /></span>
            <span><strong className="text-foreground">{query.data?.pagination.total ?? 0}</strong> registered creators</span>
          </div>
          <form className="relative w-full sm:w-80" onSubmit={(event) => { event.preventDefault(); setAppliedSearch(search.trim()); }}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search creators..." />
          </form>
        </CardContent>
      </Card>
      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <Card key={index} className="h-72 animate-pulse bg-muted/50" />)}</div>
      ) : (
        <CreatorProfileGrid
          creators={creators.map((creator) => ({
            ...creator,
            detailPath: "/admin/influencers/$influencerId",
            detailParams: { influencerId: creator.id },
            meta: [{ label: "Joined", value: new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" }).format(new Date(creator.createdAt)) }],
          }))}
          emptyMessage="No creators match this search."
        />
      )}
    </div>
  );
}
