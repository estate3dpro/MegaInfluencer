import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Instagram, ShieldCheck, Sparkles, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isApiError } from "@/lib/api/api-error";
import { exchangeInstagramLoginTicket, login, toAuthUser } from "@/features/auth/api/auth.api";
import { roleHome, type Role } from "@/features/auth/types";
import { useAuthStore } from "@/stores/auth-store";

type CredentialRole = "admin" | "store-admin";

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
          <div className="relative z-10 shrink-0 flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm text-primary-foreground">
              M
            </span>
            MegaInfluencer
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
        <section className="flex items-center justify-center px-5 py-12 sm:px-10 lg:px-16">
          <div className="w-full max-w-[390px]">{children}</div>
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
    </AuthLayout>
  );
}

export function InstagramLoginPage({
  loginCode,
  oauthError,
}: {
  loginCode?: string;
  oauthError?: string;
}) {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const instagramLoginUrl = import.meta.env.VITE_INSTAGRAM_LOGIN_URL;
  const [message, setMessage] = useState<string | null>(null);
  const exchangedCode = useRef<string | null>(null);
  const ticketMutation = useMutation({ mutationFn: exchangeInstagramLoginTicket });

  useEffect(() => {
    if (!loginCode || exchangedCode.current === loginCode) return;
    exchangedCode.current = loginCode;
    ticketMutation.mutate(loginCode, {
      onSuccess: (response) => {
        const user = toAuthUser(response.user);
        if (user.activeRole !== "influencer") {
          setMessage("This Instagram account is not authorized for the Influencer workspace.");
          return;
        }
        setSession({
          user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        });
        void navigate({ to: roleHome.influencer, replace: true });
      },
    });
  }, [loginCode, navigate, setSession, ticketMutation]);

  function startInstagramLogin() {
    if (!instagramLoginUrl) {
      setMessage(
        "Instagram sign-in needs VITE_INSTAGRAM_LOGIN_URL and a backend OAuth callback before it can be enabled.",
      );
      return;
    }
    window.location.assign(instagramLoginUrl);
  }
  const oauthMessage =
    oauthError === "instagram_oauth_denied"
      ? "Instagram authorization was cancelled. Please try again."
      : oauthError
        ? "Instagram sign-in could not be completed. Please try again."
        : null;
  const errorMessage =
    message ??
    (isApiError(ticketMutation.error)
      ? ticketMutation.error.message
      : ticketMutation.error
        ? "Instagram sign-in could not be completed. Please try again."
        : oauthMessage);
  return (
    <AuthLayout role="influencer">
      <BrandHeading
        eyebrow="Influencer"
        title={ticketMutation.isPending ? "Signing you in" : "Connect with Instagram"}
        description={
          ticketMutation.isPending
            ? "We are securely preparing your Influencer workspace."
            : "Use the Instagram account you use to create and publish content."
        }
      />
      <Button
        className="mt-8 h-11 w-full gap-2"
        onClick={startInstagramLogin}
        disabled={ticketMutation.isPending}
      >
        <Instagram className="h-4 w-4" />
        {ticketMutation.isPending ? "Signing in with Instagram..." : "Continue with Instagram"}
      </Button>
      {errorMessage ? (
        <p className="mt-4 rounded-lg bg-warning/15 px-3 py-2 text-sm text-warning-foreground">
          {errorMessage}
        </p>
      ) : null}
      <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
        By continuing, you authorize MegaInfluencer to identify your Instagram account for creator
        workspace access.
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
        <Sparkles className="h-4 w-4 text-primary" />
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
