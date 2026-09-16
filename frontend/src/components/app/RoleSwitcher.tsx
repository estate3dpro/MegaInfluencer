import { Link } from "@tanstack/react-router";
import { Check, ChevronsUpDown, Sparkles, Store, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { roleMeta, type Role } from "@/config/nav";
import { cn } from "@/lib/utils";

const icons = { influencer: Sparkles, "store-admin": Store, admin: ShieldCheck } as const;
const order: Role[] = ["influencer", "store-admin", "admin"];

export function RoleSwitcher({ role }: { role: Role }) {
  const ActiveIcon = icons[role];
  const meta = roleMeta[role];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-10 gap-2 rounded-lg border-border bg-card px-3 text-left"
        >
          <span className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">
            <ActiveIcon className="h-3.5 w-3.5" />
          </span>
          <span className="hidden min-w-0 flex-col leading-tight sm:flex">
            <span className="truncate text-xs text-muted-foreground">Workspace</span>
            <span className="truncate text-sm font-medium">{meta.name}</span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Switch workspace</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {order.map((r) => {
          const Icon = icons[r];
          const m = roleMeta[r];
          return (
            <DropdownMenuItem key={r} asChild className="gap-2 py-2.5">
              <Link to={m.home}>
                <span
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded-md",
                    r === role ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{m.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{m.person}</span>
                </span>
                {r === role ? <Check className="h-4 w-4 text-primary" /> : null}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
