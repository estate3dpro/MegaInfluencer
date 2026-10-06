import { z } from 'zod';

export const updateReferralSettingsSchema = z.object({
  isEnabled: z.boolean().optional(),
  rewardMode: z.enum(['POINTS', 'CASHBACK_COMMISSION', 'DISCOUNT_ONLY', 'HYBRID']).optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  pointsPerCurrency: z.number().min(1).max(1000).optional(),
  welcomeBonusPoints: z.number().min(0).max(10000).optional(),
  minPayoutAmount: z.number().min(0).optional(),
  
  friendDiscountEnabled: z.boolean().optional(),
  friendDiscountType: z.enum(['PERCENTAGE', 'FIXED', 'FREE_SHIPPING']).optional(),
  friendDiscountValue: z.number().min(0).optional(),
  
  showTierRoadmap: z.boolean().optional(),
  showPerformanceCharts: z.boolean().optional(),
  showRewardsStore: z.boolean().optional(),
  showRecentPurchases: z.boolean().optional(),
  
  programTitle: z.string().max(255).optional().nullable(),
  customShareMessage: z.string().max(500).optional().nullable(),
  accentColor: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/).optional().nullable(),
});

export type UpdateReferralSettingsInput = z.infer<typeof updateReferralSettingsSchema>;
