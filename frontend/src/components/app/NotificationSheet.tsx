import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { notifications } from "@/data/demo";
import { cn } from "@/lib/utils";

export function NotificationSheet() {
  const [items, setItems] = useState(notifications);
  const unread = items.filter((n) => n.unread).length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 ? (
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-coral px-1 text-[10px] font-semibold text-coral-foreground">
              {unread}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="font-display">Notifications</SheetTitle>
          <SheetDescription>{unread} unread updates across your workspace</SheetDescription>
        </SheetHeader>
        <div className="flex-1 divide-y overflow-y-auto">
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() =>
                setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, unread: false } : i)))
              }
              className="flex w-full gap-3 px-6 py-4 text-left transition-colors hover:bg-accent/50"
            >
              <span
                className={cn(
                  "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                  n.unread ? "bg-primary" : "bg-border",
                )}
              />
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{n.title}</span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-secondary-foreground">
                    {n.category}
                  </span>
                </span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{n.body}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{n.time}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="border-t px-6 py-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setItems((prev) => prev.map((i) => ({ ...i, unread: false })))}
          >
            Mark all as read
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
