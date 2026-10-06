import React, { useState } from 'react';
import { Link2, Plus, Copy, Check, ExternalLink, QrCode, Store, Sparkles, ArrowUpRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PageHeader } from '@/components/app/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { type ReferralLink, type Store as StoreType } from '@/lib/api';

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
const number = new Intl.NumberFormat('en-IN');

interface StoreLinksPageProps {
  links: ReferralLink[];
  stores: StoreType[];
  onCreateLink: (storeId: string, customSlug?: string) => Promise<void>;
}

export const StoreLinksPage: React.FC<StoreLinksPageProps> = ({
  links,
  stores,
  onCreateLink,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id || '');
  const [customSlug, setCustomSlug] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onCreateLink(selectedStoreId, customSlug.trim() || undefined);
      setCreateModalOpen(false);
      setCustomSlug('');
    } catch (err: any) {
      setError(err.message || 'Failed to create link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLinks = links.filter((l) =>
    l.store.name.toLowerCase().includes(search.toLowerCase()) ||
    l.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Store Referral Links"
        description="Generate, customize, and track performance across all participating partner stores."
        actions={
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Create Store Link
          </Button>
        }
      />

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Filter links by store or slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-9 text-xs"
        />
        <div className="text-xs text-muted-foreground ml-auto">
          Showing <strong>{filteredLinks.length}</strong> active links
        </div>
      </div>

      {/* Links Grid */}
      {filteredLinks.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="p-12 text-center space-y-3">
            <Link2 className="h-10 w-10 text-muted-foreground mx-auto" />
            <div className="font-semibold text-foreground">No referral links found</div>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Create a link for any partner store to start sharing discounts with friends and earning rewards!
            </p>
            <Button size="sm" onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Create First Link
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLinks.map((link) => (
            <Card key={link.id} className="shadow-card flex flex-col justify-between hover:shadow-elevated transition-shadow">
              <CardHeader className="p-5 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                      {link.store.logoUrl ? (
                        <img src={link.store.logoUrl} alt={link.store.name} className="w-full h-full object-cover" />
                      ) : (
                        <Store className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base">{link.store.name}</CardTitle>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">/r/{link.slug}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-teal/10 text-teal text-[11px] font-semibold">
                    {link.commissionRate}% Reward
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-5 pt-2 space-y-4">
                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-muted/40 text-center border">
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-muted-foreground">Clicks</div>
                    <div className="text-sm font-bold text-foreground">{number.format(link.clicks)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-muted-foreground">Orders</div>
                    <div className="text-sm font-bold text-coral">{number.format(link.orders)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-muted-foreground">Earned</div>
                    <div className="text-sm font-bold text-primary">{money.format(link.totalEarned)}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(link.id, link.shareUrl)}
                    className="flex-1 text-xs"
                  >
                    {copiedId === link.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1.5 text-teal" /> Copied Link
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Link
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => window.open(link.shareUrl, '_blank')}
                    title="Visit Destination"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Link Dialog */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Store Referral Link</DialogTitle>
            <DialogDescription>
              Select a partner store to create a new unique referral URL for friends.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-foreground">Select Partner Store</label>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="w-full bg-background border rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.rewardRatePercent}% Advocate Reward)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-foreground">
                Custom Slug <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                placeholder="e.g. mega-deals"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value)}
                className="h-9 text-xs"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Your link will look like: <code>/r/{customSlug || 'custom-slug'}</code>
              </p>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Generating...' : 'Create & Activate Link'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
