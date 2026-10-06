import React, { useState } from 'react';
import {
  Copy,
  Check,
  QrCode,
  Share2,
  Sparkles,
  Send,
  MessageCircle,
  Mail,
  Gift,
  ArrowRight,
  Store,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface HeroReferralCardProps {
  shareUrl: string;
  creatorCode: string;
  storeName?: string;
  friendDiscountPercent?: number;
  rewardRatePercent?: number;
  rewardMode?: string;
  onOpenStoreModal?: () => void;
}

export const HeroReferralCard: React.FC<HeroReferralCardProps> = ({
  shareUrl,
  creatorCode,
  storeName = 'Partner Brand',
  friendDiscountPercent = 10,
  rewardRatePercent = 10,
  rewardMode = 'POINTS',
  onOpenStoreModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const triggerConfetti = () => {
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.65 },
      colors: ['#6c5ce7', '#ec4899', '#f59e0b', '#20b8a6'],
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    triggerConfetti();
    setTimeout(() => setCopied(false), 2200);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(creatorCode);
    setCopiedCode(true);
    triggerConfetti();
    setTimeout(() => setCopiedCode(false), 2200);
  };

  const shareMessage = `Hey! Here's ${friendDiscountPercent}% off your next order at ${storeName}. Use my VIP link: ${shareUrl} or code ${creatorCode} at checkout! 🎁`;

  const shareWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`, '_blank');
  };

  const shareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareMessage)}`, '_blank');
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`, '_blank');
  };

  const shareEmail = () => {
    window.open(`mailto:?subject=${encodeURIComponent(`Special ${friendDiscountPercent}% Discount at ${storeName}`)}&body=${encodeURIComponent(shareMessage)}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Get ${friendDiscountPercent}% off at ${storeName}`,
          text: shareMessage,
          url: shareUrl,
        });
      } catch (e) {
        // User cancelled or not supported
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl p-5 sm:p-7 border border-primary/20 bg-gradient-to-br from-card via-card/95 to-primary/5 shadow-xl transition-all">
      {/* Decorative Blur Orbs */}
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-coral/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold uppercase tracking-wider">
            <Gift className="w-3.5 h-3.5" />
            <span>Advocate VIP Program</span>
          </div>

          <button
            onClick={onOpenStoreModal}
            className="text-[11px] font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-primary/10"
          >
            <Store className="w-3 h-3" />
            <span className="truncate max-w-[110px]">{storeName}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Main Headline */}
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground leading-snug">
            Share <span className="bg-gradient-to-r from-primary via-violet-500 to-coral bg-clip-text text-transparent">{storeName}</span>, Earn Rewards!
          </h1>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Friends get <span className="text-coral font-bold">{friendDiscountPercent}% OFF</span>. You earn instant tokens on every referral order.
          </p>
        </div>

        {/* Mobile 2-Pill Incentive Banner */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-2.5 rounded-2xl bg-card border border-border shadow-xs text-center">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground block">Friend Gets</span>
            <span className="text-sm sm:text-base font-extrabold text-coral">{friendDiscountPercent}% Discount</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-card border border-border shadow-xs text-center">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground block">You Earn</span>
            <span className="text-sm sm:text-base font-extrabold text-primary">{rewardRatePercent}% in Tokens</span>
          </div>
        </div>

        {/* Primary Interactive Share Box */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-background/90 border border-border space-y-3 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
            <span>Your Personal Referral Link</span>
            <button
              onClick={() => setShowQrModal(true)}
              className="text-primary hover:underline flex items-center gap-1 cursor-pointer font-bold"
            >
              <QrCode className="w-3.5 h-3.5" /> Show QR
            </button>
          </div>

          {/* Copy Link Field */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-card border border-border focus-within:border-primary transition-all">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full bg-transparent px-2 text-xs font-mono text-foreground outline-none select-all truncate"
            />
            <Button
              onClick={handleCopy}
              size="sm"
              className={`h-8 px-3 rounded-lg text-xs font-bold shrink-0 transition-all ${
                copied
                  ? 'bg-teal text-white shadow-sm'
                  : 'bg-primary hover:bg-primary/90 text-white shadow-sm'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" /> Copy Link
                </>
              )}
            </Button>
          </div>

          {/* Promo Code & Native 1-Tap Share Bar */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/20 text-xs cursor-pointer transition-colors"
            >
              <span className="text-[11px] text-muted-foreground">Code:</span>
              <span className="font-mono font-bold text-foreground">#{creatorCode}</span>
              {copiedCode ? <Check className="w-3 h-3 text-teal" /> : <Copy className="w-3 h-3 text-primary" />}
            </div>

            <Button
              onClick={handleNativeShare}
              variant="outline"
              size="sm"
              className="h-8 rounded-xl text-xs font-bold gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
            >
              <Share2 className="w-3.5 h-3.5" /> Share
            </Button>
          </div>

          {/* Quick 1-Tap App Share Buttons */}
          <div className="grid grid-cols-4 gap-2 pt-1 border-t border-border/60">
            <button
              onClick={shareWhatsApp}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">WhatsApp</span>
            </button>

            <button
              onClick={shareTelegram}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
            >
              <Send className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">Telegram</span>
            </button>

            <button
              onClick={shareTwitter}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-foreground border border-border text-xs font-semibold transition-all active:scale-95 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 fill-current mb-0.5" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span className="text-[10px]">X / Post</span>
            </button>

            <button
              onClick={shareEmail}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-500/20 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
            >
              <Mail className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">Email</span>
            </button>
          </div>
        </div>
      </div>

      {/* QR Code Modal / Drawer */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="p-6 rounded-3xl max-w-xs w-full text-center space-y-4 bg-card border border-border shadow-2xl relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">Scan & Shop</h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="w-7 h-7 rounded-full bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-white rounded-2xl inline-block shadow-inner">
              <QRCodeSVG value={shareUrl} size={180} level="H" includeMargin />
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Show this QR code to friends to instantly grant them {friendDiscountPercent}% OFF at {storeName}.
            </p>

            <Button
              onClick={handleCopy}
              className="w-full h-10 rounded-xl bg-primary text-white font-bold text-xs"
            >
              {copied ? 'Link Copied!' : 'Copy Referral Link'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
