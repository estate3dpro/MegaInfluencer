import type { ReactNode } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Eye, LogOut, Search, UserRound } from "lucide-react";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { navByRole, roleMeta, type Role } from "@/config/nav";
import { initials } from "@/lib/format";
import { ThemeToggle } from "@/lib/theme";
import { useAuthStore } from "@/stores/auth-store";
import { NotificationSheet } from "./NotificationSheet";
import { HelpSheetTrigger } from "./HelpPanelGuide";

const accountPaths: Record<Role, { profile: string; preferences: string }> = {
  influencer: { profile: "/influencer/profile", preferences: "/influencer/profile" },
  "store-admin": { profile: "/store-admin/settings", preferences: "/store-admin/settings" },
  admin: { profile: "/admin/settings", preferences: "/admin/settings" },
};

function RoleSidebar({ role }: { role: Role }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const groups = navByRole[role];
  const meta = roleMeta[role];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to={meta.home} className="flex items-center gap-2 px-1 py-1.5">
          <img
            src="/logo/MI_Logo.svg"
            alt="MegaInfluencer"
            className="h-10 w-10 shrink-0 object-contain"
          />
          <span className="min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="block truncate font-display text-sm font-semibold">Platform</span>
            <span className="block truncate text-xs text-muted-foreground">{meta.org}</span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      tooltip={item.title}
                    >
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="rounded-lg bg-sidebar-accent p-3 text-xs text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden">
          <p className="font-medium">{meta.badge} workspace</p>
          <p className="mt-1 text-muted-foreground">{meta.tagline}</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppShell({ role, children }: { role: Role; children?: ReactNode }) {
  const meta = roleMeta[role];
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isChatPage = pathname.endsWith("/chat");
  const user = useAuthStore((state) => state.user);
  const impersonation = useAuthStore((state) => state.impersonation);
  const exitImpersonation = useAuthStore((state) => state.exitImpersonation);
  const signOut = useAuthStore((state) => state.signOut);
  const accountName = user?.name || meta.person;
  const accountDetail = user?.email || `${meta.name} account`;
  const paths = accountPaths[role];

  function handleExitImpersonation() {
    const backup = exitImpersonation();
    queryClient.clear();
    toast.success("Exited impersonation mode. Restored Store Admin session.");
    void navigate({ to: "/store-admin/creators" });
  }

  function handleSignOut() {
    signOut();
    const loginPath =
      role === "admin" ? "/admin/login" : role === "store-admin" ? "/store/login" : "/login";
    void navigate({ to: loginPath, replace: true });
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <RoleSidebar role={role} />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="sticky top-0 z-30">
            {impersonation && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/40 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 px-4 py-2.5 backdrop-blur-md shadow-xs dark:bg-amber-950/70">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/30 text-amber-800 dark:text-amber-300 ring-2 ring-amber-500/30">
                    <Eye className="h-4 w-4 animate-pulse" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
                        Impersonation Mode
                      </span>
                      <span className="rounded-full bg-amber-500/25 px-2.5 py-0.5 text-xs font-bold text-amber-950 dark:text-amber-100 border border-amber-500/30">
                        {user?.name || "Influencer"}
                      </span>
                      {user?.creatorCode && (
                        <span className="text-xs font-mono font-medium text-amber-800/80 dark:text-amber-300/80">
                          @{user.creatorCode}
                        </span>
                      )}
                      {impersonation.storeName && (
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          • Assigned to <strong className="text-foreground">{impersonation.storeName}</strong>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Viewing influencer portal through this creator's perspective. Actions apply to their profile.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleExitImpersonation}
                    className="h-8 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shadow-sm"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Exit Impersonation
                  </Button>
                </div>
              </div>
            )}
            <header className="flex h-16 items-center gap-2 border-b bg-card/85 px-3 backdrop-blur md:px-5">
              <SidebarTrigger className="shrink-0" />
              <span className="hidden rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary lg:inline">
                {meta.badge}
              </span>
              <div className="relative ml-auto hidden max-w-xs flex-1 lg:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search creators, orders, products…"
                  className="bg-background pl-9"
                />
              </div>
              <div className="ml-auto flex items-center gap-1 lg:ml-0">
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Search">
                  <Search className="h-4 w-4" />
                </Button>
                <ThemeToggle />
                <NotificationSheet />
                <HelpSheetTrigger role={role} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="ml-1 flex items-center gap-2 rounded-full p-0.5 pr-2 transition-colors hover:bg-accent"
                      aria-label="Account menu"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                          {initials(accountName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden text-sm font-medium xl:inline">{accountName}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <p className="text-sm font-medium">{accountName}</p>
                      <p className="text-xs font-normal text-muted-foreground">{accountDetail}</p>
                      <p className="mt-1 text-xs font-normal text-primary">{meta.name}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={paths.profile}>
                        <UserRound className="h-4 w-4" /> Profile
                      </Link>
                    </DropdownMenuItem>
                    {impersonation && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={handleExitImpersonation} className="text-amber-600 dark:text-amber-400 font-semibold cursor-pointer">
                          <ArrowLeft className="h-4 w-4" /> Exit Impersonation
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={handleSignOut}>
                      <LogOut className="h-4 w-4" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>
          </div>
          <main
            className={
              isChatPage
                ? "min-h-0 flex-1 overflow-hidden"
                : "flex-1 space-y-6 p-4 md:p-6"
            }
          >
            {children ?? <Outlet />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
