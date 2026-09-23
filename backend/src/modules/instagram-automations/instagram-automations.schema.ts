import { z } from 'zod';

const keywordSchema = z.string().trim().min(1).max(64);

export const createInstagramAutomationSchema = z.object({
  name: z.string().trim().min(1).max(100),
  postId: z.string().trim().min(1).max(255),
  keywords: z.array(keywordSchema).min(1).max(20).transform((keywords) =>
    [...new Map(keywords.map((keyword) => [keyword.toLocaleLowerCase(), keyword])).values()],
  ),
  dmMessage: z.string().trim().min(1).max(1000),
  wholeWordMatch: z.boolean().default(true),
  replyOnDuplicateCommentWebhook: z.boolean().default(false),
});

export const automationParamsSchema = z.object({ automationId: z.string().cuid() });

export const updateInstagramAutomationSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED']),
});
