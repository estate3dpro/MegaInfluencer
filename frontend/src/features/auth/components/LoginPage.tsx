import { useState, type FormEvent, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Instagram, ShieldCheck, Sparkles, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isApiError } from "@/lib/api/api-error";
import { login, registerInfluencer, registerStoreOwner, toAuthUser } from "@/features/auth/api/auth.api";
import { roleHome, type Role } from "@/features/auth/types";
import { useAuthStore } from "@/stores/auth-store";

type CredentialRole = Role;

const portalDetails: Record<
  Role,
  { label: string; heading: string; description: string; icon: typeof Sparkles }
> = {
  admin: {
    label: "Platform Admin",
    heading: "Manage the ecosystem with confidence.",
    description: "Access platform operations, governance, reports, and support.",
    icon: ShieldCheck,
  },
  "store-admin": {
    label: "Store Owner",
    heading: "Grow your brand through creator commerce.",
    description: "Manage your store, products, creators, and performance in one place.",
    icon: Store,
  },
  influencer: {
    label: "Influencer",
    heading: "Turn your influence into a thriving business.",
    description: "Manage collaborations, content, storefront links, and earnings.",
    icon: Instagram,
  },
};

function AuthLayout({ role, children }: { role: Role; children: ReactNode }) {
  const details = portalDetails[role];
  const Icon = details.icon;
  return (
    <main className="box-border min-h-dvh bg-background p-3 sm:p-5 lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      <div className="mx-auto grid min-h-[calc(100dvh-1.5rem)] max-w-[1440px] overflow-hidden rounded-2xl bg-card shadow-elevated sm:min-h-[calc(100dvh-2.5rem)] lg:h-full lg:min-h-0 lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="relative hidden min-h-0 overflow-hidden border-r border-primary/10 bg-gradient-to-br from-primary/10 via-card to-indigo/10 p-8 lg:flex lg:flex-col xl:p-12">
          <div className="relative z-10 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
              <img
                src="/logo/MI_Logo.svg"
                alt="MegaInfluencer"
                className="h-10 w-10 shrink-0 object-contain"
              />
              MegaInfluencer
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Powered by Megascale
            </span>
          </div>
          <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center py-4 xl:py-6">
            <img
              src="/image/Collaborative%20Creative%20Workspace%20Illustration.png"
              alt="Creators collaborating on social content and analytics"
              className="h-full max-h-full w-auto max-w-full object-contain"
            />
          </div>
          <div className="relative z-10 shrink-0 max-w-md pb-2">
            <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              {details.label}
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold leading-[1.08] text-foreground xl:text-4xl">
              {details.heading}
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground xl:text-base xl:leading-7">
              {details.description}
            </p>
          </div>
          <div className="absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute left-[-5rem] top-[28%] h-56 w-56 rounded-full bg-indigo/10 blur-3xl" />
        </aside>
        <section className="flex flex-col items-center justify-between px-5 py-8 sm:px-10 lg:px-16 lg:py-12">
          <div className="my-auto w-full max-w-[390px]">{children}</div>
          <div className="mt-8 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground font-medium">
            <div className="flex flex-wrap items-center justify-center gap-3 text-[11px]">
              <a href="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <span className="text-muted-foreground/40">•</span>
              <a href="/terms-of-service" className="hover:text-foreground transition-colors">Terms of Service</a>
              <span className="text-muted-foreground/40">•</span>
              <a href="/data-deletion" className="hover:text-foreground transition-colors">Data Deletion</a>
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <Sparkles className="h-3.5 w-3.5 text-primary opacity-80" />
              <span>Powered by <strong className="font-semibold text-foreground">Megascale</strong></span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export function CredentialLoginPage({
  role,
  redirectTo,
}: {
  role: CredentialRole;
  redirectTo?: string;
}) {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleError, setRoleError] = useState<string | null>(null);
  const details = portalDetails[role];
  const mutation = useMutation({ mutationFn: login });
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRoleError(null);
    const response = await mutation.mutateAsync({ email, password }).catch(() => null);
    if (!response) return;
    const user = toAuthUser(response.user);
    if (user.activeRole !== role) {
      setRoleError(`This account is not authorized for the ${details.label} portal.`);
      return;
    }
    setSession({ user, accessToken: response.accessToken, refreshToken: response.refreshToken });
    void navigate({ to: redirectTo?.startsWith("/") ? redirectTo : roleHome[role] });
  }
  const errorMessage =
    roleError ??
    (isApiError(mutation.error)
      ? mutation.error.message
      : mutation.error
        ? "Unable to sign in. Please try again."
        : null);
  return (
    <AuthLayout role={role}>
      <BrandHeading
        eyebrow={details.label}
        title="Welcome back"
        description="Sign in with the credentials issued for your workspace."
      />
      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-semibold text-foreground">
          Email address
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-foreground">
          Password
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {errorMessage ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}
        <Button
          className="h-11 w-full"
          type="submit"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Signing in..." : `Sign in as ${details.label}`}
        </Button>
      </form>
      {role === "influencer" || role === "store-admin" ? (
        <p className="mt-5 text-center text-sm text-muted-foreground">
          New to MegaInfluencer?{" "}
          <a href={role === "influencer" ? "/register" : "/store/register"} className="font-semibold text-primary hover:underline">
            Create your account
          </a>
        </p>
      ) : null}
    </AuthLayout>
  );
}

export function InfluencerRegistrationPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const mutation = useMutation({ mutationFn: registerInfluencer });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    const created = await mutation
      .mutateAsync({ firstName, lastName, email, phone: phone || undefined, password })
      .catch(() => null);
    if (!created) return;

    const session = await login({ email, password }).catch(() => null);
    if (!session) {
      void navigate({ to: "/login" });
      return;
    }
    setSession({
      user: toAuthUser(session.user),
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
    void navigate({ to: roleHome.influencer });
  }

  const errorMessage =
    formError ??
    (isApiError(mutation.error)
      ? mutation.error.message
      : mutation.error
        ? "Unable to create your account. Please try again."
        : null);

  return (
    <AuthLayout role="influencer">
      <BrandHeading
        eyebrow="Influencer"
        title="Create your account"
        description="Set up your MegaInfluencer account, then connect Instagram from your profile."
      />
      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-foreground">
            First name
            <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" required />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-foreground">
            Last name
            <Input value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" required />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-semibold text-foreground">
          Email address
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-foreground">
          Phone number <span className="font-normal text-muted-foreground">(optional)</span>
          <Input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-foreground">
          Password
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={12} required />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-foreground">
          Confirm password
          <Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={12} required />
        </label>
        {errorMessage ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorMessage}</p> : null}
        <Button className="h-11 w-full" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating account..." : "Create influencer account"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <a href="/login" className="font-semibold text-primary hover:underline">Sign in</a>
      </p>
    </AuthLayout>
  );
}

export function StoreRegistrationPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const mutation = useMutation({ mutationFn: registerStoreOwner });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    const created = await mutation.mutateAsync({ businessName, email, password }).catch(() => null);
    if (!created) return;

    const session = await login({ email, password }).catch(() => null);
    if (!session) {
      void navigate({ to: "/store/login" });
      return;
    }
    setSession({
      user: toAuthUser(session.user),
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
    void navigate({ to: roleHome["store-admin"] });
  }

  const errorMessage =
    formError ??
    (isApiError(mutation.error)
      ? mutation.error.message
      : mutation.error
        ? "Unable to create your store account. Please try again."
        : null);

  return (
    <AuthLayout role="store-admin">
      <BrandHeading
        eyebrow="Store owner"
        title="Create your brand account"
        description="Create your workspace to manage products, creators, and campaign performance."
      />
      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-semibold text-foreground">
          Brand or store name
          <Input value={businessName} onChange={(event) => setBusinessName(event.target.value)} autoComplete="organization" required />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-foreground">
          Work email address
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-foreground">
          Password
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={12} required />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-foreground">
          Confirm password
          <Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={12} required />
        </label>
        {errorMessage ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorMessage}</p> : null}
        <Button className="h-11 w-full" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating account..." : "Create store account"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have a store account?{" "}
        <a href="/store/login" className="font-semibold text-primary hover:underline">Sign in</a>
      </p>
    </AuthLayout>
  );
}

function BrandHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <>
      <div className="flex items-center gap-2 font-display text-base font-bold text-foreground">
        <img src="/logo/MI_Logo.svg" alt="" aria-hidden="true" className="h-8 w-8 object-contain" />
        MegaInfluencer
      </div>
      <p className="mt-9 text-xs font-bold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
    </>
  );
}
