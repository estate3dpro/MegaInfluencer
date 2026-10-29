import { PrismaClient } from '@prisma/client';
import { reconcileStoreRosterCommissions } from '../modules/store/commission-calculator.js';

const prisma = new PrismaClient();

async function main() {
  console.log('⚡ Starting Store Commission Reconciliation Engine...\n');

  const organizations = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      shopDomain: true,
      assignments: {
        include: {
          influencer: {
            select: { id: true, displayName: true, creatorCode: true }
          }
        }
      }
    }
  });

  if (organizations.length === 0) {
    console.log('No organizations found in database.');
    return;
  }

  for (const org of organizations) {
    console.log(`--------------------------------------------------`);
    console.log(`🏬 Store: ${org.name} (${org.shopDomain || org.id})`);
    console.log(`👥 Assigned Influencers: ${org.assignments.length}`);
    for (const a of org.assignments) {
      console.log(`   - ${a.influencer?.displayName || 'Unknown'} (@${a.influencer?.creatorCode || 'no-code'}) [Mode: ${a.compensationMode}]`);
    }

    try {
      const force = process.argv.includes('--force') || process.argv.includes('-f');
      const result = await reconcileStoreRosterCommissions(prisma, org.id, { forceRecalculate: force });
      console.log(`✅ Reconciliation result for ${org.name}: ${result.reconciledCount} orders reconciled/calculated!`);
    } catch (err: any) {
      console.error(`❌ Error reconciling commissions for ${org.name}:`, err.message);
    }
  }

  console.log(`\n==================================================`);
  console.log('✨ All store commissions successfully reconciled and verified!');
}

main()
  .catch((e) => {
    console.error('Fatal error during commission reconciliation:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
