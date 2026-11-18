import { PrismaClient } from '@prisma/client';
import { decryptToken } from '../modules/instagram/instagram.crypto.js';

const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.instagramAccount.findMany({
    where: { isActive: true },
    select: {
      username: true,
      instagramBusinessAccountId: true,
      tenantOrUserId: true,
      accessToken: true,
    },
  });
  const connections = await prisma.instagramConnection.findMany({
    where: { status: 'ACTIVE' },
    select: {
      username: true,
      instagramUserId: true,
      influencerId: true,
      encryptedAccessToken: true,
    },
  });

  console.log('\n======================================================');
  console.log('INSTAGRAM TOKENS IN DATABASE');
  console.log('======================================================');

  if (accounts.length === 0 && connections.length === 0) {
    console.log('No active Instagram accounts found in this database.');
  }

  for (const acc of accounts) {
    try {
      const token = decryptToken(acc.accessToken);
      console.log(`\n[Partner Account] @${acc.username} (ID: ${acc.instagramBusinessAccountId})`);
      console.log(`Tenant/User: ${acc.tenantOrUserId}`);
      console.log(`Access Token:\n${token}`);
    } catch (err: any) {
      console.log(`Could not decrypt token for @${acc.username}: ${err.message}`);
    }
  }

  for (const conn of connections) {
    try {
      const token = decryptToken(conn.encryptedAccessToken);
      console.log(`\n[Creator Connection] @${conn.username} (User ID: ${conn.instagramUserId})`);
      console.log(`Influencer ID: ${conn.influencerId}`);
      console.log(`Access Token:\n${token}`);
    } catch (err: any) {
      console.log(`Could not decrypt token for @${conn.username}: ${err.message}`);
    }
  }

  console.log('\n======================================================\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
