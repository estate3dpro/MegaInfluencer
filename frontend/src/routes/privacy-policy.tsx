import { createFileRoute } from "@tanstack/react-router";
import { PublicPolicyLayout } from "@/components/app/PublicPolicyLayout";

export const Route = createFileRoute("/privacy-policy")({
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return (
    <PublicPolicyLayout
      title="Privacy Policy"
      subtitle="How MegaInfluencer collects, uses, protects, and handles creator, brand, and visitor data."
      lastUpdated="September 26, 2026"
    >
      <section className="space-y-4">
        <h2 className="text-xl font-bold font-display text-foreground border-b pb-2">1. Overview & Scope</h2>
        <p>
          Welcome to <strong>MegaInfluencer</strong> ("we", "our", or "us"). MegaInfluencer provides a Creator Commerce,
          Affiliate Attribution, Campaign Management, and Social Automation suite powering brand stores, influencers,
          and e-commerce operations.
        </p>
        <p>
          This Privacy Policy describes how we collect, store, process, disclose, and safeguard personal information
          when you visit our platform, use our website (<code>https://megainfluencer.com</code>), interact with our
          Shopify Store integrations, connect your Meta/Instagram Professional accounts, or generate affiliate links.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold font-display text-foreground border-b pb-2">2. Information We Collect</h2>
        <p>We collect information you provide directly, data generated automatically during platform usage, and information from third-party API integrations:</p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>
            <strong className="text-foreground">Account & Identity Information:</strong> Name, work email address, phone number, brand or business name, creator handle, bio, password hash, and profile details.
          </li>
          <li>
            <strong className="text-foreground">Meta & Instagram API Data:</strong> When you connect your Instagram account via Meta OAuth, we access authorized basic profile info, Instagram user ID, profile handle, media metadata, comment interactions, and direct messaging tokens required for automated DM replies.
          </li>
          <li>
            <strong className="text-foreground">Shopify Store & Commerce Data:</strong> Shopify store domain, product catalog, orders, line items, order total, financial status, fulfillment status, and custom attribution attributes (e.g. <code>mi_link</code> or <code>creatorCode</code>).
          </li>
          <li>
            <strong className="text-foreground">Affiliate Tracking & Technical Data:</strong> Anonymized visitor IP hashes, user-agent strings, referral URLs, link click timestamps, UTM parameters, and device browser properties.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold font-display text-foreground border-b pb-2">3. How We Use Your Information</h2>
        <p>We process personal and commerce data strictly for legitimate operational purposes:</p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>To operate creator storefronts, process campaign applications, and track sales commissions accurately.</li>
          <li>To calculate payouts across our 4 compensation models: <strong>Fixed Fee</strong>, <strong>Barter / Product Exchange</strong>, <strong>Commission Only</strong>, and <strong>Hybrid</strong>.</li>
          <li>To manage sample product shipments for Barter deals (sharing carrier names and tracking numbers with assigned creators).</li>
          <li>To execute automated Instagram comment-to-DM link delivery as authorized by your Meta account settings.</li>
          <li>To prevent fraudulent order attribution, duplicate link clicks, and non-compliant traffic.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold font-display text-foreground border-b pb-2">4. Meta / Instagram Data Usage & Compliance</h2>
        <p>
          MegaInfluencer strictly complies with <strong>Meta Platform Terms</strong> and Developer Policies. We request
          only the minimum permissions required for platform features:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>We do <strong>NOT</strong> sell, transfer, or license Instagram user data to data brokers or advertising networks.</li>
          <li>We store access tokens using strong AES encryption.</li>
          <li>
            You can revoke MegaInfluencer’s access to your Instagram account at any time via Instagram Settings or our
            <a href="/data-deletion" className="text-primary font-semibold underline ml-1">Data Deletion Instructions</a> page.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold font-display text-foreground border-b pb-2">5. Data Sharing & Third Parties</h2>
        <p>We share data only with third parties necessary to deliver platform services:</p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>
            <strong className="text-foreground">Brand Store Owners:</strong> When you apply to or accept a campaign, relevant creator profile handles and shipping addresses (for sample barter products) are shared with the store owner.
          </li>
          <li>
            <strong className="text-foreground">E-Commerce Integrations:</strong> Shopify Admin Graph API for syncing product catalogs and sales orders.
          </li>
          <li>
            <strong className="text-foreground">Legal & Regulatory Compliance:</strong> We may disclose information if required by law, subpoena, or government regulation.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold font-display text-foreground border-b pb-2">6. Your Rights & Data Subject Requests</h2>
        <p>Depending on your jurisdiction (such as GDPR, CCPA, or Meta Platform Policies), you have rights regarding your personal data:</p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Right to access and export your account, order, and commission data.</li>
          <li>Right to request correction of inaccurate personal information.</li>
          <li>Right to request complete erasure of your personal data and Meta tokens.</li>
        </ul>
        <p className="mt-2">
          To submit a data deletion or access request, please visit our <a href="/data-deletion" className="text-primary font-semibold underline">Data Deletion Instructions</a> or contact our Privacy Team at <code>privacy@megainfluencer.com</code>.
        </p>
      </section>

      <section className="space-y-4 border-t pt-6">
        <h2 className="text-xl font-bold font-display text-foreground">7. Contact Information</h2>
        <p className="text-muted-foreground">
          If you have any questions or concerns regarding this Privacy Policy or data handling practices, please contact us:
        </p>
        <div className="rounded-xl border bg-card p-4 space-y-1 font-mono text-xs text-foreground">
          <p><strong>MegaInfluencer Privacy Team</strong></p>
          <p>Powered by Megascale Compliance</p>
          <p>Email: <a href="mailto:privacy@megainfluencer.com" className="text-primary underline">privacy@megainfluencer.com</a></p>
          <p>Website: https://megainfluencer.com</p>
        </div>
      </section>
    </PublicPolicyLayout>
  );
}
