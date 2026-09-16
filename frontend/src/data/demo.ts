/** Shared demo dataset for the Platform workspaces (no backend yet). */

export const creator = {
  name: "Meera Kapoor",
  handle: "@meerakapoor",
  city: "Mumbai, Maharashtra",
  bio: "Fashion & lifestyle creator. Sustainable Indian labels, everyday styling, and honest hauls.",
  categories: ["Fashion", "Beauty", "Lifestyle", "Travel"],
  instagram: 125000,
  youtube: 82000,
  earnings: 184240,
  orders: 1248,
  clicks: 24820,
  conversion: 6.82,
  rating: 4.8,
};

export const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

export const earningsTrend = [
  { month: "Apr", earnings: 8600, orders: 62, clicks: 1420 },
  { month: "May", earnings: 10250, orders: 78, clicks: 1680 },
  { month: "Jun", earnings: 12480, orders: 91, clicks: 1980 },
  { month: "Jul", earnings: 14120, orders: 104, clicks: 2240 },
  { month: "Aug", earnings: 13260, orders: 96, clicks: 2110 },
  { month: "Sep", earnings: 16840, orders: 118, clicks: 2480 },
  { month: "Oct", earnings: 21460, orders: 148, clicks: 3120 },
  { month: "Nov", earnings: 24980, orders: 172, clicks: 3480 },
  { month: "Dec", earnings: 22140, orders: 158, clicks: 3210 },
  { month: "Jan", earnings: 18620, orders: 132, clicks: 2740 },
  { month: "Feb", earnings: 19980, orders: 141, clicks: 2860 },
  { month: "Mar", earnings: 23510, orders: 164, clicks: 3180 },
];

export const storeRevenueTrend = [
  { month: "Apr", revenue: 742000, orders: 218, creatorRevenue: 268000 },
  { month: "May", revenue: 812000, orders: 246, creatorRevenue: 302000 },
  { month: "Jun", revenue: 896000, orders: 268, creatorRevenue: 338000 },
  { month: "Jul", revenue: 948000, orders: 284, creatorRevenue: 361000 },
  { month: "Aug", revenue: 902000, orders: 271, creatorRevenue: 349000 },
  { month: "Sep", revenue: 1064000, orders: 312, creatorRevenue: 412000 },
  { month: "Oct", revenue: 1284000, orders: 342, creatorRevenue: 495000 },
  { month: "Nov", revenue: 1362000, orders: 368, creatorRevenue: 528000 },
  { month: "Dec", revenue: 1248000, orders: 336, creatorRevenue: 486000 },
  { month: "Jan", revenue: 1096000, orders: 298, creatorRevenue: 428000 },
  { month: "Feb", revenue: 1142000, orders: 308, creatorRevenue: 446000 },
  { month: "Mar", revenue: 1284000, orders: 342, creatorRevenue: 495000 },
];

export const ecosystemTrend = [
  { month: "Apr", gmv: 8420000, takeRate: 842000, influencers: 3120, stores: 218 },
  { month: "May", gmv: 9240000, takeRate: 924000, influencers: 3340, stores: 232 },
  { month: "Jun", gmv: 10120000, takeRate: 1012000, influencers: 3580, stores: 248 },
  { month: "Jul", gmv: 10860000, takeRate: 1086000, influencers: 3810, stores: 261 },
  { month: "Aug", gmv: 10420000, takeRate: 1042000, influencers: 3960, stores: 272 },
  { month: "Sep", gmv: 12140000, takeRate: 1214000, influencers: 4180, stores: 288 },
  { month: "Oct", gmv: 14800000, takeRate: 1480000, influencers: 4420, stores: 302 },
  { month: "Nov", gmv: 15620000, takeRate: 1562000, influencers: 4610, stores: 311 },
  { month: "Dec", gmv: 14280000, takeRate: 1428000, influencers: 4680, stores: 316 },
  { month: "Jan", gmv: 13180000, takeRate: 1318000, influencers: 4720, stores: 318 },
  { month: "Feb", gmv: 13940000, takeRate: 1394000, influencers: 4780, stores: 319 },
  { month: "Mar", gmv: 14800000, takeRate: 1480000, influencers: 4820, stores: 320 },
];

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  commission: number;
  clicks: number;
  sales: number;
  stock: number;
  status: "active" | "draft" | "paused";
  creators: number;
};

export const products: Product[] = [
  { id: "PRD-1042", name: "Handloom Cotton Kurta", brand: "Anarkali Fashion", category: "Ethnic", price: 2499, commission: 15, clicks: 4820, sales: 268, stock: 142, status: "active", creators: 24 },
  { id: "PRD-1043", name: "Oversized Denim Jacket", brand: "Urban Threads", category: "Western", price: 3299, commission: 12, clicks: 3960, sales: 214, stock: 86, status: "active", creators: 18 },
  { id: "PRD-1044", name: "Banarasi Silk Saree", brand: "Anarkali Fashion", category: "Ethnic", price: 8999, commission: 18, clicks: 3210, sales: 132, stock: 34, status: "active", creators: 31 },
  { id: "PRD-1045", name: "Everyday Linen Shirt", brand: "Urban Threads", category: "Western", price: 1899, commission: 10, clicks: 2870, sales: 196, stock: 210, status: "active", creators: 12 },
  { id: "PRD-1046", name: "Vitamin C Face Serum", brand: "Glow Ritual", category: "Beauty", price: 1299, commission: 22, clicks: 5420, sales: 342, stock: 480, status: "active", creators: 46 },
  { id: "PRD-1047", name: "Kolhapuri Leather Sandals", brand: "Desi Sole", category: "Footwear", price: 2199, commission: 14, clicks: 2140, sales: 118, stock: 0, status: "paused", creators: 9 },
  { id: "PRD-1048", name: "Brass Jhumka Earrings", brand: "Mitti Studio", category: "Jewellery", price: 899, commission: 25, clicks: 4310, sales: 386, stock: 320, status: "active", creators: 38 },
  { id: "PRD-1049", name: "Ayurvedic Hair Oil", brand: "Glow Ritual", category: "Beauty", price: 749, commission: 20, clicks: 3680, sales: 296, stock: 640, status: "active", creators: 27 },
  { id: "PRD-1050", name: "Block Print Bedsheet Set", brand: "Mitti Studio", category: "Home", price: 3499, commission: 16, clicks: 1620, sales: 74, stock: 96, status: "draft", creators: 4 },
  { id: "PRD-1051", name: "Athleisure Joggers", brand: "Urban Threads", category: "Western", price: 1699, commission: 11, clicks: 2480, sales: 162, stock: 178, status: "active", creators: 15 },
  { id: "PRD-1052", name: "Chikankari Dupatta", brand: "Anarkali Fashion", category: "Ethnic", price: 1599, commission: 17, clicks: 1980, sales: 108, stock: 122, status: "active", creators: 11 },
  { id: "PRD-1053", name: "Matte Lipstick Trio", brand: "Glow Ritual", category: "Beauty", price: 1099, commission: 24, clicks: 4020, sales: 284, stock: 410, status: "active", creators: 33 },
];

export type Creator = {
  id: string;
  name: string;
  handle: string;
  city: string;
  followers: number;
  campaigns: number;
  clicks: number;
  orders: number;
  revenue: number;
  commission: number;
  conversion: number;
  status: "active" | "pending" | "paused" | "suspended";
  verified: boolean;
  tier: "Gold" | "Silver" | "Rising";
  email: string;
};

export const creators: Creator[] = [
  { id: "CR-2001", name: "Meera Kapoor", handle: "@meerakapoor", city: "Mumbai", followers: 207000, campaigns: 14, clicks: 24820, orders: 1248, revenue: 1284000, commission: 184240, conversion: 6.82, status: "active", verified: true, tier: "Gold", email: "meera.kapoor@example.in" },
  { id: "CR-2002", name: "Rohan Mehta", handle: "@rohanstyles", city: "Delhi", followers: 148000, campaigns: 11, clicks: 18420, orders: 892, revenue: 964000, commission: 132600, conversion: 4.84, status: "active", verified: true, tier: "Gold", email: "rohan.mehta@example.in" },
  { id: "CR-2003", name: "Ananya Sharma", handle: "@ananyaglow", city: "Bengaluru", followers: 96000, campaigns: 9, clicks: 14260, orders: 684, revenue: 742000, commission: 98400, conversion: 4.8, status: "active", verified: true, tier: "Silver", email: "ananya.sharma@example.in" },
  { id: "CR-2004", name: "Kabir Nair", handle: "@kabirwears", city: "Kochi", followers: 62000, campaigns: 7, clicks: 9840, orders: 412, revenue: 486000, commission: 62800, conversion: 4.19, status: "active", verified: false, tier: "Silver", email: "kabir.nair@example.in" },
  { id: "CR-2005", name: "Ishita Rao", handle: "@ishitaroa", city: "Pune", followers: 48000, campaigns: 6, clicks: 7620, orders: 318, revenue: 362000, commission: 48200, conversion: 4.17, status: "pending", verified: false, tier: "Rising", email: "ishita.rao@example.in" },
  { id: "CR-2006", name: "Vivaan Gupta", handle: "@vivaanhaul", city: "Jaipur", followers: 38400, campaigns: 5, clicks: 6280, orders: 246, revenue: 284000, commission: 36400, conversion: 3.92, status: "active", verified: true, tier: "Rising", email: "vivaan.gupta@example.in" },
  { id: "CR-2007", name: "Diya Patel", handle: "@diyadaily", city: "Ahmedabad", followers: 92000, campaigns: 10, clicks: 13480, orders: 596, revenue: 668000, commission: 86200, conversion: 4.42, status: "active", verified: true, tier: "Silver", email: "diya.patel@example.in" },
  { id: "CR-2008", name: "Arjun Reddy", handle: "@arjunfits", city: "Hyderabad", followers: 71000, campaigns: 8, clicks: 10240, orders: 448, revenue: 512000, commission: 68400, conversion: 4.37, status: "paused", verified: true, tier: "Silver", email: "arjun.reddy@example.in" },
  { id: "CR-2009", name: "Saanvi Iyer", handle: "@saanviedit", city: "Chennai", followers: 54000, campaigns: 6, clicks: 8120, orders: 342, revenue: 398000, commission: 52600, conversion: 4.21, status: "active", verified: false, tier: "Rising", email: "saanvi.iyer@example.in" },
  { id: "CR-2010", name: "Aditya Joshi", handle: "@adityatalks", city: "Indore", followers: 29800, campaigns: 4, clicks: 4820, orders: 186, revenue: 214000, commission: 27800, conversion: 3.86, status: "suspended", verified: false, tier: "Rising", email: "aditya.joshi@example.in" },
];

export type Campaign = {
  id: string;
  name: string;
  brand: string;
  category: string;
  commission: number;
  budget: number;
  spent: number;
  potentialEarnings: number;
  creators: number;
  clicks: number;
  orders: number;
  revenue: number;
  status: "active" | "draft" | "completed" | "applied" | "review";
  starts: string;
  ends: string;
  requirements: string[];
};

export const campaigns: Campaign[] = [
  { id: "CMP-501", name: "Festive Ethnic Edit", brand: "Anarkali Fashion", category: "Ethnic", commission: 18, budget: 450000, spent: 286000, potentialEarnings: 25000, creators: 42, clicks: 18420, orders: 864, revenue: 1642000, status: "active", starts: "12 Aug", ends: "30 Sep", requirements: ["2 Reels + 4 Stories", "Tag @anarkalifashion", "Use #FestiveEthnicEdit"] },
  { id: "CMP-502", name: "Monsoon Streetwear Drop", brand: "Urban Threads", category: "Western", commission: 12, budget: 320000, spent: 198000, potentialEarnings: 18000, creators: 31, clicks: 14280, orders: 612, revenue: 1184000, status: "active", starts: "01 Jul", ends: "15 Sep", requirements: ["1 Reel + 1 YouTube short", "Link in bio for 7 days"] },
  { id: "CMP-503", name: "Glow Ritual Skin Sprint", brand: "Glow Ritual", category: "Beauty", commission: 22, budget: 280000, spent: 96000, potentialEarnings: 32000, creators: 58, clicks: 21640, orders: 948, revenue: 986000, status: "active", starts: "20 Aug", ends: "20 Oct", requirements: ["Before/after carousel", "Honest 14-day review"] },
  { id: "CMP-504", name: "Handcrafted Home Launch", brand: "Mitti Studio", category: "Home", commission: 16, budget: 180000, spent: 0, potentialEarnings: 14000, creators: 0, clicks: 0, orders: 0, revenue: 0, status: "draft", starts: "05 Oct", ends: "30 Nov", requirements: ["Studio-style flatlay", "1 Reel unboxing"] },
  { id: "CMP-505", name: "Republic Day Mega Sale", brand: "Urban Threads", category: "Western", commission: 14, budget: 620000, spent: 620000, potentialEarnings: 0, creators: 96, clicks: 42860, orders: 2184, revenue: 3860000, status: "completed", starts: "10 Jan", ends: "31 Jan", requirements: ["3 Stories daily", "Discount code in caption"] },
  { id: "CMP-506", name: "Desi Sole Summer Walk", brand: "Desi Sole", category: "Footwear", commission: 14, budget: 140000, spent: 62000, potentialEarnings: 11000, creators: 18, clicks: 6840, orders: 268, revenue: 486000, status: "applied", starts: "15 Sep", ends: "15 Nov", requirements: ["1 Reel styling 3 looks"] },
  { id: "CMP-507", name: "Bridal Season Spotlight", brand: "Anarkali Fashion", category: "Ethnic", commission: 20, budget: 520000, spent: 148000, potentialEarnings: 42000, creators: 26, clicks: 9240, orders: 318, revenue: 1284000, status: "review", starts: "01 Nov", ends: "31 Dec", requirements: ["Bridal lookbook", "1 long-form YouTube video"] },
  { id: "CMP-508", name: "Jewellery Everyday Muse", brand: "Mitti Studio", category: "Jewellery", commission: 25, budget: 210000, spent: 210000, potentialEarnings: 0, creators: 44, clicks: 16480, orders: 782, revenue: 704000, status: "completed", starts: "02 Feb", ends: "31 Mar", requirements: ["Carousel of 5 looks"] },
];

export type Order = {
  id: string;
  date: string;
  customer: string;
  city: string;
  product: string;
  store: string;
  creator: string;
  campaign: string;
  amount: number;
  commission: number;
  status: "pending" | "shipped" | "delivered" | "cancelled" | "refunded";
  payment: "Razorpay" | "Stripe" | "UPI" | "COD";
  tracking: string;
};

export const orders: Order[] = [
  { id: "ORD-88421", date: "12 Mar 2026", customer: "Priya Nambiar", city: "Kochi", product: "Banarasi Silk Saree", store: "Anarkali Fashion", creator: "Meera Kapoor", campaign: "Festive Ethnic Edit", amount: 8999, commission: 1620, status: "delivered", payment: "Razorpay", tracking: "BLD1928374" },
  { id: "ORD-88422", date: "12 Mar 2026", customer: "Rahul Verma", city: "Delhi", product: "Oversized Denim Jacket", store: "Urban Threads", creator: "Rohan Mehta", campaign: "Monsoon Streetwear Drop", amount: 3299, commission: 396, status: "shipped", payment: "UPI", tracking: "DEL8837261" },
  { id: "ORD-88423", date: "11 Mar 2026", customer: "Sneha Kulkarni", city: "Pune", product: "Vitamin C Face Serum", store: "Glow Ritual", creator: "Ananya Sharma", campaign: "Glow Ritual Skin Sprint", amount: 1299, commission: 286, status: "delivered", payment: "Stripe", tracking: "GLW7261823" },
  { id: "ORD-88424", date: "11 Mar 2026", customer: "Imran Sheikh", city: "Hyderabad", product: "Brass Jhumka Earrings", store: "Mitti Studio", creator: "Diya Patel", campaign: "Jewellery Everyday Muse", amount: 899, commission: 225, status: "pending", payment: "COD", tracking: "—" },
  { id: "ORD-88425", date: "10 Mar 2026", customer: "Tanvi Desai", city: "Surat", product: "Handloom Cotton Kurta", store: "Anarkali Fashion", creator: "Meera Kapoor", campaign: "Festive Ethnic Edit", amount: 2499, commission: 375, status: "delivered", payment: "Razorpay", tracking: "BLD1928112" },
  { id: "ORD-88426", date: "10 Mar 2026", customer: "Karan Malhotra", city: "Chandigarh", product: "Athleisure Joggers", store: "Urban Threads", creator: "Arjun Reddy", campaign: "Monsoon Streetwear Drop", amount: 1699, commission: 187, status: "cancelled", payment: "UPI", tracking: "—" },
  { id: "ORD-88427", date: "09 Mar 2026", customer: "Lakshmi Menon", city: "Chennai", product: "Ayurvedic Hair Oil", store: "Glow Ritual", creator: "Saanvi Iyer", campaign: "Glow Ritual Skin Sprint", amount: 749, commission: 150, status: "delivered", payment: "Razorpay", tracking: "GLW7261099" },
  { id: "ORD-88428", date: "09 Mar 2026", customer: "Devansh Tiwari", city: "Lucknow", product: "Chikankari Dupatta", store: "Anarkali Fashion", creator: "Vivaan Gupta", campaign: "Festive Ethnic Edit", amount: 1599, commission: 272, status: "shipped", payment: "Stripe", tracking: "BLD1927884" },
  { id: "ORD-88429", date: "08 Mar 2026", customer: "Nisha Agarwal", city: "Kolkata", product: "Matte Lipstick Trio", store: "Glow Ritual", creator: "Ananya Sharma", campaign: "Glow Ritual Skin Sprint", amount: 1099, commission: 264, status: "refunded", payment: "Razorpay", tracking: "GLW7260012" },
  { id: "ORD-88430", date: "08 Mar 2026", customer: "Yash Bhatia", city: "Mumbai", product: "Everyday Linen Shirt", store: "Urban Threads", creator: "Meera Kapoor", campaign: "Monsoon Streetwear Drop", amount: 1899, commission: 190, status: "delivered", payment: "UPI", tracking: "URB2288171" },
  { id: "ORD-88431", date: "07 Mar 2026", customer: "Farah Khan", city: "Bhopal", product: "Kolhapuri Leather Sandals", store: "Desi Sole", creator: "Kabir Nair", campaign: "Desi Sole Summer Walk", amount: 2199, commission: 308, status: "delivered", payment: "COD", tracking: "DSO9182734" },
  { id: "ORD-88432", date: "07 Mar 2026", customer: "Aniket Pawar", city: "Nagpur", product: "Block Print Bedsheet Set", store: "Mitti Studio", creator: "Ishita Rao", campaign: "Handcrafted Home Launch", amount: 3499, commission: 560, status: "pending", payment: "Razorpay", tracking: "—" },
];

export type AffiliateLink = {
  id: string;
  label: string;
  url: string;
  product: string;
  campaign: string;
  clicks: number;
  orders: number;
  revenue: number;
  cvr: number;
  created: string;
  status: "active" | "paused";
};

export const links: AffiliateLink[] = [
  { id: "LNK-701", label: "Festive Saree Reel", url: "https://plat.fm/meera/saree-festive", product: "Banarasi Silk Saree", campaign: "Festive Ethnic Edit", clicks: 6820, orders: 342, revenue: 486000, cvr: 5.01, created: "12 Aug 2025", status: "active" },
  { id: "LNK-702", label: "Serum Story Swipe", url: "https://plat.fm/meera/glow-serum", product: "Vitamin C Face Serum", campaign: "Glow Ritual Skin Sprint", clicks: 5240, orders: 386, revenue: 268000, cvr: 7.37, created: "20 Aug 2025", status: "active" },
  { id: "LNK-703", label: "Denim Jacket Bio Link", url: "https://plat.fm/meera/denim-jacket", product: "Oversized Denim Jacket", campaign: "Monsoon Streetwear Drop", clicks: 4180, orders: 214, revenue: 342000, cvr: 5.12, created: "01 Jul 2025", status: "active" },
  { id: "LNK-704", label: "Jhumka Carousel", url: "https://plat.fm/meera/jhumka", product: "Brass Jhumka Earrings", campaign: "Jewellery Everyday Muse", clicks: 3860, orders: 298, revenue: 148000, cvr: 7.72, created: "02 Feb 2026", status: "active" },
  { id: "LNK-705", label: "Linen Shirt YouTube", url: "https://plat.fm/meera/linen-shirt", product: "Everyday Linen Shirt", campaign: "Monsoon Streetwear Drop", clicks: 2640, orders: 112, revenue: 96000, cvr: 4.24, created: "18 Jul 2025", status: "paused" },
  { id: "LNK-706", label: "Hair Oil Routine", url: "https://plat.fm/meera/hair-oil", product: "Ayurvedic Hair Oil", campaign: "Glow Ritual Skin Sprint", clicks: 2080, orders: 164, revenue: 74000, cvr: 7.88, created: "26 Aug 2025", status: "active" },
];

export type Commission = {
  id: string;
  creator: string;
  order: string;
  store: string;
  campaign: string;
  orderValue: number;
  rate: number;
  amount: number;
  platformFee: number;
  date: string;
  status: "pending" | "approved" | "paid" | "reversed";
};

export const commissions: Commission[] = [
  { id: "COM-9101", creator: "Meera Kapoor", order: "ORD-88421", store: "Anarkali Fashion", campaign: "Festive Ethnic Edit", orderValue: 8999, rate: 18, amount: 1620, platformFee: 162, date: "12 Mar 2026", status: "pending" },
  { id: "COM-9102", creator: "Rohan Mehta", order: "ORD-88422", store: "Urban Threads", campaign: "Monsoon Streetwear Drop", orderValue: 3299, rate: 12, amount: 396, platformFee: 40, date: "12 Mar 2026", status: "pending" },
  { id: "COM-9103", creator: "Ananya Sharma", order: "ORD-88423", store: "Glow Ritual", campaign: "Glow Ritual Skin Sprint", orderValue: 1299, rate: 22, amount: 286, platformFee: 29, date: "11 Mar 2026", status: "approved" },
  { id: "COM-9104", creator: "Diya Patel", order: "ORD-88424", store: "Mitti Studio", campaign: "Jewellery Everyday Muse", orderValue: 899, rate: 25, amount: 225, platformFee: 23, date: "11 Mar 2026", status: "approved" },
  { id: "COM-9105", creator: "Meera Kapoor", order: "ORD-88425", store: "Anarkali Fashion", campaign: "Festive Ethnic Edit", orderValue: 2499, rate: 15, amount: 375, platformFee: 38, date: "10 Mar 2026", status: "paid" },
  { id: "COM-9106", creator: "Arjun Reddy", order: "ORD-88426", store: "Urban Threads", campaign: "Monsoon Streetwear Drop", orderValue: 1699, rate: 11, amount: 187, platformFee: 19, date: "10 Mar 2026", status: "reversed" },
  { id: "COM-9107", creator: "Saanvi Iyer", order: "ORD-88427", store: "Glow Ritual", campaign: "Glow Ritual Skin Sprint", orderValue: 749, rate: 20, amount: 150, platformFee: 15, date: "09 Mar 2026", status: "paid" },
  { id: "COM-9108", creator: "Vivaan Gupta", order: "ORD-88428", store: "Anarkali Fashion", campaign: "Festive Ethnic Edit", orderValue: 1599, rate: 17, amount: 272, platformFee: 27, date: "09 Mar 2026", status: "approved" },
  { id: "COM-9109", creator: "Ananya Sharma", order: "ORD-88429", store: "Glow Ritual", campaign: "Glow Ritual Skin Sprint", orderValue: 1099, rate: 24, amount: 264, platformFee: 26, date: "08 Mar 2026", status: "reversed" },
  { id: "COM-9110", creator: "Meera Kapoor", order: "ORD-88430", store: "Urban Threads", campaign: "Monsoon Streetwear Drop", orderValue: 1899, rate: 10, amount: 190, platformFee: 19, date: "08 Mar 2026", status: "paid" },
  { id: "COM-9111", creator: "Kabir Nair", order: "ORD-88431", store: "Desi Sole", campaign: "Desi Sole Summer Walk", orderValue: 2199, rate: 14, amount: 308, platformFee: 31, date: "07 Mar 2026", status: "pending" },
  { id: "COM-9112", creator: "Ishita Rao", order: "ORD-88432", store: "Mitti Studio", campaign: "Handcrafted Home Launch", orderValue: 3499, rate: 16, amount: 560, platformFee: 56, date: "07 Mar 2026", status: "pending" },
];

export type Payout = {
  id: string;
  creator: string;
  method: "UPI" | "Bank transfer" | "IMPS";
  account: string;
  amount: number;
  fee: number;
  requested: string;
  status: "pending" | "processing" | "completed" | "failed";
  batch: string;
};

export const payouts: Payout[] = [
  { id: "PAY-4401", creator: "Meera Kapoor", method: "UPI", account: "meera@okhdfc", amount: 42600, fee: 0, requested: "10 Mar 2026", status: "pending", batch: "BATCH-Mar-2" },
  { id: "PAY-4402", creator: "Rohan Mehta", method: "Bank transfer", account: "HDFC ••4821", amount: 38200, fee: 12, requested: "10 Mar 2026", status: "pending", batch: "BATCH-Mar-2" },
  { id: "PAY-4403", creator: "Ananya Sharma", method: "UPI", account: "ananya@ybl", amount: 26400, fee: 0, requested: "09 Mar 2026", status: "processing", batch: "BATCH-Mar-1" },
  { id: "PAY-4404", creator: "Diya Patel", method: "IMPS", account: "ICICI ••2210", amount: 21800, fee: 12, requested: "08 Mar 2026", status: "processing", batch: "BATCH-Mar-1" },
  { id: "PAY-4405", creator: "Kabir Nair", method: "UPI", account: "kabir@axl", amount: 16400, fee: 0, requested: "05 Mar 2026", status: "completed", batch: "BATCH-Feb-4" },
  { id: "PAY-4406", creator: "Saanvi Iyer", method: "Bank transfer", account: "SBI ••7734", amount: 12600, fee: 12, requested: "04 Mar 2026", status: "completed", batch: "BATCH-Feb-4" },
  { id: "PAY-4407", creator: "Arjun Reddy", method: "UPI", account: "arjun@okicici", amount: 18200, fee: 0, requested: "02 Mar 2026", status: "failed", batch: "BATCH-Feb-3" },
  { id: "PAY-4408", creator: "Vivaan Gupta", method: "UPI", account: "vivaan@okaxis", amount: 9800, fee: 0, requested: "01 Mar 2026", status: "completed", batch: "BATCH-Feb-3" },
];

export type Store = {
  id: string;
  name: string;
  owner: string;
  email: string;
  city: string;
  category: string;
  gmv: number;
  orders: number;
  creators: number;
  commissionPaid: number;
  status: "active" | "pending" | "paused" | "suspended";
  plan: "Growth" | "Scale" | "Enterprise";
  joined: string;
};

export const stores: Store[] = [
  { id: "ST-301", name: "Urban Threads", owner: "Aarav Shah", email: "aarav@urbanthreads.in", city: "Mumbai", category: "Apparel", gmv: 12840000, orders: 3420, creators: 142, commissionPaid: 495000, status: "active", plan: "Enterprise", joined: "Mar 2024" },
  { id: "ST-302", name: "Anarkali Fashion", owner: "Nikita Bansal", email: "nikita@anarkali.in", city: "Jaipur", category: "Ethnic wear", gmv: 9640000, orders: 2860, creators: 118, commissionPaid: 412000, status: "active", plan: "Scale", joined: "Jun 2024" },
  { id: "ST-303", name: "Glow Ritual", owner: "Sneha Rao", email: "sneha@glowritual.in", city: "Bengaluru", category: "Beauty", gmv: 7420000, orders: 4180, creators: 196, commissionPaid: 386000, status: "active", plan: "Scale", joined: "Sep 2024" },
  { id: "ST-304", name: "Mitti Studio", owner: "Rehan Qureshi", email: "rehan@mittistudio.in", city: "Ahmedabad", category: "Home & jewellery", gmv: 4280000, orders: 1980, creators: 86, commissionPaid: 214000, status: "active", plan: "Growth", joined: "Jan 2025" },
  { id: "ST-305", name: "Desi Sole", owner: "Pooja Chauhan", email: "pooja@desisole.in", city: "Kolhapur", category: "Footwear", gmv: 2140000, orders: 940, creators: 42, commissionPaid: 96000, status: "paused", plan: "Growth", joined: "Apr 2025" },
  { id: "ST-306", name: "Chaiwala Co.", owner: "Manav Kohli", email: "manav@chaiwala.co", city: "Delhi", category: "Food & beverage", gmv: 1680000, orders: 2240, creators: 34, commissionPaid: 72000, status: "pending", plan: "Growth", joined: "Feb 2026" },
  { id: "ST-307", name: "Tech Bazaar", owner: "Zoya Ahmed", email: "zoya@techbazaar.in", city: "Pune", category: "Electronics", gmv: 5860000, orders: 1120, creators: 28, commissionPaid: 168000, status: "active", plan: "Scale", joined: "Nov 2024" },
  { id: "ST-308", name: "Vedic Wellness", owner: "Harsh Vardhan", email: "harsh@vedicwellness.in", city: "Rishikesh", category: "Wellness", gmv: 1240000, orders: 680, creators: 22, commissionPaid: 58000, status: "suspended", plan: "Growth", joined: "Jul 2025" },
];

export type Customer = {
  id: string;
  name: string;
  email: string;
  city: string;
  orders: number;
  spend: number;
  aov: number;
  source: string;
  firstOrder: string;
  lastOrder: string;
  segment: "VIP" | "Repeat" | "New" | "At risk";
};

export const customers: Customer[] = [
  { id: "CUS-6101", name: "Priya Nambiar", email: "priya.n@example.in", city: "Kochi", orders: 12, spend: 68400, aov: 5700, source: "Meera Kapoor", firstOrder: "Feb 2025", lastOrder: "12 Mar 2026", segment: "VIP" },
  { id: "CUS-6102", name: "Rahul Verma", email: "rahul.v@example.in", city: "Delhi", orders: 6, spend: 24800, aov: 4133, source: "Rohan Mehta", firstOrder: "Jul 2025", lastOrder: "12 Mar 2026", segment: "Repeat" },
  { id: "CUS-6103", name: "Sneha Kulkarni", email: "sneha.k@example.in", city: "Pune", orders: 9, spend: 18600, aov: 2067, source: "Ananya Sharma", firstOrder: "Sep 2025", lastOrder: "11 Mar 2026", segment: "Repeat" },
  { id: "CUS-6104", name: "Imran Sheikh", email: "imran.s@example.in", city: "Hyderabad", orders: 1, spend: 899, aov: 899, source: "Diya Patel", firstOrder: "11 Mar 2026", lastOrder: "11 Mar 2026", segment: "New" },
  { id: "CUS-6105", name: "Tanvi Desai", email: "tanvi.d@example.in", city: "Surat", orders: 14, spend: 82400, aov: 5886, source: "Meera Kapoor", firstOrder: "Nov 2024", lastOrder: "10 Mar 2026", segment: "VIP" },
  { id: "CUS-6106", name: "Karan Malhotra", email: "karan.m@example.in", city: "Chandigarh", orders: 3, spend: 8600, aov: 2867, source: "Arjun Reddy", firstOrder: "Jan 2026", lastOrder: "10 Mar 2026", segment: "New" },
  { id: "CUS-6107", name: "Lakshmi Menon", email: "lakshmi.m@example.in", city: "Chennai", orders: 8, spend: 14200, aov: 1775, source: "Saanvi Iyer", firstOrder: "Mar 2025", lastOrder: "09 Mar 2026", segment: "Repeat" },
  { id: "CUS-6108", name: "Devansh Tiwari", email: "devansh.t@example.in", city: "Lucknow", orders: 2, spend: 3200, aov: 1600, source: "Vivaan Gupta", firstOrder: "Dec 2025", lastOrder: "09 Mar 2026", segment: "At risk" },
  { id: "CUS-6109", name: "Nisha Agarwal", email: "nisha.a@example.in", city: "Kolkata", orders: 5, spend: 11800, aov: 2360, source: "Ananya Sharma", firstOrder: "Aug 2025", lastOrder: "08 Mar 2026", segment: "Repeat" },
  { id: "CUS-6110", name: "Yash Bhatia", email: "yash.b@example.in", city: "Mumbai", orders: 18, spend: 96200, aov: 5344, source: "Meera Kapoor", firstOrder: "Jun 2024", lastOrder: "08 Mar 2026", segment: "VIP" },
];

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  category: "Campaigns" | "Orders" | "Earnings" | "System";
  time: string;
  unread: boolean;
};

export const notifications: AppNotification[] = [
  { id: "NT-1", title: "Campaign approved", body: "Anarkali Fashion approved you for Festive Ethnic Edit at 18% commission.", category: "Campaigns", time: "12 min ago", unread: true },
  { id: "NT-2", title: "New order", body: "Priya Nambiar bought a Banarasi Silk Saree — ₹1,620 commission earned.", category: "Orders", time: "48 min ago", unread: true },
  { id: "NT-3", title: "Payout processed", body: "₹26,400 was sent to your UPI ananya@ybl.", category: "Earnings", time: "3 hours ago", unread: true },
  { id: "NT-4", title: "Instagram automation ran", body: "DM automation 'LINK' replied to 128 comments today.", category: "System", time: "5 hours ago", unread: false },
  { id: "NT-5", title: "Campaign ending soon", body: "Monsoon Streetwear Drop closes in 3 days. 6 posts pending.", category: "Campaigns", time: "Yesterday", unread: false },
  { id: "NT-6", title: "Order refunded", body: "ORD-88429 was refunded — ₹264 commission reversed.", category: "Orders", time: "Yesterday", unread: false },
  { id: "NT-7", title: "Milestone unlocked", body: "You crossed ₹1.8L lifetime earnings. Gold tier retained.", category: "Earnings", time: "2 days ago", unread: false },
  { id: "NT-8", title: "Policy update", body: "Commission reversal window changed from 14 to 10 days.", category: "System", time: "4 days ago", unread: false },
];

export const trafficSources = [
  { name: "Instagram", value: 12480, color: "var(--color-coral)" },
  { name: "YouTube", value: 6240, color: "var(--color-primary)" },
  { name: "WhatsApp", value: 3180, color: "var(--color-teal)" },
  { name: "Direct", value: 1920, color: "var(--color-indigo)" },
  { name: "Other", value: 1000, color: "var(--color-violet)" },
];

export const audienceAge = [
  { bucket: "18-24", share: 34 },
  { bucket: "25-34", share: 41 },
  { bucket: "35-44", share: 16 },
  { bucket: "45-54", share: 6 },
  { bucket: "55+", share: 3 },
];

export const audienceCities = [
  { city: "Mumbai", share: 22 },
  { city: "Delhi", share: 18 },
  { city: "Bengaluru", share: 14 },
  { city: "Pune", share: 9 },
  { city: "Hyderabad", share: 8 },
  { city: "Others", share: 29 },
];

export const activityFeed = [
  { id: "AC-1", text: "Generated affiliate link for Brass Jhumka Earrings", time: "9:12 AM", tone: "primary" as const },
  { id: "AC-2", text: "Applied to Desi Sole Summer Walk campaign", time: "8:40 AM", tone: "coral" as const },
  { id: "AC-3", text: "₹1,620 commission approved for ORD-88421", time: "Yesterday", tone: "teal" as const },
  { id: "AC-4", text: "Instagram DM automation replied to 128 comments", time: "Yesterday", tone: "indigo" as const },
  { id: "AC-5", text: "Storefront collection 'Festive Picks' published", time: "2 days ago", tone: "violet" as const },
];
