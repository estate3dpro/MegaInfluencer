import { randomInt } from 'node:crypto';

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateCreatorCode() {
  return Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join('');
}

/** Assign a code atomically so existing creators can be upgraded on first use. */
export async function ensureCreatorCode(prisma: any, creatorId: string) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const existing = await prisma.user.findUnique({ where: { id: creatorId }, select: { creatorCode: true } });
    if (existing?.creatorCode) return existing.creatorCode;
    try {
      const result = await prisma.user.updateMany({ where: { id: creatorId, creatorCode: null }, data: { creatorCode: generateCreatorCode() } });
      if (result.count === 1) {
        const updated = await prisma.user.findUnique({ where: { id: creatorId }, select: { creatorCode: true } });
        if (updated?.creatorCode) return updated.creatorCode;
      }
    } catch (error: any) {
      if (error?.code !== 'P2002') throw error;
    }
  }
  throw new Error('Unable to allocate a unique creator code.');
}
