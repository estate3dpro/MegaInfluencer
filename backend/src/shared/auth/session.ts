import type { UserRole } from '@prisma/client';
import type { FastifyInstance } from 'fastify';

export async function createSession(app: FastifyInstance, user: { id: string; role: UserRole }) {
  const accessToken = await app.jwt.sign({ sub: user.id, role: user.role, type: 'access' });
  const refreshToken = await app.jwt.sign({ sub: user.id, role: user.role, type: 'refresh' }, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}
