import { PrismaClient } from '@prisma/client';

import { ensureCreatorCode } from '../shared/creator-code.js';

const prisma = new PrismaClient();

async function main() {
  const creators = await prisma.user.findMany({
    where: { role: 'INFLUENCER', creatorCode: null },
    select: { id: true, displayName: true },
    orderBy: { createdAt: 'asc' },
  });

  for (const creator of creators) {
    const creatorCode = await ensureCreatorCode(prisma, creator.id);
    console.log(`Assigned ${creatorCode} to ${creator.displayName} (${creator.id}).`);
  }

  console.log(`Creator-code backfill complete: ${creators.length} creator(s) assigned.`);
}

main()
  .catch((error) => {
    console.error('Creator-code backfill failed.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
