import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
import type { FastifyInstance } from 'fastify';

import { config } from '../../config/env.js';
import { AppError, ForbiddenError } from '../../shared/errors/app-error.js';
import { createSession } from '../../shared/auth/session.js';
import { createAuthorizationUrl, exchangeAuthorizationCode, exchangeLongLivedToken, getInstagramMedia, getInstagramProfile as fetchInstagramProfile, getInstagramUser } from './instagram.client.js';
import { createOpaqueToken, decryptToken, encryptToken, hashOpaqueToken } from './instagram.crypto.js';

const stateLifetimeMs = 10 * 60_000;
const ticketLifetimeMs = 60_000;
const localWebhookForwardTimeoutMs = 10_000;

function callbackUrl() {
  if (!config.publicBaseUrl) {
    throw new AppError('INSTAGRAM_CONFIGURATION_ERROR', 'PUBLIC_BASE_URL is required for Instagram OAuth.', 503);
  }
  return `${config.publicBaseUrl}/api/v1/auth/instagram/callback`;
}

function frontendUrl(path: string, params: Record<string, string>) {
  const url = new URL(path, config.frontendOrigin);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
}

export async function beginInstagramOAuth(app: FastifyInstance, flow: 'LOGIN' | 'CONNECT', influencerId?: string) {
  const state = createOpaqueToken();
  await app.prisma.instagramOAuthState.create({
    data: { stateHash: hashOpaqueToken(state), flow, influencerId, expiresAt: new Date(Date.now() + stateLifetimeMs) },
  });
  return createAuthorizationUrl(callbackUrl(), state);
}

async function consumeOAuthState(app: FastifyInstance, stateValue: string) {
  const state = await app.prisma.instagramOAuthState.findUnique({ where: { stateHash: hashOpaqueToken(stateValue) } });
  if (!state || state.consumedAt || state.expiresAt <= new Date()) {
    throw new AppError('INVALID_OAUTH_STATE', 'The Instagram authorization request has expired. Please try again.', 400);
  }
  const consumed = await app.prisma.instagramOAuthState.updateMany({
    where: { id: state.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  if (consumed.count !== 1) throw new AppError('INVALID_OAUTH_STATE', 'The authorization response has already been used.', 400);
  return state;
}

async function saveConnection(
  app: FastifyInstance,
  influencerId: string,
  instagramUser: { id: string; username: string; name?: string },
  accessToken: string,
  expiresIn?: number,
) {
  const connectedElsewhere = await app.prisma.instagramConnection.findUnique({ where: { instagramUserId: instagramUser.id } });
  if (connectedElsewhere && connectedElsewhere.influencerId !== influencerId) {
    throw new AppError('INSTAGRAM_ACCOUNT_ALREADY_LINKED', 'This Instagram account is connected to another influencer.', 409);
  }
  return app.prisma.instagramConnection.upsert({
    where: { influencerId },
    create: {
      influencerId,
      instagramUserId: instagramUser.id,
      username: instagramUser.username,
      displayName: instagramUser.name,
      encryptedAccessToken: encryptToken(accessToken),
      tokenExpiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
      status: 'ACTIVE',
    },
    update: {
      instagramUserId: instagramUser.id,
      username: instagramUser.username,
      displayName: instagramUser.name,
      encryptedAccessToken: encryptToken(accessToken),
      tokenExpiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
      status: 'ACTIVE',
    },
    select: { id: true, instagramUserId: true, username: true, displayName: true, tokenExpiresAt: true, status: true },
  });
}

export async function completeInstagramOAuth(app: FastifyInstance, input: { code: string; state: string }) {
  const state = await consumeOAuthState(app, input.state);
  const shortLived = await exchangeAuthorizationCode(input.code, callbackUrl());
  const longLived = await exchangeLongLivedToken(shortLived.access_token);
  const instagramUser = await getInstagramUser(longLived.access_token);

  if (state.flow === 'CONNECT') {
    if (!state.influencerId) throw new AppError('INVALID_OAUTH_STATE', 'The connection request is incomplete.', 400);
    const influencer = await app.prisma.user.findUnique({
      where: { id: state.influencerId },
      select: { role: true, status: true },
    });
    if (!influencer || influencer.role !== 'INFLUENCER' || influencer.status !== 'ACTIVE') {
      throw new ForbiddenError('This account cannot connect an Instagram profile.');
    }
    await saveConnection(app, state.influencerId, instagramUser, longLived.access_token, longLived.expires_in);
    return { redirectUrl: frontendUrl('/influencer/instagram-automation', { instagram: 'connected' }) };
  }

  const existingConnection = await app.prisma.instagramConnection.findUnique({
    where: { instagramUserId: instagramUser.id },
    select: { influencerId: true },
  });
  let influencerId: string;
  if (!existingConnection) {
    const user = await app.prisma.user.create({
      data: { displayName: instagramUser.name || instagramUser.username, role: 'INFLUENCER' },
      select: { id: true },
    });
    influencerId = user.id;
  } else {
    influencerId = existingConnection.influencerId;
  }
  await saveConnection(app, influencerId, instagramUser, longLived.access_token, longLived.expires_in);

  const ticket = createOpaqueToken();
  await app.prisma.instagramLoginTicket.create({
    data: { userId: influencerId, codeHash: hashOpaqueToken(ticket), expiresAt: new Date(Date.now() + ticketLifetimeMs) },
  });
  return { redirectUrl: frontendUrl('/login', { instagramLoginCode: ticket }) };
}

export async function exchangeInstagramLoginTicket(app: FastifyInstance, code: string) {
  const ticket = await app.prisma.instagramLoginTicket.findUnique({
    where: { codeHash: hashOpaqueToken(code) },
    include: { user: true },
  });
  if (!ticket || ticket.consumedAt || ticket.expiresAt <= new Date()) {
    throw new AppError('INVALID_LOGIN_TICKET', 'The Instagram sign-in link has expired. Please try again.', 401);
  }
  const consumed = await app.prisma.instagramLoginTicket.updateMany({ where: { id: ticket.id, consumedAt: null }, data: { consumedAt: new Date() } });
  if (consumed.count !== 1) throw new AppError('INVALID_LOGIN_TICKET', 'The Instagram sign-in link has already been used.', 401);
  if (ticket.user.status !== 'ACTIVE' || ticket.user.role !== 'INFLUENCER') throw new ForbiddenError('This Instagram account cannot access the influencer workspace.');

  return {
    ...(await createSession(app, ticket.user)),
    user: { id: ticket.user.id, email: ticket.user.email, displayName: ticket.user.displayName, role: ticket.user.role, status: ticket.user.status },
  };
}

export async function getConnection(app: FastifyInstance, influencerId: string) {
  return app.prisma.instagramConnection.findUnique({
    where: { influencerId },
    select: { id: true, instagramUserId: true, username: true, displayName: true, tokenExpiresAt: true, status: true, createdAt: true, updatedAt: true },
  });
}

export async function disconnectInstagram(app: FastifyInstance, influencerId: string) {
  await app.prisma.instagramConnection.deleteMany({ where: { influencerId } });
}

export async function listInstagramMedia(app: FastifyInstance, influencerId: string, limit: number) {
  const connection = await app.prisma.instagramConnection.findUnique({ where: { influencerId } });
  if (!connection || connection.status !== 'ACTIVE') throw new AppError('INSTAGRAM_NOT_CONNECTED', 'Connect an active Instagram account first.', 409);
  if (connection.tokenExpiresAt && connection.tokenExpiresAt <= new Date()) throw new AppError('INSTAGRAM_TOKEN_EXPIRED', 'Reconnect Instagram to refresh the expired token.', 409);
  return getInstagramMedia(decryptToken(connection.encryptedAccessToken), limit);
}

export async function getInstagramProfile(app: FastifyInstance, influencerId: string) {
  const connection = await app.prisma.instagramConnection.findUnique({ where: { influencerId } });
  if (!connection || connection.status !== 'ACTIVE') {
    throw new AppError('INSTAGRAM_NOT_CONNECTED', 'Connect an active Instagram account first.', 409);
  }
  if (connection.tokenExpiresAt && connection.tokenExpiresAt <= new Date()) {
    throw new AppError('INSTAGRAM_TOKEN_EXPIRED', 'Reconnect Instagram to refresh the expired token.', 409);
  }
  const profile = await fetchInstagramProfile(decryptToken(connection.encryptedAccessToken));
  return {
    connection: {
      instagramUserId: connection.instagramUserId,
      username: connection.username,
      displayName: connection.displayName,
      status: connection.status,
      connectedAt: connection.createdAt,
      tokenExpiresAt: connection.tokenExpiresAt,
    },
    profile,
  };
}

export function verifyWebhookSignature(rawBody: Buffer, header: string | undefined) {
  if (!header?.startsWith('sha256=') || !config.metaAppSecret) return false;
  const signature = header.slice('sha256='.length);
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac('sha256', config.metaAppSecret).update(rawBody).digest('hex');
  return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
}

/** Forwards the exact verified Meta payload to the opted-in local ngrok API. */
export async function forwardWebhookToLocal(rawBody: Buffer, signature: string | undefined) {
  if (!config.localWebhookUrl) return false;

  // Copy into a standard Uint8Array while preserving every signed byte.
  const body = new Uint8Array(rawBody.byteLength);
  body.set(rawBody);

  const response = await fetch(config.localWebhookUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-meta-webhook': 'true',
      ...(signature ? { 'x-hub-signature-256': signature } : {}),
    },
    // Never JSON.stringify the payload: Meta's signature covers its raw bytes.
    body,
    signal: AbortSignal.timeout(localWebhookForwardTimeoutMs),
  });

  if (!response.ok) throw new Error(`Local webhook returned HTTP ${response.status}.`);
  return true;
}

export async function recordWebhookDelivery(app: FastifyInstance, rawBody: Buffer, payload: unknown) {
  const payloadHash = createHash('sha256').update(rawBody).digest('hex');
  try {
    await app.prisma.instagramWebhookDelivery.create({ data: { payloadHash, payload: payload as object } });
    return { duplicate: false };
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') return { duplicate: true };
    throw error;
  }
}
