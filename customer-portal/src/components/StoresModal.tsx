import React, { useState } from 'react';
import { Store, Sparkles, Plus, ExternalLink, ArrowRight, Check } from 'lucide-react';
import { type Store as StoreType } from '../lib/api';

interface StoresModalProps {
  stores: StoreType[];
  isOpen: boolean;
  onClose: () => void;
  onSelectStore: (storeId: string) => void;
}

export const StoresModal: React.FC<StoresModalProps> = ({
  stores,
  isOpen,
  onClose,
  onSelectStore,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = stores.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl max-w-2xl w-full border border-white/20 shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Partner Stores Explorer</h3>
              <p className="text-xs text-slate-400">Choose a store to generate referral links and earn cashback</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="shrink-0">
          <input
            type="text"
            placeholder="Search stores by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
          />
        </div>

        {/* Stores List */}
        <div className="overflow-y-auto space-y-3 pr-1 grow">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">No stores match your search.</div>
          ) : (
            filtered.map((store) => (
              <div
                key={store.id}
                className="p-4 rounded-2xl bg-slate-950/70 border border-white/5 hover:border-indigo-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-500/20 overflow-hidden flex items-center justify-center shrink-0">
                    {store.logoUrl ? (
                      <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-6 h-6 text-indigo-400" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white">{store.name}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                        {store.category}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
                      <span>Friends Get: <strong className="text-pink-400">{store.friendDiscountPercent}% OFF</strong></span>
                      <span>•</span>
                      <span>You Earn: <strong className="text-amber-400">{store.rewardRatePercent}% Reward</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      onSelectStore(store.id);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30"
                  >
                    <span>Get Referral Link</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
