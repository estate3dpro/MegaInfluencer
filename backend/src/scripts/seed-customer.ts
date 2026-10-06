import argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';
import { config } from '../config/env.js';

const prisma = new PrismaClient({ datasources: { db: { url: config.databaseUrl } } });

async function seedCustomer() {
  const email = 'customer@example.com';
  const password = 'Password1234!';
  const displayName = 'Sarah Jenkins';

  console.log(`Seeding customer account: ${email}...`);

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });

  // Find or create user
  let user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        displayName,
        role: 'CUSTOMER',
        status: 'ACTIVE',
        creatorCode: user.creatorCode || 'SARAH88',
      },
    });
    console.log(`Updated existing user ${user.email} with password.`);
  } else {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName,
        role: 'CUSTOMER',
        status: 'ACTIVE',
        creatorCode: 'SARAH88',
      },
    });
    console.log(`Created new customer user: ${user.email}`);
  }

  // Ensure customer profile exists
  const existingProfile = await prisma.customerProfile.findUnique({ where: { userId: user.id } });
  if (!existingProfile) {
    await prisma.customerProfile.create({
      data: {
        userId: user.id,
        phone: '+91 9876543210',
        tier: 'GOLD',
        pointsBalance: 1250,
        totalEarned: 15000,
        payoutMethod: 'UPI',
        payoutDetails: { account: 'sarah@okaxis' },
      },
    });
  } else {
    await prisma.customerProfile.update({
      where: { userId: user.id },
      data: {
        pointsBalance: 1250,
        tier: 'GOLD',
      },
    });
  }

  // Find an active organization to attach referral links to
  const store = await prisma.organization.findFirst({ where: { status: 'ACTIVE' } });
  if (store) {
    // Check if link exists
    const existingLink = await prisma.affiliateLink.findFirst({
      where: { creatorId: user.id, organizationId: store.id },
    });

    let linkId = existingLink?.id;

    if (!existingLink) {
      const link = await prisma.affiliateLink.create({
        data: {
          organizationId: store.id,
          creatorId: user.id,
          slug: 'sarah-vip',
          targetType: 'STORE',
          destinationPath: '/',
          commissionRate: 10,
        },
      });
      linkId = link.id;
      console.log(`Created referral link /r/${link.slug} for store ${store.name}`);
    }

    // Add some clicks and sample orders if none exist
    const clicksCount = await prisma.affiliateLinkClick.count({ where: { linkId } });
    if (clicksCount < 10 && linkId) {
      for (let i = 0; i < 15; i += 1) {
        await prisma.affiliateLinkClick.create({
          data: {
            organizationId: store.id,
            linkId,
            referrer: 'https://instagram.com',
            utmSource: 'friend_referral',
          },
        });
      }
    }
  }

  console.log('\n=======================================');
  console.log('🎉 Customer Account Ready!');
  console.log('=======================================');
  console.log(`Email:       ${email}`);
  console.log(`Password:    ${password}`);
  console.log(`Name:        ${displayName}`);
  console.log(`Role:        CUSTOMER`);
  console.log(`CreatorCode: ${user.creatorCode}`);
  console.log(`Points:      1,250 pts`);
  console.log('=======================================\n');
}

seedCustomer()
  .catch((err) => {
    console.error('Failed to seed customer:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
