import type { FastifyInstance } from 'fastify';
import type { z } from 'zod';

import { AppError } from '../../shared/errors/app-error.js';
import { listInstagramMedia } from '../instagram/instagram.service.js';
import { createInstagramAutomationSchema } from './instagram-automations.schema.js';

type CreateAutomationInput = z.infer<typeof createInstagramAutomationSchema>;

const automationSelect = {
  id: true,
  name: true,
  instagramPostId: true,
  postUrl: true,
  postLabel: true,
  keywords: true,
  dmMessage: true,
  wholeWordMatch: true,
  replyToAnyComment: true,
  replyOnDuplicateCommentWebhook: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

const automationWithDeliveriesSelect = {
  ...automationSelect,
  deliveries: { select: { status: true } },
} as const;

function withDeliveryStats(automation: any) {
  const deliveries = automation.deliveries ?? [];
  const { deliveries: _deliveries, ...rule } = automation;
  return {
    ...rule,
    deliveryCount: deliveries.length,
    sentCount: deliveries.filter((delivery: any) => delivery.status === 'SENT').length,
  };
}

function labelForPost(post: { caption?: string; media_type: string }) {
  const caption = post.caption?.trim().replace(/\s+/g, ' ');
  return caption ? caption.slice(0, 120) : `${post.media_type.toLowerCase()} post`;
}

export async function listInstagramAutomations(app: FastifyInstance, influencerId: string) {
  const automations = await app.prisma.instagramAutomation.findMany({
    where: { influencerId },
    select: automationWithDeliveriesSelect,
    orderBy: { createdAt: 'desc' },
  });
  return automations.map(withDeliveryStats);
}

export async function getInstagramAutomation(app: FastifyInstance, influencerId: string, automationId: string) {
  const automation = await app.prisma.instagramAutomation.findFirst({
    where: { id: automationId, influencerId },
    select: automationWithDeliveriesSelect,
  });
  if (!automation) throw new AppError('AUTOMATION_NOT_FOUND', 'Automation rule was not found.', 404);
  return withDeliveryStats(automation);
}

export async function createInstagramAutomation(app: FastifyInstance, influencerId: string, input: CreateAutomationInput) {
  // The media lookup both verifies an active connection and prevents rules from
  // targeting a post that belongs to another Instagram account.
  const posts = await listInstagramMedia(app, influencerId, 50);
  const post = posts.find((item) => item.id === input.postId);
  if (!post) throw new AppError('INSTAGRAM_POST_NOT_FOUND', 'Choose a post from your connected Instagram account.', 422);

  return app.prisma.instagramAutomation.create({
    data: {
      influencerId,
      name: input.name,
      instagramPostId: post.id,
      postUrl: post.permalink,
      postLabel: labelForPost(post),
      keywords: input.keywords,
      dmMessage: input.dmMessage,
      wholeWordMatch: input.wholeWordMatch,
      replyToAnyComment: input.replyToAnyComment,
      replyOnDuplicateCommentWebhook: input.replyOnDuplicateCommentWebhook,
    },
    select: automationSelect,
  });
}

export async function updateInstagramAutomationStatus(
  app: FastifyInstance,
  influencerId: string,
  automationId: string,
  status: 'ACTIVE' | 'PAUSED',
) {
  const updated = await app.prisma.instagramAutomation.updateMany({
    where: { id: automationId, influencerId },
    data: { status },
  });
  if (updated.count !== 1) throw new AppError('AUTOMATION_NOT_FOUND', 'Automation rule was not found.', 404);
  return getInstagramAutomation(app, influencerId, automationId);
}
