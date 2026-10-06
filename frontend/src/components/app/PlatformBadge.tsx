import React from "react";
import { MessageCircle, Facebook, Instagram, Link2, Share2, Globe, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PlatformBadgeProps {
  platform?: string | null;
  utmSource?: string | null;
  utmCampaign?: string | null;
  className?: string;
  showCampaign?: boolean;
}

export const PlatformBadge: React.FC<PlatformBadgeProps> = ({
  platform,
  utmSource,
  utmCampaign,
  className = "",
  showCampaign = false,
}) => {
  const p = (platform || utmSource || "DIRECT").toUpperCase();

  let badgeContent = null;

  if (p === "WHATSAPP" || p.includes("WHATSAPP") || p.includes("WA")) {
    badgeContent = (
      <Badge
        variant="outline"
        className={`border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold gap-1 py-0.5 px-2 text-[11px] ${className}`}
      >
        <MessageCircle className="h-3 w-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>WhatsApp</span>
      </Badge>
    );
  } else if (p === "FACEBOOK" || p.includes("FACEBOOK") || p.includes("FB")) {
    badgeContent = (
      <Badge
        variant="outline"
        className={`border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300 font-semibold gap-1 py-0.5 px-2 text-[11px] ${className}`}
      >
        <Facebook className="h-3 w-3 text-blue-600 dark:text-blue-400 shrink-0" />
        <span>Facebook</span>
      </Badge>
    );
  } else if (p === "INSTAGRAM" || p.includes("INSTAGRAM") || p.includes("IG")) {
    badgeContent = (
      <Badge
        variant="outline"
        className={`border-pink-500/40 bg-pink-500/10 text-pink-700 dark:text-pink-300 font-semibold gap-1 py-0.5 px-2 text-[11px] ${className}`}
      >
        <Instagram className="h-3 w-3 text-pink-600 dark:text-pink-400 shrink-0" />
        <span>Instagram</span>
      </Badge>
    );
  } else if (p === "YOUTUBE") {
    badgeContent = (
      <Badge
        variant="outline"
        className={`border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300 font-semibold gap-1 py-0.5 px-2 text-[11px] ${className}`}
      >
        <Globe className="h-3 w-3 text-red-600 shrink-0" />
        <span>YouTube</span>
      </Badge>
    );
  } else if (p === "TIKTOK") {
    badgeContent = (
      <Badge
        variant="outline"
        className={`border-neutral-500/40 bg-neutral-500/10 text-neutral-700 dark:text-neutral-300 font-semibold gap-1 py-0.5 px-2 text-[11px] ${className}`}
      >
        <Share2 className="h-3 w-3 text-neutral-600 shrink-0" />
        <span>TikTok</span>
      </Badge>
    );
  } else {
    badgeContent = (
      <Badge
        variant="outline"
        className={`border-primary/30 bg-primary/5 text-primary font-medium gap-1 py-0.5 px-2 text-[11px] ${className}`}
      >
        <Link2 className="h-3 w-3 text-primary shrink-0" />
        <span>{utmSource ? (utmSource.charAt(0).toUpperCase() + utmSource.slice(1)) : "Direct Link"}</span>
      </Badge>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      {badgeContent}
      {showCampaign && utmCampaign && (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded border">
          <Tag className="h-2.5 w-2.5" />
          {utmCampaign}
        </span>
      )}
    </div>
  );
};
