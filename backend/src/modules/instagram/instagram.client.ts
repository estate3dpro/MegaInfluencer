import { config } from '../../config/env.js';
import { AppError } from '../../shared/errors/app-error.js';

const oauthUrl = 'https://api.instagram.com/oauth/authorize';
const tokenUrl = 'https://api.instagram.com/oauth/access_token';
const graphUrl = 'https://graph.instagram.com';
const messagingGraphUrl = 'https://graph.instagram.com/v23.0';

type InstagramError = { error?: { message?: string; type?: string; code?: number } };

export type InstagramUser = {
  id: string;
  username: string;
  name?: string;
  legacy_instagram_user_id?: string;
};
export type InstagramMedia = {
  id: string;
  caption?: string;
  media_type: string;
  media_url?: string;
  thumbnail_url?: string;
  timestamp?: string;
  permalink?: string;
};

export type InstagramProfile = {
  id: string;
  username: string;
  name?: string;
  legacy_instagram_user_id?: string;
  media_count?: number;
  followers_count?: number;
  follows_count?: number;
};

function clientConfig() {
  if (!config.instagramAppId || !config.instagramAppSecret) {
    throw new AppError('INSTAGRAM_CONFIGURATION_ERROR', 'Instagram OAuth is not configured.', 503);
  }
  return { appId: config.instagramAppId, appSecret: config.instagramAppSecret };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as T & InstagramError;
  if (!response.ok) {
    throw new AppError('INSTAGRAM_PROVIDER_ERROR', body.error?.message ?? 'Instagram rejected the request.', 502);
  }
  return body;
}

export function createAuthorizationUrl(redirectUri: string, state: string) {
  const { appId } = clientConfig();
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
    scope: 'instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments',
  });
  // Append #weblink to prevent mobile operating systems (especially Android)
  // from hijacking the authorization URL into the native Instagram app.
  return `${oauthUrl}?${params}#weblink`;
}

export async function exchangeAuthorizationCode(code: string, redirectUri: string) {
  const { appId, appSecret } = clientConfig();
  const body = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code,
  });
  const response = await fetch(tokenUrl, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body });
  return parseResponse<{ access_token: string; user_id: string }>(response);
}

export async function exchangeLongLivedToken(shortLivedToken: string) {
  const { appSecret } = clientConfig();
  const url = new URL(`${graphUrl}/access_token`);
  url.searchParams.set('grant_type', 'ig_exchange_token');
  url.searchParams.set('client_secret', appSecret);
  url.searchParams.set('access_token', shortLivedToken);
  const response = await fetch(url);
  return parseResponse<{ access_token: string; expires_in?: number }>(response);
}

export async function getInstagramUser(accessToken: string) {
  const url = new URL(`${graphUrl}/me`);
  // Instagram Login can return a modern API user ID while Instagram webhook
  // entries use the account's legacy professional-account ID. Request both.
  url.searchParams.set('fields', 'id,username,name,legacy_instagram_user_id');
  url.searchParams.set('access_token', accessToken);
  try {
    return await parseResponse<InstagramUser>(await fetch(url));
  } catch {
    // The legacy field is not available for every Meta app/API version. Do
    // not let that optional enrichment prevent a user from connecting.
    url.searchParams.set('fields', 'id,username,name');
    return parseResponse<InstagramUser>(await fetch(url));
  }
}

export async function getInstagramMedia(accessToken: string, limit: number) {
  const url = new URL(`${graphUrl}/me/media`);
  url.searchParams.set('fields', 'id,caption,media_type,media_url,thumbnail_url,timestamp,permalink');
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('access_token', accessToken);
  const response = await parseResponse<{ data: InstagramMedia[] }>(await fetch(url));
  return response.data;
}

const profileCache = new Map<string, { data: InstagramProfile; expiresAt: number }>();

export async function getInstagramProfile(accessToken: string) {
  const trimmedToken = (accessToken || '').trim();
  if (!trimmedToken) return null;

  const cached = profileCache.get(trimmedToken);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  try {
    const profileUrl = new URL(`${graphUrl}/me`);
    profileUrl.searchParams.set('fields', 'id,username,name,media_count,legacy_instagram_user_id');
    profileUrl.searchParams.set('access_token', trimmedToken);
    let profile: InstagramProfile;
    try {
      profile = await parseResponse<InstagramProfile>(
        await fetch(profileUrl, { signal: AbortSignal.timeout(1500) })
      );
    } catch {
      // Keep the Profile page available when Meta does not expose the legacy
      // account field for this app/token.
      profileUrl.searchParams.set('fields', 'id,username,name,media_count');
      profile = await parseResponse<InstagramProfile>(
        await fetch(profileUrl, { signal: AbortSignal.timeout(1500) })
      );
    }

    // Follower/following counts are only available to eligible Meta app/account
    // combinations. Keep the profile usable when Meta does not grant these fields.
    const statisticsUrl = new URL(`${graphUrl}/me`);
    statisticsUrl.searchParams.set('fields', 'followers_count,follows_count');
    statisticsUrl.searchParams.set('access_token', trimmedToken);
    let fullProfile: InstagramProfile = profile;
    try {
      const statistics = await parseResponse<Pick<InstagramProfile, 'followers_count' | 'follows_count'>>(
        await fetch(statisticsUrl, { signal: AbortSignal.timeout(1500) })
      );
      fullProfile = { ...profile, ...statistics };
    } catch {
      fullProfile = profile;
    }

    // Cache valid profile for 5 minutes
    profileCache.set(trimmedToken, { data: fullProfile, expiresAt: now + 5 * 60 * 1000 });
    return fullProfile;
  } catch {
    // If request fails or times out, return stale cache if available, else null
    if (cached) return cached.data;
    return null;
  }
}

/**
 * Send the configured private reply for a comment webhook.  This is the
 * Instagram Login messaging endpoint: the recipient is the comment ID, not
 * the commenter ID, which allows Meta to deliver the initial private reply.
 */
export async function sendInstagramPrivateReply(
  accessToken: string,
  instagramUserId: string,
  commentId: string,
  message: string,
) {
  const response = await fetch(`${messagingGraphUrl}/${instagramUserId}/messages`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${accessToken.trim()}`,
    },
    body: JSON.stringify({
      recipient: { comment_id: commentId },
      message: { text: message },
    }),
  });
  return parseResponse<{ recipient_id?: string; message_id?: string }>(response);
}

/** Send a normal DM after the customer has started a conversation. */
export async function sendInstagramDirectMessage(
  accessToken: string,
  instagramUserId: string,
  recipientId: string,
  message: string,
) {
  const response = await fetch(`${messagingGraphUrl}/${instagramUserId}/messages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken.trim()}` },
    body: JSON.stringify({ recipient: { id: recipientId }, message: { text: message } }),
  });
  return parseResponse<{ recipient_id?: string; message_id?: string }>(response);
}

/** Look up a sender when Meta omitted its username from the webhook payload. */
export async function getInstagramMessageSender(accessToken: string, messageId: string, expectedSenderId: string) {
  try {
    // Primary: Query the user's IGSID node directly on Graph API v21.0
    const url = new URL(`https://graph.facebook.com/v21.0/${encodeURIComponent(expectedSenderId)}`);
    url.searchParams.set('fields', 'name,username,profile_pic');
    url.searchParams.set('access_token', accessToken.trim());
    const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (response.ok) {
      const body = (await response.json()) as { id?: string; username?: string; name?: string };
      if (body.username || body.name) {
        return { username: body.username?.trim() || null, name: body.name?.trim() || null };
      }
    }

    // Secondary fallback: query message node if available
    if (messageId) {
      const msgUrl = new URL(`https://graph.facebook.com/v21.0/${encodeURIComponent(messageId)}`);
      msgUrl.searchParams.set('fields', 'from{id,username,name}');
      msgUrl.searchParams.set('access_token', accessToken.trim());
      const msgResponse = await fetch(msgUrl, { signal: AbortSignal.timeout(2000) });
      if (msgResponse.ok) {
        const body = (await msgResponse.json()) as { from?: { id?: string; username?: string; name?: string } };
        if (body.from?.username || body.from?.name) {
          return { username: body.from.username?.trim() || null, name: body.from.name?.trim() || null };
        }
      }
    }
  } catch {
    // Profile metadata is optional and must never delay or reject a webhook.
  }
  return null;
}

/** Subscribe an Instagram connected account to receive comment and messaging webhooks */
export async function subscribeInstagramWebhooks(accessToken: string, instagramUserId?: string) {
  const target = instagramUserId ? `${messagingGraphUrl}/${instagramUserId}/subscribed_apps` : `${messagingGraphUrl}/me/subscribed_apps`;
  const url = new URL(target);
  url.searchParams.set('subscribed_fields', 'comments,messages');
  url.searchParams.set('access_token', accessToken.trim());

  try {
    const response = await fetch(url, { method: 'POST' });
    return await parseResponse<{ success?: boolean }>(response);
  } catch (error) {
    // Fallback using root graph URL
    const fallbackUrl = new URL(instagramUserId ? `${graphUrl}/${instagramUserId}/subscribed_apps` : `${graphUrl}/me/subscribed_apps`);
    fallbackUrl.searchParams.set('subscribed_fields', 'comments,messages');
    fallbackUrl.searchParams.set('access_token', accessToken.trim());
    const response = await fetch(fallbackUrl, { method: 'POST' });
    return await parseResponse<{ success?: boolean }>(response);
  }
}

