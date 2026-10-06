export interface OrderPlatformInfo {
  platform: 'WHATSAPP' | 'FACEBOOK' | 'INSTAGRAM' | 'YOUTUBE' | 'TIKTOK' | 'TWITTER' | 'DIRECT' | 'OTHER';
  platformLabel: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referrer: string | null;
}

/**
 * Resolves the channel/platform for an order from Shopify payload, note_attributes,
 * landing_site URL params, referring_site, or associated affiliate link clicks.
 */
export function resolveOrderPlatform(
  payload: any,
  clickUtm?: { utmSource?: string | null; utmMedium?: string | null; utmCampaign?: string | null } | null
): OrderPlatformInfo {
  let utmSource: string | null = clickUtm?.utmSource ?? null;
  let utmMedium: string | null = clickUtm?.utmMedium ?? null;
  let utmCampaign: string | null = clickUtm?.utmCampaign ?? null;
  let referrer: string | null = null;

  if (payload && typeof payload === 'object') {
    // 1. Note attributes / custom attributes
    const attrs = [
      ...(Array.isArray(payload.note_attributes) ? payload.note_attributes : []),
      ...(Array.isArray(payload.customAttributes) ? payload.customAttributes : []),
      ...(Array.isArray(payload.noteAttributes) ? payload.noteAttributes : []),
    ];

    for (const attr of attrs) {
      const name = String(attr.name ?? attr.key ?? '').toLowerCase().trim();
      const val = String(attr.value ?? '').trim();
      if (!val) continue;
      if (name === 'utm_source' || name === 'source' || name === 'mi_source' || name === 'platform') {
        if (!utmSource) utmSource = val;
      } else if (name === 'utm_medium' || name === 'medium' || name === 'mi_medium') {
        if (!utmMedium) utmMedium = val;
      } else if (name === 'utm_campaign' || name === 'campaign' || name === 'mi_campaign') {
        if (!utmCampaign) utmCampaign = val;
      }
    }

    // 2. Landing site / source url
    const landing = String(payload.landing_site ?? payload.landing_site_ref ?? payload.source_url ?? '');
    if (landing) {
      try {
        const urlMatch = landing.match(/[?&]utm_source=([^&]+)/i);
        if (urlMatch && !utmSource) utmSource = decodeURIComponent(urlMatch[1]);
        const medMatch = landing.match(/[?&]utm_medium=([^&]+)/i);
        if (medMatch && !utmMedium) utmMedium = decodeURIComponent(medMatch[1]);
        const campMatch = landing.match(/[?&]utm_campaign=([^&]+)/i);
        if (campMatch && !utmCampaign) utmCampaign = decodeURIComponent(campMatch[1]);
      } catch {}
    }

    // 3. Referring site
    const ref = String(payload.referring_site ?? payload.referrer ?? '');
    if (ref) {
      referrer = ref;
      const lowerRef = ref.toLowerCase();
      if (!utmSource) {
        if (lowerRef.includes('whatsapp') || lowerRef.includes('wa.me')) utmSource = 'whatsapp';
        else if (lowerRef.includes('facebook.com') || lowerRef.includes('fb.com') || lowerRef.includes('fb.me')) utmSource = 'facebook';
        else if (lowerRef.includes('instagram.com')) utmSource = 'instagram';
        else if (lowerRef.includes('youtube.com') || lowerRef.includes('youtu.be')) utmSource = 'youtube';
        else if (lowerRef.includes('tiktok.com')) utmSource = 'tiktok';
        else if (lowerRef.includes('twitter.com') || lowerRef.includes('t.co') || lowerRef.includes('x.com')) utmSource = 'twitter';
      }
    }

    // 4. Source name / client details
    const sourceName = String(payload.source_name ?? payload.sourceName ?? '').toLowerCase();
    if (!utmSource && sourceName && sourceName !== 'web' && sourceName !== 'shopify_draft_order') {
      if (sourceName.includes('instagram')) utmSource = 'instagram';
      else if (sourceName.includes('facebook')) utmSource = 'facebook';
      else if (sourceName.includes('whatsapp')) utmSource = 'whatsapp';
      else utmSource = sourceName;
    }
  }

  const rawSource = (utmSource ?? '').toLowerCase().trim();
  let platform: OrderPlatformInfo['platform'] = 'DIRECT';
  let platformLabel = 'Direct / Link';

  if (rawSource.includes('whatsapp') || rawSource.includes('wa')) {
    platform = 'WHATSAPP';
    platformLabel = 'WhatsApp';
  } else if (rawSource.includes('facebook') || rawSource.includes('fb')) {
    platform = 'FACEBOOK';
    platformLabel = 'Facebook';
  } else if (rawSource.includes('instagram') || rawSource.includes('ig')) {
    platform = 'INSTAGRAM';
    platformLabel = 'Instagram';
  } else if (rawSource.includes('youtube') || rawSource.includes('yt')) {
    platform = 'YOUTUBE';
    platformLabel = 'YouTube';
  } else if (rawSource.includes('tiktok')) {
    platform = 'TIKTOK';
    platformLabel = 'TikTok';
  } else if (rawSource.includes('twitter') || rawSource.includes('x.com')) {
    platform = 'TWITTER';
    platformLabel = 'Twitter (X)';
  } else if (utmSource) {
    platform = 'OTHER';
    platformLabel = utmSource.charAt(0).toUpperCase() + utmSource.slice(1);
  }

  return {
    platform,
    platformLabel,
    utmSource: utmSource || null,
    utmMedium: utmMedium || null,
    utmCampaign: utmCampaign || null,
    referrer: referrer || null,
  };
}
