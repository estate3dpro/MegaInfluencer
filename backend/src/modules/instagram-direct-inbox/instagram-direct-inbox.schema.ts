import { z } from 'zod';
export const directConversationParamsSchema = z.object({ conversationId: z.string().cuid() });
export const sendDirectMessageSchema = z.object({ message: z.string().trim().min(1).max(1_000) });
