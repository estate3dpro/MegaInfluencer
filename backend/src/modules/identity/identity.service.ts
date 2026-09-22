import argon2 from 'argon2';
import type { FastifyInstance } from 'fastify';
import type { UserRole } from '@prisma/client';

import { AppError, ForbiddenError } from '../../shared/errors/app-error.js';
import { createSession, hashRefreshToken } from '../../shared/auth/session.js';
import { ensureCreatorCode } from '../../shared/creator-code.js';

const passwordOptions = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

function toUserResponse(user: { id: string; email: string | null; displayName: string; role: UserRole; status: string }) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    status: user.status,
  };
}

export async function registerUser(
  app: FastifyInstance,
  input: { email: string; password: string; displayName: string; role: 'STORE_OWNER' | 'INFLUENCER' },
) {
  const existingUser = await app.prisma.user.findUnique({ where: { email: input.email } });
  if (existingUser) throw new AppError('EMAIL_IN_USE', 'An account already exists for this email.', 409);

  const passwordHash = await argon2.hash(input.password, passwordOptions);
  const user = await app.prisma.user.create({
    data: { email: input.email, passwordHash, displayName: input.displayName, role: input.role },
  });
  if (user.role === 'INFLUENCER') await ensureCreatorCode(app.prisma, user.id);

  return toUserResponse(user);
}

export async function loginUser(app: FastifyInstance, input: { email: string; password: string }) {
  const user = await app.prisma.user.findUnique({ where: { email: input.email } });
  const passwordMatches = user?.passwordHash ? await argon2.verify(user.passwordHash, input.password) : false;

  if (!user || !user.passwordHash || !passwordMatches || user.status !== 'ACTIVE') {
    throw new AppError('INVALID_CREDENTIALS', 'Email or password is incorrect.', 401);
  }

  return { ...(await createSession(app, user)), user: toUserResponse(user) };
}

export async function refreshUserSession(app: FastifyInstance, refreshToken: string) {
  const session = await app.prisma.authSession.findUnique({
    where: { tokenHash: hashRefreshToken(refreshToken) },
    include: { user: true },
  });
  if (!session || session.expiresAt <= new Date() || session.user.status !== 'ACTIVE') {
    throw new AppError('INVALID_REFRESH_TOKEN', 'Your session has expired. Please sign in again.', 401);
  }

  // Rotate tokens to make a stolen or replayed refresh token single-use.
  const consumed = await app.prisma.authSession.deleteMany({ where: { id: session.id, tokenHash: hashRefreshToken(refreshToken) } });
  if (consumed.count !== 1) throw new AppError('INVALID_REFRESH_TOKEN', 'Your session has expired. Please sign in again.', 401);
  const user = session.user;
  return { ...(await createSession(app, user)), user: toUserResponse(user) };
}

export async function createOrganization(app: FastifyInstance, ownerId: string, input: { name: string; slug?: string }) {
  const existingOrganization = await app.prisma.organization.findFirst({ where: { ownerId } });
  if (existingOrganization) {
    throw new AppError('ORGANIZATION_ALREADY_EXISTS', 'This Store Owner already has an organization.', 409);
  }

  const slug = input.slug ?? createSlug(input.name);
  const existing = await app.prisma.organization.findUnique({ where: { slug } });
  if (existing) throw new AppError('SLUG_IN_USE', 'That organization slug is already in use.', 409);

  return app.prisma.organization.create({ data: { name: input.name, slug, ownerId } });
}

export async function getOwnedOrganization(app: FastifyInstance, ownerId: string) {
  return app.prisma.organization.findFirst({ where: { ownerId }, orderBy: { createdAt: 'asc' } });
}

export async function updateOwnedOrganization(
  app: FastifyInstance,
  ownerId: string,
  input: { name?: string; slug?: string },
) {
  const organization = await getOwnedOrganization(app, ownerId);
  if (!organization) throw new AppError('ORGANIZATION_NOT_FOUND', 'Organization not found.', 404);

  if (input.slug && input.slug !== organization.slug) {
    const existing = await app.prisma.organization.findUnique({ where: { slug: input.slug } });
    if (existing) throw new AppError('SLUG_IN_USE', 'That organization slug is already in use.', 409);
  }

  return app.prisma.organization.update({ where: { id: organization.id }, data: input });
}

export async function updateUserStatus(app: FastifyInstance, adminId: string, userId: string, status: 'ACTIVE' | 'SUSPENDED') {
  if (adminId === userId) throw new ForbiddenError('You cannot change your own account status.');

  const user = await app.prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('USER_NOT_FOUND', 'User not found.', 404);

  return app.prisma.user.update({ where: { id: userId }, data: { status } });
}

function createSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
