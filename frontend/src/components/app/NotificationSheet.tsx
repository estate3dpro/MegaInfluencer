import { Bell } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/features/notifications/api/notifications.api";
import { cn } from "@/lib/utils";

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86_400)}d ago`;
}

export function NotificationSheet() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["notifications"], queryFn: getNotifications, refetchInterval: 30_000 });
  const refresh = () => client.invalidateQueries({ queryKey: ["notifications"] });
  const markRead = useMutation({ mutationFn: markNotificationRead, onSuccess: refresh });
  const markAll = useMutation({ mutationFn: markAllNotificationsRead, onSuccess: refresh });
  const items = query.data ?? [];
  const unread = items.filter((item) => !item.readAt).length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread ? <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-coral px-1 text-[10px] font-semibold text-coral-foreground">{unread > 9 ? "9+" : unread}</span> : null}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="font-display">Notifications</SheetTitle>
          <SheetDescription>{unread ? `${unread} unread update${unread === 1 ? "" : "s"}` : "You’re all caught up"}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 divide-y overflow-y-auto">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => !item.readAt && markRead.mutate(item.id)}
              className="flex w-full gap-3 px-6 py-4 text-left transition-colors hover:bg-accent/50"
            >
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", item.readAt ? "bg-border" : "bg-primary")} />
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium">{item.title}</span><span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-secondary-foreground">{item.kind}</span></span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{item.message}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{relativeTime(item.createdAt)}</span>
              </span>
            </button>
          ))}
          {!query.isLoading && !items.length ? <p className="p-8 text-center text-sm text-muted-foreground">No notifications yet.</p> : null}
        </div>
        <div className="border-t px-6 py-4"><Button variant="outline" className="w-full" disabled={!unread || markAll.isPending} onClick={() => markAll.mutate()}>Mark all as read</Button></div>
      </SheetContent>
    </Sheet>
  );
}
