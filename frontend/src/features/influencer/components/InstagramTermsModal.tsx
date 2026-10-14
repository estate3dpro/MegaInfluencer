import { useState } from "react";
import { ExternalLink, Instagram, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface InstagramTermsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function InstagramTermsModal({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: InstagramTermsModalProps) {
  const [agreed, setAgreed] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) setAgreed(false);
    onOpenChange(nextOpen);
  }

  function handleProceed() {
    if (!agreed || isLoading) return;
    onConfirm();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[490px]">
        <DialogHeader className="gap-2.5">
          <div className="flex items-center justify-between">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400">
              <Instagram className="h-5 w-5" />
            </div>
            <Badge
              variant="outline"
              className="text-[11px] font-medium border-pink-500/25 text-pink-600 dark:text-pink-400 gap-1 px-2 py-0.5"
            >
              <ShieldCheck className="h-3 w-3" /> Meta Platform Compliance
            </Badge>
          </div>
          <div>
            <DialogTitle className="text-base font-semibold text-foreground">
              Connect Instagram & Terms of Service
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Review our platform policies, data handling terms, and permissions before linking your Instagram account.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 py-1 text-xs">
          {/* Scrollable Legal Policies & Conditions Viewer */}
          <div className="h-52 overflow-y-auto rounded-xl border bg-muted/30 p-3.5 text-xs text-muted-foreground space-y-3.5 font-normal leading-relaxed divide-y divide-border/40">
            <div>
              <h4 className="font-semibold text-foreground text-xs mb-1">
                1. Scope of Instagram Permissions Requested
              </h4>
              <p>
                MegaInfluencer connects through official Meta Graph APIs to read public profile details (handle, bio, follower count), access media post insights, monitor comments on campaign posts for trigger keywords, and send automated direct messages with your tracked promotional links.
              </p>
            </div>

            <div className="pt-3">
              <h4 className="font-semibold text-foreground text-xs mb-1">
                2. Data Privacy & Token Security
              </h4>
              <p>
                Authentication occurs directly on Meta&apos;s OAuth servers—MegaInfluencer never sees or stores your Instagram password. Access tokens are stored using strong AES-256 encryption. We do not sell, rent, or transfer your personal data or follower interactions to third-party ad brokers.
              </p>
            </div>

            <div className="pt-3">
              <h4 className="font-semibold text-foreground text-xs mb-1">
                3. Creator Conduct & Commercial Terms
              </h4>
              <p>
                You agree to comply with Meta&apos;s Community Guidelines and Platform Policies. Automated direct messaging must not be used for deceptive practices or spam. Attribution for clicks, orders, commission payouts, and sample barter shipments will be tracked according to your agreed store partnership terms.
              </p>
            </div>

            <div className="pt-3">
              <h4 className="font-semibold text-foreground text-xs mb-1">
                4. Revocation & Data Deletion Rights
              </h4>
              <p>
                You retain full ownership of your account and can disconnect MegaInfluencer at any time from your Profile or inside Instagram App Settings (<em>Website Permissions → Apps and Websites</em>). You may also request complete data and token deletion under our Data Deletion policy.
              </p>
            </div>
          </div>

          {/* Quick Legal Links */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground px-1 gap-1">
            <span>Official legal documentation:</span>
            <div className="flex items-center gap-2">
              <a
                href="/terms-of-service"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline font-semibold inline-flex items-center gap-0.5"
              >
                Terms <ExternalLink className="h-2.5 w-2.5" />
              </a>
              <span>•</span>
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline font-semibold inline-flex items-center gap-0.5"
              >
                Privacy <ExternalLink className="h-2.5 w-2.5" />
              </a>
              <span>•</span>
              <a
                href="/data-deletion"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline font-semibold inline-flex items-center gap-0.5"
              >
                Data Deletion <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          </div>

          {/* Consent Checkbox */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-start gap-2.5">
            <Checkbox
              id="instagram-terms-consent"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(Boolean(checked))}
              className="mt-0.5 shrink-0"
            />
            <label
              htmlFor="instagram-terms-consent"
              className="text-xs text-foreground leading-normal cursor-pointer select-none font-medium"
            >
              I have read and agree to the MegaInfluencer{" "}
              <a
                href="/terms-of-service"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline font-semibold"
                onClick={(e) => e.stopPropagation()}
              >
                Terms of Service
              </a>
              ,{" "}
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline font-semibold"
                onClick={(e) => e.stopPropagation()}
              >
                Privacy Policy
              </a>
              , and authorize MegaInfluencer to access my Instagram account under the policy terms disclosed above.
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!agreed || isLoading}
            onClick={handleProceed}
            className="text-xs font-semibold gap-1.5"
          >
            <Instagram className="h-3.5 w-3.5" />
            {isLoading ? "Redirecting to Meta..." : "Accept & Connect via Meta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
