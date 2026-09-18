import { createHash, randomBytes } from 'node:crypto';
import type { UserRole } from '@prisma/client';
import type { FastifyInstance } from 'fastify';

const refreshSessionLifetimeMs = 7 * 24 * 60 * 60_000;

export function hashRefreshToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(app: FastifyInstance, user: { id: string; role: UserRole }) {
  const accessToken = await app.jwt.sign({ sub: user.id, role: user.role, type: 'access' });
  const refreshToken = randomBytes(48).toString('base64url');
  await app.prisma.authSession.create({
    data: {
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + refreshSessionLifetimeMs),
    },
  });
  return { accessToken, refreshToken };
}
