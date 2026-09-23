import { z } from 'zod';

export const conversationParamsSchema = z.object({
  conversationId: z.string().cuid(),
});

export const sendManualReplySchema = z.object({
  message: z.string().trim().min(1, 'Write a reply before sending.').max(1_000),
});
