import { createFileRoute } from "@tanstack/react-router";
import { PublicPolicyLayout } from "@/components/app/PublicPolicyLayout";

export const Route = createFileRoute("/terms-of-service")({
  component: TermsOfServicePage,
});

function TermsOfServicePage() {
  return (
    <PublicPolicyLayout
      title="Terms of Service"
      subtitle="Terms and conditions governing the use of MegaInfluencer for Creators, Store Owners, and Platform Users."
      lastUpdated="September 26, 2026"
    >
      <section className="space-y-4">
        <h2 className="text-xl font-bold font-display text-foreground border-b pb-2">1. Agreement to Terms</h2>
        <p>
          These Terms of Service ("Terms") constitute a legally binding agreement between you ("User", "Creator", "Store Owner")
          and <strong>MegaInfluencer Inc.</strong> ("MegaInfluencer", "we", "us"). By accessing or using the platform, creating an
          account, connecting a Shopify store, or participating in brand campaigns, you agree to be bound by these Terms.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold font-display text-foreground border-b pb-2">2. User Roles & Accounts</h2>
        <p>MegaInfluencer provides services tailored for three primary user roles:</p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>
            <strong className="text-foreground">Influencers / Creators:</strong> Individuals who discover campaigns, share trackable affiliate links, receive sample products, and promote brand stores on social channels.
          </li>
          <li>
            <strong className="text-foreground">Store Owners / Brands:</strong> E-commerce businesses integrated via Shopify to create campaigns, approve creators, dispatch sample products, and manage sales attribution.
          </li>
          <li>
            <strong className="text-foreground">Platform Administrators:</strong> System administrators overseeing ecosystem health, financial governance, user accounts, and platform integrity.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold font-display text-foreground border-b pb-2">3. Campaign Compensation Models & Attribution</h2>
        <p>MegaInfluencer supports 4 distinct campaign compensation models:</p>
        <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
          <li>
            <strong className="text-foreground">Barter / Product Exchange:</strong> Store owners send complimentary sample products to creators. Creators are entitled to sample product delivery as tracked in the platform. No monetary sales commissions are accrued on Barter deals.
          </li>
          <li>
            <strong className="text-foreground">Fixed Fee:</strong> Guaranteed base fee negotiated upon campaign application. Payouts are due upon verified deliverable submission.
          </li>
          <li>
            <strong className="text-foreground">Commission Only:</strong> Creators earn a specified percentage (e.g. 10%) on verified, non-refunded orders attributed to their affiliate link or creator discount code.
          </li>
          <li>
            <strong className="text-foreground">Hybrid Deal:</strong> Combination of a fixed base fee PLUS an ongoing sales commission percentage.
          </li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold font-display text-foreground border-b pb-2">4. Affiliate Links & Order Attribution Rules</h2>
        <p>
          Orders are attributed to creators using URL parameter tracking (<code>mi_link</code>), UTM codes, and creator discount codes (<code>creatorCode</code>).
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Affiliate links must be placed transparently in bio links, social posts, or authorized Instagram DM automation replies.</li>
          <li>Self-referrals, automated click bots, fraudulent discount codes, or cookie stuffing are strictly prohibited and will result in immediate account suspension.</li>
          <li>Commissions are calculated on net order subtotals and subject to a hold period to account for customer refunds or order cancellations.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold font-display text-foreground border-b pb-2">5. Content & FTC Disclosure Compliance</h2>
        <p>
          Creators agree to comply with FTC guidelines and local advertising standards by clearly disclosing sponsored posts,
          sample product gifts, or affiliate relationships using hashtags such as <code>#ad</code>, <code>#sponsored</code>, or <code>#gifted</code>.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold font-display text-foreground border-b pb-2">6. Limitation of Liability</h2>
        <p className="text-muted-foreground">
          MegaInfluencer is provided on an "AS IS" and "AS AVAILABLE" basis. In no event shall MegaInfluencer or its affiliates
          be liable for indirect, incidental, or consequential damages, lost profits, or third-party service outages (including Meta or Shopify API downtime).
        </p>
      </section>

      <section className="space-y-4 border-t pt-6">
        <h2 className="text-xl font-bold font-display text-foreground">7. Contact & Support</h2>
        <p className="text-muted-foreground">
          For legal inquiries or questions regarding these Terms of Service, please contact:
        </p>
        <div className="rounded-xl border bg-card p-4 space-y-1 font-mono text-xs text-foreground">
          <p><strong>MegaInfluencer Legal Team</strong></p>
          <p>Powered by Megascale</p>
          <p>Email: <a href="mailto:support@megainfluencer.com" className="text-primary underline">support@megainfluencer.com</a></p>
        </div>
      </section>
    </PublicPolicyLayout>
  );
}
