import React, { useState } from 'react';
import { ShoppingBag, CheckCircle2, Clock, Check, Search, Download } from 'lucide-react';
import { PageHeader } from '@/components/app/PageHeader';
import { StatusBadge } from '@/components/app/StatusBadge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { type ReferralTransaction } from '@/lib/api';

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

interface OrdersPageProps {
  referrals: ReferralTransaction[];
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ referrals }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING'>('ALL');

  const filtered = referrals.filter((item) => {
    const matchesSearch =
      item.orderName.toLowerCase().includes(search.toLowerCase()) ||
      item.storeName.toLowerCase().includes(search.toLowerCase()) ||
      item.customerMasked.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalRewards = filtered
    .filter((r) => r.status === 'APPROVED' || r.status === 'PAID')
    .reduce((sum, r) => sum + r.rewardAmount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Friend Orders & Purchases"
        description="Every purchase made through your advocate links with commission and validation breakdown."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary font-semibold text-xs py-1 px-3">
              Total Earned: {money.format(totalRewards)}
            </Badge>
          </div>
        }
      />

      {/* Filter and search controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by order or store…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {(['ALL', 'APPROVED', 'PENDING'] as const).map((st) => (
            <Button
              key={st}
              variant={statusFilter === st ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(st)}
              className="h-8 text-xs"
            >
              {st === 'ALL' ? 'All Orders' : st}
            </Button>
          ))}
        </div>
      </div>

      {/* Orders Table Card */}
      <Card className="shadow-card">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground space-y-2">
              <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto" />
              <div className="font-semibold text-foreground">No purchases found</div>
              <p className="text-xs">Try adjusting your search or share your link with friends to see new orders.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Order / ID</th>
                    <th className="py-3 px-4">Referred Customer</th>
                    <th className="py-3 px-4">Store</th>
                    <th className="py-3 px-4">Order Total</th>
                    <th className="py-3 px-4">Your Reward</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground">{item.orderName}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{item.orderId}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">
                        {item.customerMasked}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        {item.storeName}
                      </td>
                      <td className="py-3.5 px-4 font-semibold">
                        {money.format(item.orderAmount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-primary">
                          +{money.format(item.rewardAmount)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {item.commissionRate}% reward
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={item.status === 'APPROVED' || item.status === 'PAID' ? 'default' : 'secondary'}
                          className="text-[10px]"
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {new Date(item.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
