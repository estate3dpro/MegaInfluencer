import { z } from 'zod';

export const conversationParamsSchema = z.object({
  // Historical conversations were backfilled with a `legacy_` prefix. New
  // records use a normal CUID, so accept both durable ID formats here.
  conversationId: z.string().refine(
    (value) => /^c[a-z0-9]{24,}$/i.test(value) || /^legacy_c[a-z0-9]{24,}$/i.test(value),
    'Invalid conversation ID.',
  ),
});

export const sendManualReplySchema = z.object({
  message: z.string().trim().min(1, 'Write a reply before sending.').max(1_000),
});
