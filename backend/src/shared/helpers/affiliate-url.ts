/**
 * Helper to construct a trustworthy, direct merchant store URL for an affiliate link.
 * Instead of routing followers through an unknown 3rd party redirect domain, this sends them
 * directly to the merchant's authentic domain (e.g. brandstore.com/products/xyz?ref=CODE&mi_link=slug)
 * while preserving full Shopify order attribution via landing_site query parameters.
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

    const path = options.destinationPath && options.destinationPath.trim() ? options.destinationPath.trim() : '/';
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(normalizedPath, `https://${rawDomain}`);

    url.searchParams.set('mi_link', options.slug);
    if (options.creatorCode) {
      url.searchParams.set('mi_creator_code', options.creatorCode);
      url.searchParams.set('utm_creator_code', options.creatorCode);
      url.searchParams.set('ref', options.creatorCode);
    }

    return url.toString();
  } catch {
    return null;
  }
}
