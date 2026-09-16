import type { FastifyInstance } from 'fastify';

import { AppError } from '../../shared/errors/app-error.js';
import { getInstagramProfile } from '../instagram/instagram.client.js';
import { decryptToken } from '../instagram/instagram.crypto.js';

const pageSize = 20;

export async function listAdminInfluencers(
  app: FastifyInstance,
  input: { page: number; search?: string; status?: 'ACTIVE' | 'SUSPENDED' },
) {
  const where = {
    role: 'INFLUENCER' as const,
    ...(input.status ? { status: input.status } : {}),
    ...(input.search
      ? {
          OR: [
            { displayName: { contains: input.search, mode: 'insensitive' as const } },
            { email: { contains: input.search, mode: 'insensitive' as const } },
            { instagramConnection: { username: { contains: input.search, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  };

  const [influencers, total] = await Promise.all([
    app.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (input.page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        displayName: true,
        email: true,
        status: true,
        createdAt: true,
        instagramConnection: { select: { instagramUserId: true, username: true, status: true } },
      },
    }),
    app.prisma.user.count({ where }),
  ]);

  return {
    influencers: influencers.map(({ instagramConnection, ...influencer }) => ({
      ...influencer,
      instagramUsername: instagramConnection?.username ?? null,
      instagramId: instagramConnection?.instagramUserId ?? null,
      instagramConnectionStatus: instagramConnection?.status ?? null,
    })),
    pagination: { page: input.page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

export async function getAdminInfluencer(app: FastifyInstance, influencerId: string) {
  const influencer = await app.prisma.user.findFirst({
    where: { id: influencerId, role: 'INFLUENCER' },
    select: {
      id: true,
      displayName: true,
      email: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      instagramConnection: {
        select: {
          instagramUserId: true,
          username: true,
          displayName: true,
          status: true,
          tokenExpiresAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!influencer) throw new AppError('INFLUENCER_NOT_FOUND', 'Influencer not found.', 404);
  return influencer;
}

export async function updateAdminInfluencerStatus(
  app: FastifyInstance,
  adminId: string,
  influencerId: string,
  status: 'ACTIVE' | 'SUSPENDED',
) {
  if (adminId === influencerId) throw new AppError('INVALID_STATUS_CHANGE', 'You cannot change your own status.', 400);
  await getAdminInfluencer(app, influencerId);
  return app.prisma.user.update({ where: { id: influencerId }, data: { status }, select: { id: true, status: true, updatedAt: true } });
}

export async function getAdminInfluencerInstagramProfile(app: FastifyInstance, influencerId: string) {
  await getAdminInfluencer(app, influencerId);
  const connection = await app.prisma.instagramConnection.findUnique({
    where: { influencerId },
    select: { instagramUserId: true, username: true, displayName: true, status: true, tokenExpiresAt: true, createdAt: true, encryptedAccessToken: true },
  });
  if (!connection) return { connection: null, profile: null, unavailableReason: 'Instagram is not connected.' };
  const publicConnection = { instagramUserId: connection.instagramUserId, username: connection.username, displayName: connection.displayName, status: connection.status, connectedAt: connection.createdAt, tokenExpiresAt: connection.tokenExpiresAt };
  if (connection.status !== 'ACTIVE' || (connection.tokenExpiresAt && connection.tokenExpiresAt <= new Date())) {
    return { connection: publicConnection, profile: null, unavailableReason: 'The Instagram connection needs to be renewed.' };
  }
  try {
    return { connection: publicConnection, profile: await getInstagramProfile(decryptToken(connection.encryptedAccessToken)), unavailableReason: null };
  } catch {
    return { connection: publicConnection, profile: null, unavailableReason: 'Instagram statistics are temporarily unavailable.' };
  }
}
