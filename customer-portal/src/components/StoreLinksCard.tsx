import React, { useState } from 'react';
import { Plus, Copy, Check, ExternalLink, Store, Sparkles, ShoppingBag, ArrowUpRight } from 'lucide-react';
import { type ReferralLink, type Store as StoreType } from '../lib/api';
import confetti from 'canvas-confetti';

interface StoreLinksCardProps {
  links: ReferralLink[];
  stores: StoreType[];
  onCreateLink: (storeId: string, customSlug?: string) => Promise<void>;
}

export const StoreLinksCard: React.FC<StoreLinksCardProps> = ({ links, stores, onCreateLink }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string>(stores[0]?.id || '');
  const [customSlug, setCustomSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreId) return;
    setLoading(true);
    setError(null);
    try {
      await onCreateLink(selectedStoreId, customSlug.trim() || undefined);
      setIsCreating(false);
      setCustomSlug('');
    } catch (err: any) {
      setError(err.message || 'Failed to create link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-white/10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-indigo-400" />
            <h3 className="text-xl font-bold text-white">Your Store Referral Links</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Generate and manage your custom referral links across different partner stores
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Store Link</span>
        </button>
      </div>

      {/* Create Link Modal / Accordion */}
      {isCreating && (
        <form onSubmit={handleCreate} className="p-5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Generate Referral Link for Store</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Store</label>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.rewardRatePercent}% Reward)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Custom Slug (Optional)</label>
              <input
                type="text"
                placeholder="e.g. summer-deals"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-pink-600 text-white font-bold text-xs shadow-lg transition-all hover:opacity-95 disabled:opacity-50"
          >
            {loading ? 'Creating Link...' : 'Generate & Activate Link'}
          </button>
        </form>
      )}

      {/* Links List */}
      <div className="space-y-3">
        {links.length === 0 ? (
          <div className="text-center py-10 bg-slate-950/40 rounded-2xl border border-dashed border-white/10">
            <Store className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400 font-medium">No referral links active yet.</p>
            <p className="text-xs text-slate-500 mt-1">Create your first link above to start referring friends!</p>
          </div>
        ) : (
          links.map((link) => (
            <div
              key={link.id}
              className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-indigo-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              {/* Store & Product info */}
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border border-indigo-500/20 overflow-hidden flex items-center justify-center shrink-0">
                  {link.store.logoUrl ? (
                    <img src={link.store.logoUrl} alt={link.store.name} className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-6 h-6 text-indigo-400" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{link.store.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {link.commissionRate}% Reward
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5 max-w-xs truncate">
                    /r/{link.slug}
                  </div>
                </div>
              </div>

              {/* Performance Mini Stats */}
              <div className="grid grid-cols-3 gap-3 text-center sm:text-left md:border-x md:border-white/5 md:px-6">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Clicks</div>
                  <div className="text-xs font-bold text-white">{link.clicks}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Orders</div>
                  <div className="text-xs font-bold text-purple-400">{link.orders}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Earned</div>
                  <div className="text-xs font-bold text-emerald-400">₹{link.totalEarned.toLocaleString()}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(link.id, link.shareUrl)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    copiedId === link.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/10 hover:border-indigo-500/40'
                  }`}
                >
                  {copiedId === link.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>

                <a
                  href={link.shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 transition-colors"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
