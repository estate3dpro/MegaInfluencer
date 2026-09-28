import { z } from 'zod';

const keywordSchema = z.string().trim().min(1).max(64);

export const createInstagramAutomationSchema = z.object({
  name: z.string().trim().min(1).max(100),
  postId: z.string().trim().min(1).max(255),
  keywords: z.array(keywordSchema).min(1).max(20).transform((keywords) =>
    [...new Map(keywords.map((keyword) => [keyword.toLocaleLowerCase(), keyword])).values()],
  ),
  dmMessage: z.string().trim().min(1).max(1000),
  fallbackMessage: z.string().trim().max(1000).optional(),
  fallbackEnabled: z.boolean().default(true),
  wholeWordMatch: z.boolean().default(true),
  replyToAnyComment: z.boolean().default(false),
  replyOnDuplicateCommentWebhook: z.boolean().default(false),
});

export const automationParamsSchema = z.object({ automationId: z.string().cuid() });

export const updateInstagramAutomationSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  keywords: z.array(keywordSchema).min(1).max(20).transform((keywords) =>
    [...new Map(keywords.map((keyword) => [keyword.toLocaleLowerCase(), keyword])).values()],
  ).optional(),
  dmMessage: z.string().trim().min(1).max(1000).optional(),
  fallbackMessage: z.string().trim().max(1000).nullable().optional(),
  fallbackEnabled: z.boolean().optional(),
  wholeWordMatch: z.boolean().optional(),
  replyToAnyComment: z.boolean().optional(),
  replyOnDuplicateCommentWebhook: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'PAUSED']).optional(),
});


