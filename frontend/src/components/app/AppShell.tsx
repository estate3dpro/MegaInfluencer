import type { ReactNode } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut, Search, UserRound } from "lucide-react";
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
            className="h-8 w-8 shrink-0 object-contain"
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
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isChatPage = pathname.endsWith("/chat");
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const accountName = user?.name || meta.person;
  const accountDetail = user?.email || `${meta.name} account`;
  const paths = accountPaths[role];

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
          <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-card/85 px-3 backdrop-blur md:px-5">
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleSignOut}>
                    <LogOut className="h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
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
