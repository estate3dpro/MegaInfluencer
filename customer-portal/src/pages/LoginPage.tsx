import React, { useState, forwardRef, type ComponentProps } from 'react';
import { Eye, EyeOff, Sparkles, Gift, CheckCircle2, ArrowRight, Lock, Mail, User, Phone, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

const PasswordInput = forwardRef<HTMLInputElement, ComponentProps<'input'>>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    return (
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          className={cn('pr-10', className)}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-0 top-0 flex h-full items-center justify-center px-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';

export const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        if (password.length < 12) {
          throw new Error('Password must be at least 12 characters long.');
        }
        await register({
          email: email.trim(),
          password,
          displayName: displayName.trim(),
          phone: phone.trim() || undefined,
        });
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#6c5ce7', '#ec6b9a', '#20b8a6', '#f59e0b'],
        });
      } else {
        await login(email.trim(), password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="box-border min-h-dvh bg-background p-3 sm:p-5 lg:h-dvh lg:min-h-0 lg:overflow-hidden font-sans">
      <div className="mx-auto grid min-h-[calc(100dvh-1.5rem)] max-w-[1440px] overflow-hidden rounded-2xl bg-card shadow-elevated sm:min-h-[calc(100dvh-2.5rem)] lg:h-full lg:min-h-0 lg:grid-cols-[0.92fr_1.08fr]">
        {/* Left Visual Aside (Exact MegaInfluencer gradient branding) */}
        <aside className="relative hidden min-h-0 overflow-hidden border-r border-primary/10 bg-gradient-to-br from-primary/10 via-card to-indigo/10 p-8 lg:flex lg:flex-col xl:p-12">
          <div className="relative z-10 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-foreground font-display">
              <img
                src="/logo/MI_Logo.svg"
                alt="MegaInfluencer"
                className="h-10 w-10 object-contain"
              />
              <span>MegaInfluencer</span>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary font-semibold text-xs">
              Advocate
            </Badge>
          </div>

          <div className="relative z-10 my-auto max-w-lg space-y-4 py-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Customer Referral Program
            </span>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground xl:text-4xl">
              Turn your recommendations into instant savings & rewards.
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Share products and stores you love with friends. They receive exclusive discounts at checkout, and you earn reward points and cash back on every purchase.
            </p>

            {/* Feature Checklist */}
            <div className="pt-4 space-y-2.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal shrink-0" />
                <span>Unique shareable store links and scannable QR codes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal shrink-0" />
                <span>Live attribution dashboard with order & commission tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal shrink-0" />
                <span>Redeem points for store vouchers, gift cards & bank payouts</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 shrink-0 rounded-xl bg-card/70 p-4 backdrop-blur border text-xs text-muted-foreground flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Welcome Perk for Advocates</p>
              <p className="text-[11px] mt-0.5">100 Bonus Points added to your wallet on registration</p>
            </div>
            <Gift className="h-6 w-6 text-coral shrink-0" />
          </div>
        </aside>

        {/* Right Form Container */}
        <section className="flex min-h-0 flex-col justify-center overflow-y-auto p-6 sm:p-10 lg:p-12 xl:p-16">
          <div className="mx-auto w-full max-w-md space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="font-semibold text-xs">
                  Customer Portal
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {isRegister ? 'New Account' : 'Existing Member'}
                </span>
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
                {isRegister ? 'Join as a Customer Advocate' : 'Sign in to your Portal'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isRegister
                  ? 'Create an account to start earning rewards by referring friends.'
                  : 'Enter your credentials to access your referral links and points vault.'}
              </p>
            </div>

            {/* Tabs toggle */}
            <div className="grid grid-cols-2 p-1 bg-muted rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setError(null);
                }}
                className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  !isRegister
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setError(null);
                }}
                className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isRegister
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div className="rounded-xl bg-destructive/10 p-3.5 text-xs font-medium text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Full Name</label>
                  <Input
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-10 text-xs"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Email Address</label>
                <Input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              {isRegister && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Phone Number (Optional)</label>
                  <Input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-10 text-xs"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">Password</label>
                  {isRegister && (
                    <span className="text-[10px] text-muted-foreground">Min. 12 characters</span>
                  )}
                </div>
                <PasswordInput
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 text-xs font-semibold mt-2"
              >
                {loading
                  ? 'Authenticating...'
                  : isRegister
                  ? 'Create Account'
                  : 'Sign In to Portal'}
              </Button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
};
