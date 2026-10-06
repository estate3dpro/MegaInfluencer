import React, { useState } from 'react';
import { User, Phone, Wallet, Shield, Check, Save } from 'lucide-react';
import { type CustomerProfile, api } from '../lib/api';

interface ProfileModalProps {
  profile: CustomerProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [payoutMethod, setPayoutMethod] = useState(profile.payoutMethod || 'UPI');
  const [payoutAccount, setPayoutAccount] = useState(profile.payoutDetails?.account || '');
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await api.customer.updateProfile({
        displayName: displayName.trim(),
        phone: phone.trim() || null,
        payoutMethod: payoutMethod as any,
        payoutDetails: payoutAccount ? { account: payoutAccount.trim() } : null,
      });
      setSuccess(true);
      onUpdated();
      setTimeout(() => setSuccess(false), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl max-w-lg w-full border border-white/20 shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Profile & Payout Settings</h3>
              <p className="text-xs text-slate-400">Manage your advocate profile and payout methods</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {error && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">{error}</div>}
        {success && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2"><Check className="w-4 h-4" /> Profile updated successfully!</div>}

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Email & Referral Code Info */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950 border border-white/5">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Account Email</div>
              <div className="font-bold text-white truncate">{profile.email}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Referral Code</div>
              <div className="font-mono font-bold text-indigo-400">{profile.creatorCode}</div>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Full Name / Display Name</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Phone Number (Optional)</label>
            <input
              type="tel"
              placeholder="+91 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-2 border-t border-white/10">
            <label className="block text-slate-300 font-semibold mb-1.5">Preferred Payout Method</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {(['UPI', 'PAYPAL', 'BANK'] as const).map((method) => (
                <button
                  type="button"
                  key={method}
                  onClick={() => setPayoutMethod(method)}
                  className={`py-2 rounded-xl border text-center font-semibold transition-all ${
                    payoutMethod === method
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>

            <label className="block text-slate-300 font-semibold mb-1.5">
              {payoutMethod === 'UPI' ? 'UPI ID (e.g. mobile@okhdfcbank)' : payoutMethod === 'PAYPAL' ? 'PayPal Email' : 'Bank Account & IFSC'}
            </label>
            <input
              type="text"
              placeholder={payoutMethod === 'UPI' ? 'name@upi' : 'Account identifier'}
              value={payoutAccount}
              onChange={(e) => setPayoutAccount(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
