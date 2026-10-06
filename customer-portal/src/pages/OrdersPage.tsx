import React, { useState } from 'react';
import { ShoppingBag, CheckCircle2, Clock, Check, Search, Download, Calendar, DollarSign, Tag } from 'lucide-react';
import { PageHeader } from '@/components/app/PageHeader';
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
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-foreground">Friend Orders</h1>
          <p className="text-xs text-muted-foreground">Every purchase made through your links</p>
        </div>
        <Badge variant="secondary" className="bg-primary/10 text-primary font-bold text-xs py-1 px-2.5 shrink-0">
          Total: {money.format(totalRewards)}
        </Badge>
      </div>

      {/* Filter and search controls */}
      <div className="space-y-2">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search orders or stores…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {(['ALL', 'APPROVED', 'PENDING'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              {st === 'ALL' ? 'All Orders' : st}
            </button>
          ))}
          <span className="text-[11px] text-muted-foreground ml-auto whitespace-nowrap">
            {filtered.length} orders
          </span>
        </div>
      </div>

      {/* Mobile-First Orders List Feed */}
      {filtered.length === 0 ? (
        <Card className="shadow-xs border-border">
          <CardContent className="p-8 text-center text-sm text-muted-foreground space-y-2">
            <ShoppingBag className="h-9 w-9 text-muted-foreground mx-auto" />
            <div className="font-semibold text-foreground text-xs">No orders found</div>
            <p className="text-[11px]">Share your link with friends to see newly attributed purchases here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl border border-border bg-card shadow-2xs space-y-2.5 hover:border-primary/30 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-xl bg-teal/10 text-teal flex items-center justify-center shrink-0">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-foreground block truncate">{item.orderName}</span>
                    <span className="text-[10px] text-muted-foreground block truncate">{item.storeName}</span>
                  </div>
                </div>

                <Badge
                  variant={item.status === 'APPROVED' || item.status === 'PAID' ? 'default' : 'secondary'}
                  className="text-[10px] px-1.5 h-4 font-mono font-medium shrink-0"
                >
                  {item.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-muted-foreground block font-mono">{item.customerMasked}</span>
                  <span className="text-[10px] text-muted-foreground block flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(item.date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-primary block">+{money.format(item.rewardAmount)}</span>
                  <span className="text-[10px] text-muted-foreground block font-mono">
                    Order: {money.format(item.orderAmount)} ({item.commissionRate}%)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
