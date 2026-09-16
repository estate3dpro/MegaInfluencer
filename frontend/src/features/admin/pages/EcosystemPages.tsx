import { Boxes, Building2, Instagram, Megaphone, Sparkles, Store } from "lucide-react";
import { EcosystemPage } from "./EcosystemPage";

const data = {
  influencers: {
    title: "Influencers",
    description: "Manage creator accounts, verification and platform performance.",
    singular: "influencer",
    icon: Sparkles,
    metrics: [
      { label: "Total creators", value: "2,841", detail: "+12.4% this month" },
      { label: "Verified", value: "2,392", detail: "84.2% of creators" },
      { label: "Pending review", value: "24", detail: "6 require attention" },
    ],
    columns: ["Followers", "GMV", "Campaigns"],
    rows: [
      ["Aanya Shah", "@aanyacreates", ["284K", "₹3.64L", "8"], "Active"],
      ["Kabir Singh", "@kabir.edits", ["193K", "₹2.81L", "6"], "Active"],
      ["Mira Kapoor", "@mirastylefile", ["156K", "₹2.23L", "5"], "Pending"],
    ],
  },
  stores: {
    title: "Stores",
    description: "Monitor store onboarding, sales and creator collaborations.",
    singular: "store",
    icon: Store,
    metrics: [
      { label: "Active stores", value: "186", detail: "+8.2% this month" },
      { label: "Verified stores", value: "174", detail: "93.5% verified" },
      { label: "Total GMV", value: "₹24.8L", detail: "Last 30 days" },
    ],
    columns: ["Products", "Orders", "GMV"],
    rows: [
      ["Urban Threads", "Fashion & apparel", ["482", "2,184", "₹6.42L"], "Active"],
      ["Northstar Home", "Home & living", ["238", "1,362", "₹4.18L"], "Active"],
      ["Kora Collective", "Lifestyle", ["156", "978", "₹3.21L"], "Pending"],
    ],
  },
  brands: {
    title: "Brands",
    description: "Oversee partner brands and their marketplace participation.",
    singular: "brand",
    icon: Building2,
    metrics: [
      { label: "Partner brands", value: "74", detail: "+5 this quarter" },
      { label: "Live campaigns", value: "42", detail: "Across 31 brands" },
      { label: "Brand spend", value: "₹8.9L", detail: "Last 30 days" },
    ],
    columns: ["Stores", "Campaigns", "Spend"],
    rows: [
      ["Urban Collective", "Fashion group", ["4", "7", "₹2.82L"], "Active"],
      ["Northstar Group", "Home group", ["2", "5", "₹1.76L"], "Active"],
      ["Mode & Co.", "Lifestyle group", ["1", "3", "₹1.14L"], "Active"],
    ],
  },
  products: {
    title: "Products",
    description: "Review marketplace products, inventory and sales performance.",
    singular: "product",
    icon: Boxes,
    metrics: [
      { label: "Live products", value: "8,426", detail: "+324 this month" },
      { label: "Low stock", value: "42", detail: "Across 18 stores" },
      { label: "Product sales", value: "₹24.8L", detail: "Last 30 days" },
    ],
    columns: ["Store", "Orders", "Revenue"],
    rows: [
      ["Linen Overshirt", "SKU: UT-LOS-021", ["Urban Threads", "842", "₹10.94L"], "Active"],
      ["Woven Throw", "SKU: NS-WTH-011", ["Northstar Home", "468", "₹3.98L"], "Active"],
      ["Everyday Tote", "SKU: KC-ETO-003", ["Kora Collective", "382", "₹2.29L"], "Active"],
    ],
  },
  campaigns: {
    title: "Campaigns",
    description: "Review campaign delivery, creator participation and revenue impact.",
    singular: "campaign",
    icon: Megaphone,
    metrics: [
      { label: "Live campaigns", value: "42", detail: "8 closing this week" },
      { label: "Active creators", value: "1,286", detail: "Across live campaigns" },
      { label: "Attributed GMV", value: "₹16.9L", detail: "Last 30 days" },
    ],
    columns: ["Brand", "Creators", "Revenue"],
    rows: [
      ["Monsoon Essentials", "Ends Sep 30", ["Urban Threads", "156", "₹4.82L"], "Live"],
      ["Home Refresh", "Ends Oct 08", ["Northstar Home", "94", "₹3.76L"], "Live"],
      ["Weekend Edit", "Starts Oct 01", ["Kora Collective", "128", "—"], "Pending"],
    ],
  },
  social: {
    title: "Social accounts",
    description: "Monitor connected social accounts and integration health.",
    singular: "account",
    icon: Instagram,
    metrics: [
      { label: "Connected accounts", value: "2,392", detail: "+96 this month" },
      { label: "Healthy connections", value: "2,318", detail: "96.9% connected" },
      { label: "Needs reconnection", value: "74", detail: "Token or permission issue" },
    ],
    columns: ["Platform", "Followers", "Last sync"],
    rows: [
      ["Aanya Shah", "@aanyacreates", ["Instagram", "284K", "4 min ago"], "Connected"],
      ["Kabir Singh", "@kabir.edits", ["Instagram", "193K", "12 min ago"], "Connected"],
      ["Mira Kapoor", "@mirastylefile", ["Instagram", "156K", "2 hrs ago"], "Reconnect"],
    ],
  },
} as const;

type EcosystemKey = keyof typeof data;

function makePage(key: EcosystemKey) {
  return () => <EcosystemPage config={data[key]} />;
}
export const InfluencersPage = makePage("influencers");
export const StoresPage = makePage("stores");
export const BrandsPage = makePage("brands");
export const ProductsPage = makePage("products");
export const CampaignsPage = makePage("campaigns");
export const SocialPage = makePage("social");
