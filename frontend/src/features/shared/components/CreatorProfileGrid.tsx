import { Link } from "@tanstack/react-router";
import { Instagram, Mail, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type CreatorProfileCard = {
  id: string;
  displayName: string;
  email?: string | null;
  instagramUsername?: string | null;
  status?: string | null;
  creatorCode?: string | null;
  detailPath: string;
  detailParams: Record<string, string>;
  meta?: Array<{ label: string; value: string }>;
};

const avatarTones = [
  "bg-coral/15 text-coral",
  "bg-primary/15 text-primary",
  "bg-teal/15 text-teal",
  "bg-indigo/15 text-indigo",
];

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "C"
  );
}

export function CreatorProfileGrid({
  creators,
  emptyMessage,
}: {
  creators: CreatorProfileCard[];
  emptyMessage: string;
}) {
  if (!creators.length) {
    return (
      <Card className="border-dashed shadow-card">
        <CardContent className="p-12 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {creators.map((creator, index) => {
        const active = creator.status?.toUpperCase() === "ACTIVE";

        return (
          <Card key={creator.id} className="group overflow-hidden shadow-card transition-shadow hover:shadow-lg">
            <div className="h-1.5 bg-gradient-to-r from-primary via-fuchsia-500 to-coral" />
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <span
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-bold ${avatarTones[index % avatarTones.length]}`}
                >
                  {initials(creator.displayName)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg font-semibold">{creator.displayName}</p>
                  {creator.instagramUsername ? (
                    <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-pink-600 dark:text-pink-400">
                      <Instagram className="h-3.5 w-3.5" /> @{creator.instagramUsername}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-sm text-muted-foreground">Instagram not connected</p>
                  )}
                </div>
                {creator.status ? (
                  <Badge
                    variant="outline"
                    className={active ? "border-teal/30 bg-teal/5 text-teal" : "bg-muted text-muted-foreground"}
                  >
                    {active ? "Active" : creator.status.toLowerCase()}
                  </Badge>
                ) : null}
              </div>

              <div className="mt-5 space-y-2 border-y py-3 text-sm">
                {creator.email ? (
                  <p className="flex items-center gap-2 truncate text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" /> {creator.email}
                  </p>
                ) : null}
                {creator.creatorCode ? (
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Creator code · {creator.creatorCode}
                  </p>
                ) : null}
                {!creator.email && !creator.creatorCode ? (
                  <p className="text-sm text-muted-foreground">Platform creator profile</p>
                ) : null}
              </div>

              {creator.meta?.length ? (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {creator.meta.map((item) => (
                    <div key={item.label}>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p>
                      <p className="mt-0.5 text-sm font-semibold">{item.value}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              <Button asChild variant="outline" className="mt-5 w-full group-hover:border-primary/40 group-hover:text-primary">
                <Link to={creator.detailPath as never} params={creator.detailParams}>
                  <UserRound className="h-4 w-4" /> View profile
                </Link>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
