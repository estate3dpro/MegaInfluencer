import { BadgeIndianRupee, CircleDollarSign, CreditCard, ReceiptText } from "lucide-react";
import { FinancePage } from "./FinancePage";

const data = {
  orders: {
    title: "Orders",
    description: "Monitor marketplace orders, payment status and fulfilment.",
    searchLabel: "orders",
    icon: ReceiptText,
    metrics: [
      { label: "Order value", value: "₹24.80L", detail: "+18.6% this month" },
      { label: "Orders placed", value: "12,486", detail: "+14.2% this month" },
      { label: "Refund rate", value: "1.42%", detail: "Below 2% target" },
    ],
    columns: ["Customer", "Total", "Created"],
    rows: [
      [
        "#MI-10482",
        "Urban Threads · Aanya Shah",
        ["Priya Nair", "₹4,280", "Today, 10:42 AM"],
        "Completed",
      ],
      [
        "#MI-10481",
        "Northstar Home · Kabir Singh",
        ["Rohan Mehta", "₹2,890", "Today, 10:18 AM"],
        "Completed",
      ],
      [
        "#MI-10480",
        "Kora Collective · Mira Kapoor",
        ["Ishita Rao", "₹1,640", "Today, 09:54 AM"],
        "Pending",
      ],
    ],
  },
  commissions: {
    title: "Commissions",
    description: "Review creator commission earnings and settlement eligibility.",
    searchLabel: "commissions",
    icon: CircleDollarSign,
    metrics: [
      { label: "Commission accrued", value: "₹3.82L", detail: "Last 30 days" },
      { label: "Awaiting payout", value: "₹1.26L", detail: "Across 284 creators" },
      { label: "Average rate", value: "11.8%", detail: "Across active campaigns" },
    ],
    columns: ["Creator", "Commission", "Period"],
    rows: [
      ["COM-4982", "Monsoon Essentials", ["Aanya Shah", "₹42,840", "Sep 1–14"], "Approved"],
      ["COM-4981", "Home Refresh", ["Kabir Singh", "₹36,280", "Sep 1–14"], "Approved"],
      ["COM-4980", "Weekend Edit", ["Mira Kapoor", "₹28,460", "Sep 1–14"], "Review"],
    ],
  },
  payouts: {
    title: "Payouts",
    description: "Track creator payment batches and payout reconciliation.",
    searchLabel: "payouts",
    icon: CreditCard,
    metrics: [
      { label: "Paid this month", value: "₹5.46L", detail: "To 486 creators" },
      { label: "Next payout", value: "₹1.26L", detail: "Scheduled Sep 18" },
      { label: "Failed payouts", value: "3", detail: "Need account review" },
    ],
    columns: ["Recipients", "Amount", "Processed"],
    rows: [
      [
        "Payout batch #284",
        "Weekly creator payout",
        ["48 creators", "₹3,42,800", "Today, 09:00 AM"],
        "Paid",
      ],
      [
        "Payout batch #283",
        "Weekly creator payout",
        ["52 creators", "₹2,96,420", "Sep 07, 09:00 AM"],
        "Paid",
      ],
      [
        "Payout batch #285",
        "Scheduled creator payout",
        ["61 creators", "₹4,18,960", "Sep 18, 09:00 AM"],
        "Scheduled",
      ],
    ],
  },
  finance: {
    title: "Finance",
    description: "Platform financial overview, settlements and revenue reconciliation.",
    searchLabel: "financial records",
    icon: BadgeIndianRupee,
    metrics: [
      { label: "Net platform revenue", value: "₹4.92L", detail: "Last 30 days" },
      { label: "Store settlements", value: "₹19.16L", detail: "Due after commissions" },
      { label: "Outstanding balance", value: "₹2.14L", detail: "Pending settlement" },
    ],
    columns: ["Counterparty", "Amount", "Date"],
    rows: [
      [
        "Settlement #ST-882",
        "Urban Threads · Sep 2026",
        ["Urban Threads", "₹4,96,280", "Sep 14"],
        "Settled",
      ],
      [
        "Settlement #ST-881",
        "Northstar Home · Sep 2026",
        ["Northstar Home", "₹3,82,140", "Sep 14"],
        "Pending",
      ],
      [
        "Platform fee #PF-284",
        "Creator marketplace fees",
        ["Platform revenue", "₹84,620", "Sep 13"],
        "Completed",
      ],
    ],
  },
} as const;

type FinanceKey = keyof typeof data;
function makePage(key: FinanceKey) {
  return () => <FinancePage config={data[key]} />;
}
export const OrdersPage = makePage("orders");
export const CommissionsPage = makePage("commissions");
export const PayoutsPage = makePage("payouts");
export const FinanceOverviewPage = makePage("finance");
