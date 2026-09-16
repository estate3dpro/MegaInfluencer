/** Extra demo data for the Influencer workspace (extends src/data/demo.ts). */

export const faqs = [
  {
    q: "How and when do I get paid?",
    a: "Payouts run every Monday and Thursday for approved commissions older than 10 days. You can also request an on-demand payout from the Earnings page once your available balance crosses ₹500.",
  },
  {
    q: "How is my commission rate decided?",
    a: "Each brand sets a commission rate per campaign, shown on the campaign card before you apply. Your effective rate can also improve with your creator tier (Rising → Silver → Gold).",
  },
  {
    q: "Why was an order commission reversed?",
    a: "Commissions are reversed if the underlying order is cancelled, returned, or refunded within the brand's return window (typically 10 days after delivery).",
  },
  {
    q: "Can I promote the same product on multiple platforms?",
    a: "Yes — generate a separate affiliate link for each platform (Instagram, YouTube, WhatsApp) so you can track performance individually in the Links page.",
  },
  {
    q: "How does the Instagram comment automation work?",
    a: "When a trigger keyword is detected in a comment on your post, we automatically send the commenter a DM containing your affiliate link. You can edit triggers and templates anytime.",
  },
  {
    q: "What happens if I don't meet campaign requirements?",
    a: "Brands may pause or reject your application if content requirements (reels, stories, hashtags) aren't met within the campaign window. Always check the requirements checklist in the campaign drawer.",
  },
];

export const helpArticles = [
  { id: "ART-1", topic: "Getting started", title: "Setting up your creator storefront", read: "4 min read" },
  { id: "ART-2", topic: "Getting started", title: "Connecting Instagram & YouTube", read: "3 min read" },
  { id: "ART-3", topic: "Earnings", title: "Understanding commission & payout cycles", read: "5 min read" },
  { id: "ART-4", topic: "Earnings", title: "Tax documents (PAN/GST) for creators", read: "3 min read" },
  { id: "ART-5", topic: "Campaigns", title: "How to get approved faster for campaigns", read: "6 min read" },
  { id: "ART-6", topic: "Automation", title: "Building your first Instagram DM automation", read: "5 min read" },
];

export type Ticket = {
  id: string;
  subject: string;
  category: "Payments" | "Campaigns" | "Technical" | "Account" | "Other";
  status: "open" | "pending" | "resolved";
  updated: string;
  description: string;
};

export const tickets: Ticket[] = [
  { id: "TCK-3301", subject: "Payout stuck in processing for 4 days", category: "Payments", status: "open", updated: "2 hours ago", description: "My UPI payout of ₹26,400 has been processing since Monday." },
  { id: "TCK-3298", subject: "Campaign application not showing status", category: "Campaigns", status: "pending", updated: "1 day ago", description: "Applied to Bridal Season Spotlight but it still shows blank status." },
  { id: "TCK-3280", subject: "Unable to connect YouTube account", category: "Technical", status: "resolved", updated: "5 days ago", description: "OAuth screen kept failing — resolved after clearing cache." },
  { id: "TCK-3265", subject: "Update PAN details on file", category: "Account", status: "resolved", updated: "9 days ago", description: "Needed to correct a typo in my PAN number." },
];

export const contactChannels = [
  { id: "chat", label: "Live chat", detail: "Avg. response in 3 minutes", hours: "9 AM – 9 PM IST" },
  { id: "email", label: "Email support", detail: "creators@plat.fm", hours: "Reply within 24 hours" },
  { id: "call", label: "Priority call-back", detail: "For Gold tier creators", hours: "Mon–Sat, 10 AM – 7 PM" },
];

export type Automation = {
  id: string;
  name: string;
  trigger: string;
  action: string;
  product: string;
  status: boolean;
  replies: number;
  dm: number;
};

export const automations: Automation[] = [
  { id: "AUT-1", name: "Comment → DM link", trigger: "Comment contains 'LINK'", action: "Send DM with product link", product: "Vitamin C Face Serum", status: true, replies: 1284, dm: 962 },
  { id: "AUT-2", name: "Story reply → link", trigger: "Story reply contains 'PRICE'", action: "Send DM with product link", product: "Banarasi Silk Saree", status: true, replies: 486, dm: 401 },
  { id: "AUT-3", name: "Keyword 'CODE' → discount", trigger: "Comment contains 'CODE'", action: "Send DM with discount code", product: "Brass Jhumka Earrings", status: false, replies: 210, dm: 168 },
];

export const automationHistory = [
  { id: "EX-1", time: "Today, 10:42 AM", automation: "Comment → DM link", user: "@shalu.styles", result: "DM sent" },
  { id: "EX-2", time: "Today, 9:58 AM", automation: "Comment → DM link", user: "@ritika_official", result: "DM sent" },
  { id: "EX-3", time: "Today, 9:20 AM", automation: "Story reply → link", user: "@ananya.k", result: "DM sent" },
  { id: "EX-4", time: "Yesterday, 6:12 PM", automation: "Comment → DM link", user: "@priya.nair", result: "Failed — DM disabled" },
  { id: "EX-5", time: "Yesterday, 4:04 PM", automation: "Keyword 'CODE' → discount", user: "@kritika.b", result: "DM sent" },
];

export const dmTemplates = [
  { id: "TPL-1", name: "Friendly link drop", body: "Heyy! 💛 Here's the link to shop it: {{link}} — use code MEERA10 for 10% off!" },
  { id: "TPL-2", name: "Restock alert", body: "It's back! 🎉 Grab it before it's gone: {{link}}" },
  { id: "TPL-3", name: "Discount reveal", body: "Shh, here's your secret code: MEERA10 🤫 Shop here: {{link}}" },
];

export const storeCollections = [
  { id: "COL-1", name: "Festive Picks", items: 12, cover: "coral" as const },
  { id: "COL-2", name: "Everyday Basics", items: 18, cover: "indigo" as const },
  { id: "COL-3", name: "Glow Kit Favourites", items: 9, cover: "violet" as const },
  { id: "COL-4", name: "Monsoon Edit", items: 7, cover: "teal" as const },
];

export const linkSparklines: Record<string, number[]> = {
  "LNK-701": [12, 18, 15, 22, 28, 24, 30],
  "LNK-702": [8, 14, 12, 19, 17, 22, 26],
  "LNK-703": [20, 16, 24, 18, 22, 19, 25],
  "LNK-704": [10, 12, 16, 14, 20, 24, 22],
  "LNK-705": [14, 10, 9, 12, 8, 11, 10],
  "LNK-706": [6, 9, 11, 13, 12, 16, 18],
};
