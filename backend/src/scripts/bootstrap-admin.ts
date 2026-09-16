import argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';

import { config } from '../config/env.js';

const email = required('ADMIN_EMAIL').trim().toLowerCase();
const password = required('ADMIN_PASSWORD');
const displayName = process.env.ADMIN_NAME?.trim() || 'Platform Admin';
const prisma = new PrismaClient({ datasources: { db: { url: config.databaseUrl } } });

try {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('An account already exists for ADMIN_EMAIL. No changes were made.');
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });
  await prisma.user.create({ data: { email, passwordHash, displayName, role: 'ADMIN' } });
  console.log(`Admin account created for ${email}.`);
} finally {
  await prisma.$disconnect();
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}
