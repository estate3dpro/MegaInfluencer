import { z } from 'zod';

export const oauthCallbackQuerySchema = z.object({
  code: z.string().min(1).optional(),
  state: z.string().min(20).optional(),
  error: z.string().min(1).optional(),
});

export const exchangeLoginTicketSchema = z.object({ code: z.string().min(20).max(200) });

export const mediaQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(50).default(25) });

export const webhookVerificationSchema = z.object({
  'hub.mode': z.string().optional(),
  'hub.verify_token': z.string().optional(),
  'hub.challenge': z.string().optional(),
});
