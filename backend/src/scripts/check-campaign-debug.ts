import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const campaign = await prisma.campaign.findUnique({
    where: { id: 'cmuxr3in60009l0ukw9r18x3n' },
    include: {
      assignments: { include: { influencer: true } },
      applications: { include: { influencer: true } },
    },
  });
  console.log('Campaign details:', JSON.stringify(campaign, null, 2));

  const allAssignments = await prisma.campaignAssignment.findMany({
    include: { campaign: true, influencer: true },
  });
  console.log('All campaign assignments count:', allAssignments.length);
  console.log('All campaign assignments:', JSON.stringify(allAssignments, null, 2));

  const allUsers = await prisma.user.findMany({
    where: { role: 'INFLUENCER' },
    select: { id: true, email: true, displayName: true },
  });
  console.log('Influencer users in DB:', allUsers);
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
