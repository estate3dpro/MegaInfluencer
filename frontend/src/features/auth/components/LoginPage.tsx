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
    <main className="min-h-screen bg-[#faf9f7] p-3 sm:p-5">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1440px] overflow-hidden rounded-2xl bg-white shadow-[0_20px_65px_rgb(33_25_20/0.08)] sm:min-h-[calc(100vh-2.5rem)] lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="relative hidden overflow-hidden bg-[radial-gradient(circle_at_42%_45%,#ffcaab_0%,#ffb49c_26%,#fb8d69_54%,#f0663f_75%,#d94a2f_100%)] p-8 text-[#251914] lg:flex lg:flex-col xl:p-12">
          <div className="relative z-10 flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#251914] text-sm text-white">
              M
            </span>
            MegaInfluencer
          </div>
          <div className="relative z-10 mt-auto max-w-md pb-6">
            <span className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-white/35 backdrop-blur-sm">
              <Icon className="h-6 w-6" />
            </span>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#543128]/75">
              {details.label}
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-[1.08] xl:text-5xl">
              {details.heading}
            </h1>
            <p className="mt-5 max-w-sm text-base leading-7 text-[#4d2d24]/80">
              {details.description}
            </p>
          </div>
          <div className="absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-[#ffdbad]/45 blur-3xl" />
          <div className="absolute left-[-5rem] top-[28%] h-56 w-56 rounded-full bg-[#ffe0d2]/45 blur-3xl" />
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
        <label className="grid gap-2 text-sm font-semibold text-[#33241f]">
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
        <label className="grid gap-2 text-sm font-semibold text-[#33241f]">
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
          className="h-11 w-full bg-[#251914] hover:bg-[#432b22]"
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
        className="mt-8 h-11 w-full gap-2 bg-[#251914] hover:bg-[#432b22]"
        onClick={startInstagramLogin}
        disabled={ticketMutation.isPending}
      >
        <Instagram className="h-4 w-4" />
        {ticketMutation.isPending ? "Signing in with Instagram..." : "Continue with Instagram"}
      </Button>
      {errorMessage ? (
        <p className="mt-4 rounded-lg bg-warning/15 px-3 py-2 text-sm text-[#805300]">
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
      <div className="flex items-center gap-2 font-display text-base font-bold text-[#251914]">
        <Sparkles className="h-4 w-4 text-[#f06b45]" />
        MegaInfluencer
      </div>
      <p className="mt-9 text-xs font-bold uppercase tracking-[0.16em] text-[#ed6b48]">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#251914]">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
    </>
  );
}
