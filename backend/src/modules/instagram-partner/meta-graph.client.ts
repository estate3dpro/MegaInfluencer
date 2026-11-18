import { config } from '../../config/env.js';
import { AppError } from '../../shared/errors/app-error.js';

const GRAPH_VERSION = 'v21.0';
const GRAPH_BASE_URL = `https://graph.facebook.com/${GRAPH_VERSION}`;
const OAUTH_DIALOG_URL = `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`;

export interface MetaGraphError {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    is_transient?: boolean;
    error_user_title?: string;
    error_user_msg?: string;
  };
}

export interface MetaMediaPost {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
  comments_count?: number;
  like_count?: number;
}

export interface MetaOAuthExchangeResult {
  pageAccessToken: string;
  pageId: string;
  pageName: string;
  instagramBusinessAccountId: string;
  username: string;
  profilePictureUrl?: string;
}

function getMetaAppCredentials() {
  const appId = config.metaAppId || config.instagramAppId;
  const appSecret = config.metaAppSecret || config.instagramAppSecret;
  if (!appId || !appSecret) {
    throw new AppError('META_APP_CONFIG_MISSING', 'Meta App ID and App Secret must be configured in environment.', 503);
  }
  return { appId, appSecret };
}

async function handleMetaResponse<T>(res: Response, contextAction: string): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & MetaGraphError;
  if (!res.ok) {
    const err = data.error;
    const code = err?.code;
    const subcode = err?.error_subcode;
    const msg = err?.message || res.statusText || 'Unknown Meta API error';

    // Gracefully handle Meta rate limit (code 429 / code 17 / code 32 / code 613)
    if (res.status === 429 || code === 17 || code === 32 || code === 613) {
      throw new AppError(
        'META_RATE_LIMITED',
        `Meta Instagram Graph API rate limit reached (${code || 429}): ${msg}. Please retry shortly.`,
        429
      );
    }

    throw new AppError(
      'META_API_ERROR',
      `Meta API error during ${contextAction} (code ${code ?? res.status}${subcode ? `, subcode ${subcode}` : ''}): ${msg}`,
      res.status >= 500 ? 502 : res.status
    );
  }
  return data;
}

/**
 * Generates the official Meta OAuth dialog URL requesting Instagram Business permissions
 */
export function buildMetaOAuthDialogUrl(redirectUri: string, state: string, customScope?: string): string {
  const { appId } = getMetaAppCredentials();
  const permissions =
    customScope ||
    [
      'instagram_business_manage_comments',
      'instagram_manage_messages',
      'instagram_basic',
      'instagram_business_basic',
    ].join(',');

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: permissions,
    state,
  });

  return `${OAUTH_DIALOG_URL}?${params.toString()}`;
}

/**
 * Exchanges OAuth authorization code for long-lived Page Access Token and Instagram Business Account info
 */
export async function exchangeOAuthCodeForInstagramAccount(
  code: string,
  redirectUri: string
): Promise<MetaOAuthExchangeResult> {
  const { appId, appSecret } = getMetaAppCredentials();

  // 1. Exchange authorization code for short-lived user access token
  const userTokenUrl = new URL(`${GRAPH_BASE_URL}/oauth/access_token`);
  userTokenUrl.searchParams.set('client_id', appId);
  userTokenUrl.searchParams.set('client_secret', appSecret);
  userTokenUrl.searchParams.set('redirect_uri', redirectUri);
  userTokenUrl.searchParams.set('code', code);

  const userTokenRes = await fetch(userTokenUrl.toString());
  const userTokenData = await handleMetaResponse<{ access_token: string }>(userTokenRes, 'OAuth code exchange');

  // 2. Exchange short-lived user token for long-lived user token
  const longLivedUrl = new URL(`${GRAPH_BASE_URL}/oauth/access_token`);
  longLivedUrl.searchParams.set('grant_type', 'fb_exchange_token');
  longLivedUrl.searchParams.set('client_id', appId);
  longLivedUrl.searchParams.set('client_secret', appSecret);
  longLivedUrl.searchParams.set('fb_exchange_token', userTokenData.access_token);

  const longLivedRes = await fetch(longLivedUrl.toString());
  const longLivedData = await handleMetaResponse<{ access_token: string }>(longLivedRes, 'Long-lived token exchange');

  // 3. Query user's accounts (Pages) and linked Instagram Business Account
  const accountsUrl = new URL(`${GRAPH_BASE_URL}/me/accounts`);
  accountsUrl.searchParams.set(
    'fields',
    'id,name,access_token,instagram_business_account{id,username,profile_picture_url}'
  );
  accountsUrl.searchParams.set('access_token', longLivedData.access_token);

  const accountsRes = await fetch(accountsUrl.toString());
  const accountsData = await handleMetaResponse<{
    data: Array<{
      id: string;
      name: string;
      access_token: string;
      instagram_business_account?: {
        id: string;
        username: string;
        profile_picture_url?: string;
      };
    }>;
  }>(accountsRes, 'Facebook Pages and Instagram Business Account lookup');

  // Find page with connected Instagram Business Account
  const pageWithIg = accountsData.data?.find((p) => p.instagram_business_account?.id);
  if (!pageWithIg || !pageWithIg.instagram_business_account) {
    throw new AppError(
      'INSTAGRAM_BUSINESS_NOT_FOUND',
      'No connected Instagram Business/Creator Account found on the authenticated Facebook Page. Ensure your Instagram account is set to Business/Creator and connected to a Facebook Page.',
      400
    );
  }

  // 4. Subscribe the Page to webhook apps
  try {
    const subUrl = `${GRAPH_BASE_URL}/${pageWithIg.id}/subscribed_apps`;
    await fetch(subUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pageWithIg.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscribed_fields: ['feed', 'comments', 'messages', 'mention'],
      }),
    });
  } catch {
    // Non-fatal if subscription fails here; can be subscribed via App Dashboard
  }

  return {
    pageAccessToken: pageWithIg.access_token,
    pageId: pageWithIg.id,
    pageName: pageWithIg.name,
    instagramBusinessAccountId: pageWithIg.instagram_business_account.id,
    username: pageWithIg.instagram_business_account.username,
    profilePictureUrl: pageWithIg.instagram_business_account.profile_picture_url,
  };
}

/**
 * Fetch recent Instagram Media (Posts & Reels) for an Instagram Business Account
 * GET https://graph.facebook.com/v21.0/{instagram_business_account_id}/media
 */
export async function fetchInstagramMedia(
  pageAccessToken: string,
  instagramBusinessAccountId: string,
  limit: number = 25
): Promise<MetaMediaPost[]> {
  const url = new URL(`${GRAPH_BASE_URL}/${instagramBusinessAccountId}/media`);
  url.searchParams.set(
    'fields',
    'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,comments_count,like_count'
  );
  url.searchParams.set('limit', String(Math.min(Math.max(limit, 1), 100)));

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${pageAccessToken.trim()}`,
    },
  });

  const data = await handleMetaResponse<{ data: MetaMediaPost[] }>(res, 'Fetch Instagram media posts');
  return data.data || [];
}

/**
 * Post Public Reply to an Instagram Comment
 * POST https://graph.facebook.com/v21.0/{comment_id}/replies
 * Body: { "message": "..." }
 */
export async function postPublicCommentReply(
  pageAccessToken: string,
  commentId: string,
  message: string
): Promise<{ id: string }> {
  const url = `${GRAPH_BASE_URL}/${commentId}/replies`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${pageAccessToken.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  return await handleMetaResponse<{ id: string }>(res, 'Public comment reply');
}

/**
 * Send Private DM Reply to an Instagram Comment (Meta's official 1-time private reply within 7 days)
 * POST https://graph.facebook.com/v21.0/me/messages
 * Body: { "recipient": { "comment_id": "<COMMENT_ID>" }, "message": { "text": "..." } }
 */
export async function sendPrivateCommentReply(
  pageAccessToken: string,
  commentId: string,
  messageText: string,
  instagramBusinessAccountId?: string
): Promise<{ recipient_id?: string; message_id?: string }> {
  const body = JSON.stringify({
    recipient: { comment_id: commentId },
    message: { text: messageText },
  });

  // Try /me/messages first
  const primaryUrl = `${GRAPH_BASE_URL}/me/messages`;
  const res = await fetch(primaryUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${pageAccessToken.trim()}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  if (res.ok) {
    return (await res.json()) as { recipient_id?: string; message_id?: string };
  }

  // If /me/messages failed and businessAccountId is provided, try direct /{id}/messages
  if (instagramBusinessAccountId) {
    const fallbackUrl = `${GRAPH_BASE_URL}/${instagramBusinessAccountId}/messages`;
    const fallbackRes = await fetch(fallbackUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pageAccessToken.trim()}`,
        'Content-Type': 'application/json',
      },
      body,
    });
    if (fallbackRes.ok) {
      return (await fallbackRes.json()) as { recipient_id?: string; message_id?: string };
    }
  }

  return await handleMetaResponse<{ recipient_id?: string; message_id?: string }>(res, 'Private DM reply to comment');
}

export interface SendDirectMessageOptions {
  recipientId: string;
  messageText?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'file';
  useHumanAgentTag?: boolean;
  instagramBusinessAccountId?: string;
}

/**
 * Send an outbound Direct Message to an Instagram user (Customer IGSID)
 * POST https://graph.facebook.com/v21.0/me/messages
 */
export async function sendMetaDirectMessage(
  pageAccessToken: string,
  options: SendDirectMessageOptions
): Promise<{ recipient_id?: string; message_id?: string }> {
  const { recipientId, messageText, mediaUrl, mediaType = 'image', useHumanAgentTag, instagramBusinessAccountId } = options;

  const messagePayload: any = {};
  if (mediaUrl) {
    messagePayload.attachment = {
      type: mediaType,
      payload: {
        url: mediaUrl,
        is_reusable: true,
      },
    };
  } else if (messageText) {
    messagePayload.text = messageText;
  } else {
    throw new AppError('MESSAGE_CONTENT_REQUIRED', 'Either messageText or mediaUrl is required.', 400);
  }

  const payload: any = {
    recipient: { id: recipientId },
    message: messagePayload,
  };

  if (useHumanAgentTag) {
    payload.messaging_type = 'MESSAGE_TAG';
    payload.tag = 'HUMAN_AGENT';
  }

  const body = JSON.stringify(payload);

  const primaryUrl = `${GRAPH_BASE_URL}/me/messages`;
  const res = await fetch(primaryUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${pageAccessToken.trim()}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  if (res.ok) {
    return (await res.json()) as { recipient_id?: string; message_id?: string };
  }

  if (instagramBusinessAccountId) {
    const fallbackUrl = `${GRAPH_BASE_URL}/${instagramBusinessAccountId}/messages`;
    const fallbackRes = await fetch(fallbackUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pageAccessToken.trim()}`,
        'Content-Type': 'application/json',
      },
      body,
    });
    if (fallbackRes.ok) {
      return (await fallbackRes.json()) as { recipient_id?: string; message_id?: string };
    }
  }

  return await handleMetaResponse<{ recipient_id?: string; message_id?: string }>(res, 'Send direct message');
}

export interface MetaUserProfile {
  id?: string;
  name?: string;
  username?: string;
  profile_pic?: string;
}

/**
 * Resolves an Instagram participant's public profile (username, name, profile_pic)
 * given their Instagram Scoped User ID (IGSID) and page access token.
 * GET https://graph.facebook.com/v21.0/{IGSID}?fields=name,username,profile_pic
 */
export async function getInstagramUserProfile(
  pageAccessToken: string,
  igsid: string
): Promise<MetaUserProfile | null> {
  if (!pageAccessToken || !igsid) return null;

  try {
    const url = new URL(`${GRAPH_BASE_URL}/${encodeURIComponent(igsid)}`);
    url.searchParams.set('fields', 'name,username,profile_pic');
    url.searchParams.set('access_token', pageAccessToken.trim());

    const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const data = (await res.json()) as MetaUserProfile;
      if (data.username || data.name) return data;
    }

    // Secondary fallback with just username and name
    const fallbackUrl = new URL(`${GRAPH_BASE_URL}/${encodeURIComponent(igsid)}`);
    fallbackUrl.searchParams.set('fields', 'username,name');
    fallbackUrl.searchParams.set('access_token', pageAccessToken.trim());
    const fallbackRes = await fetch(fallbackUrl, { signal: AbortSignal.timeout(3000) });
    if (fallbackRes.ok) {
      const data = (await fallbackRes.json()) as MetaUserProfile;
      if (data.username || data.name) return data;
    }
  } catch {
    // Non-blocking: profile lookup failure should never interrupt message flow
  }

  return null;
}

