import { PrismaClient } from '@prisma/client';
import { config } from '../config/env.js';

const prisma = new PrismaClient({ datasources: { db: { url: config.databaseUrl } } });

const PLATFORMS = [
  { source: 'whatsapp', medium: 'social_chat', weight: 0.40, convRate: 0.052, avgOrder: 1850 },
  { source: 'facebook', medium: 'social_post', weight: 0.28, convRate: 0.034, avgOrder: 1650 },
  { source: 'instagram', medium: 'story_bio', weight: 0.22, convRate: 0.038, avgOrder: 2200 },
  { source: 'custom', medium: 'custom_utm', weight: 0.10, convRate: 0.025, avgOrder: 1500 },
];

async function seedPlatformAnalytics() {
  console.log('Seeding WhatsApp, Facebook, Instagram, and Custom platform data...');

  const store = await prisma.organization.findFirst({ where: { status: 'ACTIVE' } });
  if (!store) {
    console.log('No active store found.');
    return;
  }

  // Clear existing old clicks to keep data strictly cleanly attributed
  await prisma.affiliateLinkClick.deleteMany({
    where: {
      organizationId: store.id,
      utmSource: { in: ['youtube', 'tiktok', 'telegram', 'twitter', 'pinterest'] },
    },
  });

  const influencers = await prisma.user.findMany({
    where: { role: { in: ['INFLUENCER', 'CUSTOMER'] } },
    select: { id: true, creatorCode: true, displayName: true },
  });

  if (!influencers.length) {
    console.log('No influencers found.');
    return;
  }

  for (const inf of influencers) {
    let link = await prisma.affiliateLink.findFirst({
      where: { creatorId: inf.id, organizationId: store.id },
    });

    if (!link) {
      link = await prisma.affiliateLink.create({
        data: {
          organizationId: store.id,
          creatorId: inf.id,
          slug: `${(inf.creatorCode || 'creator').toLowerCase()}-link`,
          targetType: 'STORE',
          destinationPath: '/',
          commissionRate: 15,
        },
      });
    }

    const now = Date.now();
    const clicksToCreate: any[] = [];
    const ordersToCreate: any[] = [];

    for (let day = 29; day >= 0; day--) {
      const dayTime = now - day * 24 * 60 * 60 * 1000;
      const dayClicksCount = Math.floor(Math.random() * 14) + 6;

      for (let c = 0; c < dayClicksCount; c++) {
        const rand = Math.random();
        let cum = 0;
        let chosenPlatform = PLATFORMS[0];
        for (const p of PLATFORMS) {
          cum += p.weight;
          if (rand <= cum) {
            chosenPlatform = p;
            break;
          }
        }

        const clickTimestamp = new Date(dayTime + Math.floor(Math.random() * 24 * 60 * 60 * 1000));
        clicksToCreate.push({
          organizationId: store.id,
          linkId: link.id,
          visitorHash: `vis_${Math.random().toString(36).substring(2, 10)}`,
          utmSource: chosenPlatform.source,
          utmMedium: chosenPlatform.medium,
          utmCampaign: `${(inf.creatorCode || 'campaign').toLowerCase()}-promo`,
          createdAt: clickTimestamp,
        });

        if (Math.random() < chosenPlatform.convRate) {
          const orderAmount = Math.round(chosenPlatform.avgOrder * (0.85 + Math.random() * 0.3));
          const commissionAmount = Math.round(orderAmount * 0.15);
          const shopifyOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

          ordersToCreate.push({
            order: {
              organizationId: store.id,
              shopifyId: shopifyOrderId,
              name: `#ORD-${Math.floor(1000 + Math.random() * 9000)}`,
              email: `buyer_${Math.random().toString(36).substring(2, 6)}@example.com`,
              currency: 'INR',
              total: String(orderAmount),
              creatorCode: inf.creatorCode || 'SARAH88',
              processedAt: clickTimestamp,
              payload: {
                source: 'shopify',
                platform: chosenPlatform.source,
                total_price: orderAmount,
              },
            },
            commission: {
              organizationId: store.id,
              linkId: link.id,
              creatorId: inf.id,
              shopifyOrderId: '',
              orderAmount,
              commissionRate: 15,
              amount: commissionAmount,
              status: 'APPROVED',
              createdAt: clickTimestamp,
            },
          });
        }
      }
    }

    if (clicksToCreate.length) {
      await prisma.affiliateLinkClick.createMany({
        data: clicksToCreate,
      });
    }

    for (const item of ordersToCreate) {
      try {
        const order = await prisma.shopifyOrder.create({
          data: item.order,
        });
        await prisma.affiliateCommission.create({
          data: {
            ...item.commission,
            shopifyOrderId: order.shopifyId,
          },
        });
      } catch {
        // ignore duplicate
      }
    }
  }

  console.log('✅ Clean WhatsApp, Facebook, Instagram, and Custom data seeded!');
}

seedPlatformAnalytics()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
