import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Copy,
  Check,
  Share2,
  ExternalLink,
  MessageCircle,
  Facebook,
  Instagram,
  Globe,
  Sliders,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export interface PlatformLinkItem {
  id: string;
  baseUrl: string; // e.g. "https://brand.com/r/slug" or "/r/slug"
  productName?: string | null;
  creatorName?: string | null;
  creatorCode?: string | null;
  storeName?: string;
  commissionRate?: number;
  slug: string;
}

interface PlatformLinkGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  linkItem: PlatformLinkItem | null;
}

export const PlatformLinkGeneratorModal: React.FC<PlatformLinkGeneratorModalProps> = ({
  open,
  onOpenChange,
  linkItem,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("whatsapp");

  // Custom UTM parameters
  const [customSource, setCustomSource] = useState<string>("whatsapp");
  const [customMedium, setCustomMedium] = useState<string>("social_chat");
  const [customCampaign, setCustomCampaign] = useState<string>("");
  const [customDiscountCode, setCustomDiscountCode] = useState<string>("");

  React.useEffect(() => {
    if (linkItem) {
      const cleanSlug = linkItem.productName
        ? linkItem.productName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24)
        : linkItem.creatorCode
        ? `${linkItem.creatorCode.toLowerCase()}-promo`
        : "campaign";
      setCustomCampaign(cleanSlug);
      setCustomDiscountCode(linkItem.creatorCode || "");
    }
  }, [linkItem]);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success("Platform tracking link copied to clipboard!");
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  if (!linkItem) return null;

  const rawBase = linkItem.baseUrl.startsWith("http")
    ? linkItem.baseUrl
    : `${window.location.origin}${linkItem.baseUrl.startsWith("/") ? "" : "/"}${linkItem.baseUrl}`;

  const cleanCampaign =
    customCampaign.trim() ||
    (linkItem.creatorCode ? `${linkItem.creatorCode.toLowerCase()}-promo` : "referral");

  // 1. WhatsApp Dedicated Link & Share Copy
  const whatsappUrl = `${rawBase}?utm_source=whatsapp&utm_medium=social_chat&utm_campaign=${encodeURIComponent(cleanCampaign)}`;
  const whatsappMessage = `Hey! Check out ${
    linkItem.productName ? `*${linkItem.productName}*` : `these exclusive picks`
  } from *${linkItem.storeName || "our brand"}*! 🎁\n\n👉 Shop directly here: ${whatsappUrl}${
    linkItem.creatorCode ? `\n(Use code: *${linkItem.creatorCode}* at checkout)` : ""
  }`;

  // 2. Facebook Dedicated Link
  const facebookUrl = `${rawBase}?utm_source=facebook&utm_medium=social_post&utm_campaign=${encodeURIComponent(cleanCampaign)}`;

  // 3. Instagram / Story Dedicated Link
  const instagramUrl = `${rawBase}?utm_source=instagram&utm_medium=story_bio&utm_campaign=${encodeURIComponent(cleanCampaign)}`;

  // 4. Custom UTM Link
  const customUrl = `${rawBase}?utm_source=${encodeURIComponent(
    customSource || "direct",
  )}&utm_medium=${encodeURIComponent(
    customMedium || "referral",
  )}&utm_campaign=${encodeURIComponent(cleanCampaign)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6 rounded-2xl">
        <DialogHeader className="pr-8">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
              <Share2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base sm:text-lg font-bold leading-tight truncate">
                Platform-Specific Campaign Link Hub
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 leading-normal">
                Generate dedicated links with pre-tagged UTM sources for WhatsApp, Facebook, and Instagram.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Selected Product / Creator Summary Banner */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-muted/40 border border-border space-y-1.5 text-xs min-w-0">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="font-bold text-foreground truncate min-w-0">
              {linkItem.productName ? `Product: ${linkItem.productName}` : "Entire Storefront Link"}
            </span>
            {linkItem.commissionRate !== undefined && (
              <Badge variant="secondary" className="bg-teal/10 text-teal text-[10px] font-bold shrink-0">
                {linkItem.commissionRate}% Commission
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-[11px] font-mono">
            <span>Creator: {linkItem.creatorName || "Storewide"}</span>
            {linkItem.creatorCode && (
              <span className="text-primary font-semibold">Code: #{linkItem.creatorCode}</span>
            )}
          </div>
        </div>

        {/* Platform Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4 min-w-0">
          <TabsList className="grid grid-cols-4 w-full h-auto p-1 bg-muted/60 rounded-xl gap-1">
            {/* WhatsApp Tab Button */}
            <TabsTrigger
              value="whatsapp"
              className="flex items-center justify-center gap-1.5 text-xs py-2 px-1 sm:px-2 min-w-0 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg transition-all"
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline truncate">WhatsApp</span>
            </TabsTrigger>

            {/* Facebook Tab Button */}
            <TabsTrigger
              value="facebook"
              className="flex items-center justify-center gap-1.5 text-xs py-2 px-1 sm:px-2 min-w-0 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg transition-all"
            >
              <Facebook className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline truncate">Facebook</span>
            </TabsTrigger>

            {/* Instagram Tab Button */}
            <TabsTrigger
              value="instagram"
              className="flex items-center justify-center gap-1.5 text-xs py-2 px-1 sm:px-2 min-w-0 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg transition-all"
            >
              <Instagram className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline truncate">Instagram</span>
            </TabsTrigger>

            {/* Custom UTM Builder */}
            <TabsTrigger
              value="custom"
              className="flex items-center justify-center gap-1.5 text-xs py-2 px-1 sm:px-2 min-w-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all"
            >
              <Sliders className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline truncate">Custom</span>
            </TabsTrigger>
          </TabsList>

          {/* 1. WHATSAPP SECTION */}
          <TabsContent value="whatsapp" className="space-y-4 animate-in fade-in duration-200 mt-0">
            <div className="p-3.5 sm:p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-3 min-w-0">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm min-w-0">
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  <span className="truncate">WhatsApp Broadcast & Chat Link</span>
                </div>
                <Badge className="bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 text-[10px] shrink-0">
                  utm_source=whatsapp
                </Badge>
              </div>

              <div className="space-y-1.5 min-w-0">
                <Label className="text-xs text-muted-foreground">Generated WhatsApp Tracking Link</Label>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-background border text-xs font-mono min-w-0">
                  <span className="truncate flex-1 min-w-0 text-foreground select-all">{whatsappUrl}</span>
                  <Button
                    size="sm"
                    onClick={() => handleCopy(whatsappUrl, "wa_link")}
                    className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 text-xs font-bold"
                  >
                    {copiedKey === "wa_link" ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                    {copiedKey === "wa_link" ? "Copied" : "Copy Link"}
                  </Button>
                </div>
              </div>

              {/* Ready-to-Send Social Message Preview */}
              <div className="space-y-1.5 min-w-0">
                <Label className="text-xs text-muted-foreground">Pre-Formatted Message Copy</Label>
                <div className="p-3 rounded-xl bg-background border text-xs whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-foreground leading-relaxed select-text">
                  {whatsappMessage}
                </div>
              </div>

              {/* 1-Click Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <Button
                  onClick={() => handleCopy(whatsappMessage, "wa_msg")}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-semibold h-9"
                >
                  {copiedKey === "wa_msg" ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                  {copiedKey === "wa_msg" ? "Copied Message!" : "Copy Full Message"}
                </Button>

                <Button
                  onClick={() =>
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`, "_blank")
                  }
                  size="sm"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-1.5 h-9"
                >
                  <MessageCircle className="h-4 w-4" /> Open WhatsApp
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* 2. FACEBOOK SECTION */}
          <TabsContent value="facebook" className="space-y-4 animate-in fade-in duration-200 mt-0">
            <div className="p-3.5 sm:p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 space-y-3 min-w-0">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm min-w-0">
                  <Facebook className="h-4 w-4 shrink-0" />
                  <span className="truncate">Facebook Posts & Ads Link</span>
                </div>
                <Badge className="bg-blue-600/15 text-blue-600 dark:text-blue-400 text-[10px] shrink-0">
                  utm_source=facebook
                </Badge>
              </div>

              <div className="space-y-1.5 min-w-0">
                <Label className="text-xs text-muted-foreground">Generated Facebook Campaign URL</Label>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-background border text-xs font-mono min-w-0">
                  <span className="truncate flex-1 min-w-0 text-foreground select-all">{facebookUrl}</span>
                  <Button
                    size="sm"
                    onClick={() => handleCopy(facebookUrl, "fb_link")}
                    className="h-7 px-2.5 bg-blue-600 hover:bg-blue-500 text-white shrink-0 text-xs font-bold"
                  >
                    {copiedKey === "fb_link" ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                    {copiedKey === "fb_link" ? "Copied" : "Copy Link"}
                  </Button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-background/80 border text-[11px] text-muted-foreground leading-relaxed">
                💡 <strong>Facebook Sharing Tip:</strong> Paste this URL in Facebook Feed Posts, Groups, or Facebook Ad Campaign landing URLs to attribute clicks and orders automatically to this influencer.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <Button
                  onClick={() => handleCopy(facebookUrl, "fb_copy_btn")}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-semibold h-9"
                >
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copy Facebook Link
                </Button>

                <Button
                  onClick={() =>
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(facebookUrl)}`, "_blank")
                  }
                  size="sm"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold gap-1.5 h-9"
                >
                  <Facebook className="h-4 w-4" /> Post on Facebook
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* 3. INSTAGRAM SECTION */}
          <TabsContent value="instagram" className="space-y-4 animate-in fade-in duration-200 mt-0">
            <div className="p-3.5 sm:p-4 rounded-2xl border border-pink-500/20 bg-pink-500/5 space-y-3 min-w-0">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 font-bold text-sm min-w-0">
                  <Instagram className="h-4 w-4 shrink-0" />
                  <span className="truncate">Instagram Story Sticker & Bio Link</span>
                </div>
                <Badge className="bg-pink-600/15 text-pink-600 dark:text-pink-400 text-[10px] shrink-0">
                  utm_source=instagram
                </Badge>
              </div>

              <div className="space-y-1.5 min-w-0">
                <Label className="text-xs text-muted-foreground">Instagram Story & Bio URL</Label>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-background border text-xs font-mono min-w-0">
                  <span className="truncate flex-1 min-w-0 text-foreground select-all">{instagramUrl}</span>
                  <Button
                    size="sm"
                    onClick={() => handleCopy(instagramUrl, "ig_link")}
                    className="h-7 px-2.5 bg-pink-600 hover:bg-pink-500 text-white shrink-0 text-xs font-bold"
                  >
                    {copiedKey === "ig_link" ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                    {copiedKey === "ig_link" ? "Copied" : "Copy Link"}
                  </Button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-background/80 border text-[11px] text-muted-foreground leading-relaxed">
                📸 <strong>Instagram Tip:</strong> Add this as a <strong>Link Sticker</strong> in your Instagram Story, or put it in your profile <strong>Link in Bio</strong> to track conversions from followers!
              </div>

              <div className="pt-1">
                <Button
                  onClick={() => handleCopy(instagramUrl, "ig_copy_btn")}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-semibold h-9"
                >
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copy Instagram Link for Bio/Story
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* 4. CUSTOM UTM BUILDER */}
          <TabsContent value="custom" className="space-y-4 animate-in fade-in duration-200 mt-0">
            <div className="p-3.5 sm:p-4 rounded-2xl border border-border bg-card space-y-3 min-w-0">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 font-bold text-sm text-foreground min-w-0">
                  <Globe className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate">Custom Campaign UTM Generator</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">UTM Source (Platform)</Label>
                  <Input
                    placeholder="e.g. youtube, tiktok, email"
                    value={customSource}
                    onChange={(e) => setCustomSource(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">UTM Medium</Label>
                  <Input
                    placeholder="e.g. video, reel, newsletter"
                    value={customMedium}
                    onChange={(e) => setCustomMedium(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">UTM Campaign Name</Label>
                  <Input
                    placeholder="e.g. summer-flash-sale"
                    value={customCampaign}
                    onChange={(e) => setCustomCampaign(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-1 min-w-0">
                <Label className="text-xs text-muted-foreground">Generated Custom URL</Label>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/40 border text-xs font-mono min-w-0">
                  <span className="truncate flex-1 min-w-0 text-foreground select-all">{customUrl}</span>
                  <Button
                    size="sm"
                    onClick={() => handleCopy(customUrl, "custom_link")}
                    className="h-7 px-2.5 shrink-0 text-xs font-bold"
                  >
                    {copiedKey === "custom_link" ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                    {copiedKey === "custom_link" ? "Copied" : "Copy Link"}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
