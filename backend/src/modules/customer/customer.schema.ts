import { z } from 'zod';

export const updateCustomerProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().min(7).max(20).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  payoutMethod: z.enum(['UPI', 'PAYPAL', 'BANK', 'STORE_CREDIT']).optional().nullable(),
  payoutDetails: z.record(z.string(), z.any()).optional().nullable(),
});

export const createCustomerLinkSchema = z.object({
  storeId: z.string().min(1, 'Store ID is required'),
  productId: z.string().min(1).optional().nullable(),
  customSlug: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9-_]+$/, 'Slug can only contain letters, numbers, hyphens, and underscores').optional().nullable(),
});

export const claimRewardSchema = z.object({
  rewardType: z.enum(['DISCOUNT_CODE', 'CASH_PAYOUT', 'GIFT_CARD', 'STORE_CREDIT']),
  storeId: z.string().optional().nullable(),
  pointsCost: z.number().int().positive('Points cost must be positive'),
  rewardValue: z.number().positive('Reward value must be positive'),
  rewardTitle: z.string().min(1),
  payoutAccount: z.string().optional().nullable(),
});
