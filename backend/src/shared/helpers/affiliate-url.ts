/**
 * Helper to construct a trustworthy, direct merchant store URL for an affiliate link.
 * Instead of routing followers through an unknown third-party redirect domain, this sends them
 * directly to the merchant's authenticated Shopify shop page while preserving order attribution.
 *
 * `code` contains the opaque, server-issued affiliate-link identifier. The Shopify app embed
 * resolves it via `/public/affiliate-links/:slug/resolve` before persisting cart attribution.
 * Keeping the short code as the only query parameter makes the direct merchant URL clean and easy to share.
 */
export function buildDirectStoreUrl(options: {
  shopDomain?: string | null;
  destinationPath?: string | null;
  slug: string;
  creatorCode?: string | null;
}): string | null {
  if (!options.shopDomain) return null;
  try {
    const rawDomain = options.shopDomain.replace(/^https?:\/\//i, '').replace(/\/+$/, '').trim();
    if (!rawDomain) return null;

    // Every direct share URL opens the merchant's Shopify shop page. Product and collection
    // targets are retained on the affiliate link in the database and resolved by /pages/shop or /r/:slug.
    const url = new URL('/pages/shop', `https://${rawDomain}`);
    url.searchParams.set('code', options.slug);

    return url.toString();
  } catch {
    return null;
  }
}

