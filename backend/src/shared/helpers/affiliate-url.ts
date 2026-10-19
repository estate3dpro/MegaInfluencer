/**
 * Helper to construct a trustworthy, direct merchant store URL for an affiliate link.
 * Instead of routing followers through an unknown third-party redirect domain, this sends them
 * directly to the merchant's authenticated Shopify shop page while preserving order attribution.
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

    // Use requested destination path (e.g. /products/handle or /collections/handle) or fallback to '/'
    let rawPath = (options.destinationPath || '/').trim();
    if (!rawPath.startsWith('/') && !rawPath.startsWith('http')) {
      rawPath = `/${rawPath}`;
    }

    const url = new URL(rawPath, `https://${rawDomain}`);

    // Embed referral attribution query parameters
    url.searchParams.set('mi_link', options.slug);
    url.searchParams.set('code', options.slug);

    if (options.creatorCode) {
      url.searchParams.set('mi_creator_code', options.creatorCode);
      url.searchParams.set('utm_creator_code', options.creatorCode);
      url.searchParams.set('ref', options.creatorCode);
    }

    if (!url.searchParams.has('utm_source')) {
      url.searchParams.set('utm_source', 'megainfluencer');
    }
    if (!url.searchParams.has('utm_medium')) {
      url.searchParams.set('utm_medium', 'affiliate');
    }
    if (!url.searchParams.has('utm_campaign') && options.creatorCode) {
      url.searchParams.set('utm_campaign', `${options.creatorCode.toLowerCase()}-promo`);
    }

    return url.toString();
  } catch {
    return null;
  }
}

