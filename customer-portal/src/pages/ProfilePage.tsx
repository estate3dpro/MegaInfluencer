import React, { useState } from 'react';
import { UserRound, Wallet, Save, Check, ShieldCheck, Mail, Phone, Award } from 'lucide-react';
import { PageHeader } from '@/components/app/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { initials } from '@/lib/format';
import { type CustomerProfile, api } from '@/lib/api';

interface ProfilePageProps {
  profile: CustomerProfile;
  onRefresh: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ profile, onRefresh }) => {
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [payoutMethod, setPayoutMethod] = useState(profile.payoutMethod || 'UPI');
  const [payoutAccount, setPayoutAccount] = useState(profile.payoutDetails?.account || '');
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      onRefresh();
      setTimeout(() => setSuccess(false), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Profile & Payout Settings"
        description="Manage your advocate profile information, creator code, and preferred reward transfer methods."
      />

      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/10 text-destructive text-xs font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-teal/10 text-teal text-xs font-medium flex items-center gap-2">
          <Check className="h-4 w-4" /> Profile settings saved successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="grid gap-6 md:grid-cols-2">
        {/* Account Summary Card */}
        <Card className="shadow-card">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base">Advocate Identity</CardTitle>
            <p className="text-xs text-muted-foreground">Your account details and verification tier</p>
          </CardHeader>
          <CardContent className="p-5 pt-2 space-y-4 text-xs">
            <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/40 border">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                  {initials(displayName || 'Customer')}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-foreground text-sm">{displayName}</div>
                <div className="text-muted-foreground">{profile.email}</div>
                <Badge variant="secondary" className="mt-1 bg-primary/10 text-primary font-bold text-[10px]">
                  {profile.tier} ADVOCATE
                </Badge>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-foreground">Display Name</label>
              <Input
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-foreground">Phone Number</label>
              <Input
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-foreground">Personal Referral Code</label>
              <Input
                readOnly
                value={profile.creatorCode}
                className="h-9 text-xs font-mono bg-muted text-foreground"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                This promo code can be entered directly at checkout on partner stores for friend discounts.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payout Channels Card */}
        <Card className="shadow-card">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base">Payout & Bank Settings</CardTitle>
            <p className="text-xs text-muted-foreground">Where you want cash reward transfers delivered</p>
          </CardHeader>
          <CardContent className="p-5 pt-2 space-y-4 text-xs">
            <div>
              <label className="block font-semibold mb-2 text-foreground">Select Transfer Method</label>
              <div className="grid grid-cols-3 gap-2">
                {(['UPI', 'PAYPAL', 'BANK'] as const).map((m) => (
                  <Button
                    key={m}
                    type="button"
                    variant={payoutMethod === m ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPayoutMethod(m)}
                    className="h-9 text-xs font-semibold"
                  >
                    {m}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-foreground">
                {payoutMethod === 'UPI' ? 'UPI ID' : payoutMethod === 'PAYPAL' ? 'PayPal Email' : 'Account Details & IFSC'}
              </label>
              <Input
                placeholder={payoutMethod === 'UPI' ? 'e.g. mobile@okhdfcbank' : 'Account details'}
                value={payoutAccount}
                onChange={(e) => setPayoutAccount(e.target.value)}
                className="h-9 text-xs"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Used when claiming direct cash payouts from the Rewards Vault.
              </p>
            </div>

            <div className="pt-4 border-t">
              <Button type="submit" disabled={isSaving} className="w-full">
                <Save className="h-4 w-4 mr-1.5" />
                {isSaving ? 'Saving Changes...' : 'Save Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};
