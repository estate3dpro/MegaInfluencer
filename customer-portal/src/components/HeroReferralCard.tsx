import React, { useState } from 'react';
import { Copy, Check, QrCode, Share2, Sparkles, Send, MessageCircle, Mail, Gift, ArrowRight } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';

interface HeroReferralCardProps {
  shareUrl: string;
  creatorCode: string;
  storeName?: string;
  friendDiscountPercent?: number;
  rewardRatePercent?: number;
  onOpenStoreModal?: () => void;
}

export const HeroReferralCard: React.FC<HeroReferralCardProps> = ({
  shareUrl,
  creatorCode,
  storeName = 'Partner Store',
  friendDiscountPercent = 10,
  rewardRatePercent = 10,
  onOpenStoreModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#ec4899', '#f59e0b', '#10b981'],
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    triggerConfetti();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(creatorCode);
    setCopied(true);
    triggerConfetti();
    setTimeout(() => setCopied(false), 2500);
  };

  // Social sharing pre-filled text
  const shareMessage = `Hey! Here's ${friendDiscountPercent}% off your order at ${storeName}. Use my VIP link: ${shareUrl} or code ${creatorCode} at checkout! 🎁`;

  const shareWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`, '_blank');
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`, '_blank');
  };

  const shareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareMessage)}`, '_blank');
  };

  const shareEmail = () => {
    window.open(`mailto:?subject=${encodeURIComponent(`Special ${friendDiscountPercent}% Discount at ${storeName}`)}&body=${encodeURIComponent(shareMessage)}`, '_blank');
  };

  return (
    <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-indigo-500/20 bg-gradient-to-br from-slate-900/90 via-indigo-950/40 to-slate-900/90 shadow-2xl backdrop-blur-xl">
      {/* Decorative Glow Elements */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-pink-600/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Offer & Headline */}
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-pink-500/20 to-indigo-500/20 border border-pink-500/30 text-pink-300 text-xs font-bold uppercase tracking-wider">
            <Gift className="w-3.5 h-3.5 text-pink-400" />
            <span>Advocate Reward Program</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Share <span className="bg-gradient-to-r from-indigo-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">{storeName}</span>,<br />
            Earn Instant Rewards!
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed">
            Give your friends <span className="text-pink-400 font-bold">{friendDiscountPercent}% OFF</span> on their purchases. When they order, you earn <span className="text-amber-400 font-bold">{rewardRatePercent}% Cashback / Points</span> to redeem for gift cards, vouchers & cash!
          </p>

          {/* Incentive Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-slate-950/50 border border-white/5">
              <div className="text-xs text-slate-400">Friend Gets</div>
              <div className="text-lg font-bold text-pink-400">{friendDiscountPercent}% OFF</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/50 border border-white/5">
              <div className="text-xs text-slate-400">You Receive</div>
              <div className="text-lg font-bold text-amber-400">{rewardRatePercent}% Reward</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/50 border border-white/5 col-span-2 sm:col-span-1">
              <div className="text-xs text-slate-400">Payout Mode</div>
              <div className="text-lg font-bold text-emerald-400">UPI / Cash / Gift</div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Link Box & Share Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-950/90 border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Personal Referral Link</span>
              <button
                onClick={onOpenStoreModal}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                Change Store <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Link Copy Box */}
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-white/10 focus-within:border-indigo-500 transition-all">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full bg-transparent px-2 text-xs sm:text-sm font-mono text-indigo-200 outline-none select-all truncate"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>

            {/* Referral Promo Code */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20">
              <div>
                <div className="text-[11px] text-slate-400">Checkout Promo Code</div>
                <div className="text-sm font-mono font-bold text-white">{creatorCode}</div>
              </div>
              <button
                onClick={handleCopyCode}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 transition-colors"
              >
                Copy Code
              </button>
            </div>

            {/* Quick Share Buttons */}
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-2">Share directly with friends:</div>
              <div className="grid grid-cols-5 gap-2">
                <button
                  onClick={shareWhatsApp}
                  title="Share on WhatsApp"
                  className="flex items-center justify-center p-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 transition-all hover:scale-105"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
                <button
                  onClick={shareTwitter}
                  title="Share on Twitter / X"
                  className="flex items-center justify-center p-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-sky-400 hover:text-sky-300 transition-all hover:scale-105"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </button>
                <button
                  onClick={shareTelegram}
                  title="Share on Telegram"
                  className="flex items-center justify-center p-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 hover:text-blue-300 transition-all hover:scale-105"
                >
                  <Send className="w-5 h-5" />
                </button>
                <button
                  onClick={shareEmail}
                  title="Share via Email"
                  className="flex items-center justify-center p-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 hover:text-purple-300 transition-all hover:scale-105"
                >
                  <Mail className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowQrModal(true)}
                  title="Generate QR Code"
                  className="flex items-center justify-center p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 hover:text-white transition-all hover:scale-105"
                >
                  <QrCode className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl max-w-sm w-full text-center space-y-5 border border-white/15 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Your Referral QR Code</h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-inner">
              <QRCodeSVG value={shareUrl} size={200} level="H" includeMargin />
            </div>

            <p className="text-xs text-slate-300">
              Let your friends scan this QR code to instantly claim their {friendDiscountPercent}% discount!
            </p>

            <button
              onClick={handleCopy}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all"
            >
              {copied ? 'Link Copied!' : 'Copy Referral Link'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
