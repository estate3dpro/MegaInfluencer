import { config } from '../../config/env.js';
import { AppError } from '../../shared/errors/app-error.js';

const oauthUrl = 'https://api.instagram.com/oauth/authorize';
const tokenUrl = 'https://api.instagram.com/oauth/access_token';
const graphUrl = 'https://graph.instagram.com';
const messagingGraphUrl = 'https://graph.instagram.com/v23.0';

type InstagramError = { error?: { message?: string; type?: string; code?: number } };

export type InstagramUser = { id: string; username: string; name?: string };
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
  return `${oauthUrl}?${params}`;
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
  url.searchParams.set('fields', 'id,username,name');
  url.searchParams.set('access_token', accessToken);
  return parseResponse<InstagramUser>(await fetch(url));
}

export async function getInstagramMedia(accessToken: string, limit: number) {
  const url = new URL(`${graphUrl}/me/media`);
  url.searchParams.set('fields', 'id,caption,media_type,media_url,thumbnail_url,timestamp,permalink');
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('access_token', accessToken);
  const response = await parseResponse<{ data: InstagramMedia[] }>(await fetch(url));
  return response.data;
}

export async function getInstagramProfile(accessToken: string) {
  const profileUrl = new URL(`${graphUrl}/me`);
  profileUrl.searchParams.set('fields', 'id,username,name,media_count');
  profileUrl.searchParams.set('access_token', accessToken);
  const profile = await parseResponse<InstagramProfile>(await fetch(profileUrl));

  // Follower/following counts are only available to eligible Meta app/account
  // combinations. Keep the profile usable when Meta does not grant these fields.
  const statisticsUrl = new URL(`${graphUrl}/me`);
  statisticsUrl.searchParams.set('fields', 'followers_count,follows_count');
  statisticsUrl.searchParams.set('access_token', accessToken);
  try {
    const statistics = await parseResponse<Pick<InstagramProfile, 'followers_count' | 'follows_count'>>(
      await fetch(statisticsUrl),
    );
    return { ...profile, ...statistics };
  } catch {
    return profile;
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
