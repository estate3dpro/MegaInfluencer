/**
 * Helper to construct a trustworthy, direct merchant store URL for an affiliate link.
 * Instead of routing followers through an unknown third-party redirect domain, this sends them
 * directly to the merchant's authenticated Shopify collection or product page while preserving order attribution.
 *
 * `code` contains the opaque, server-issued affiliate-link identifier.
 * Keeping the short code as the only query parameter makes the direct merchant URL clean, authentic, and easy to share.
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

    // Use requested destination path (e.g. /collections/sweets or /products/item) or fallback to '/'
    let rawPath = (options.destinationPath || '/').trim();
    if (!rawPath.startsWith('/') && !rawPath.startsWith('http')) {
      rawPath = `/${rawPath}`;
    }

    const url = new URL(rawPath, `https://${rawDomain}`);
    url.searchParams.set('code', options.slug);

    return url.toString();
  } catch {
    return null;
  }
}

