import React, { useState } from 'react';
import { Store, ArrowUpRight, Search, Plus, Sparkles, Check } from 'lucide-react';
import { PageHeader } from '@/components/app/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { type Store as StoreType } from '@/lib/api';

interface PartnerStoresPageProps {
  stores: StoreType[];
  onGenerateLink: (storeId: string) => void;
}

export const PartnerStoresPage: React.FC<PartnerStoresPageProps> = ({
  stores,
  onGenerateLink,
}) => {
  const [search, setSearch] = useState('');

  const filtered = stores.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Partner Stores"
        description="Discover participating brands in the MegaInfluencer ecosystem, active referral rates, and generate links."
      />

      <div className="flex items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search stores by brand or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((store) => (
          <Card key={store.id} className="shadow-card flex flex-col justify-between hover:shadow-elevated transition-shadow">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-start gap-3.5">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base shrink-0 overflow-hidden border">
                  {store.logoUrl ? (
                    <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
                  ) : (
                    <Store className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-base">{store.name}</CardTitle>
                  <Badge variant="secondary" className="mt-1 text-[10px]">
                    {store.category}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 pt-1 space-y-4">
              <div className="rounded-xl bg-muted/40 p-3 space-y-1 text-xs border">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Friend Discount:</span>
                  <span className="font-bold text-coral">{store.friendDiscountPercent}% OFF</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Advocate Reward:</span>
                  <span className="font-bold text-teal">{store.rewardRatePercent}% Reward</span>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => onGenerateLink(store.id)}
                className="w-full text-xs font-semibold"
              >
                <Plus className="h-4 w-4 mr-1.5" /> Get Referral Link
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
