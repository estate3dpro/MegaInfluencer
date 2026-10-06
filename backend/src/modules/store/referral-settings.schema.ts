import { z } from 'zod';

export const updateReferralSettingsSchema = z.object({
  isEnabled: z.boolean().optional(),
  rewardMode: z.enum(['POINTS', 'CASHBACK_COMMISSION', 'DISCOUNT_ONLY', 'HYBRID']).optional(),
  
  // Rule 1: Percentage of Order Rule (Inactivable)
  percentageEnabled: z.boolean().optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  pointsPerCurrency: z.number().min(1).max(1000).optional(),
  
  // Rule 2: Spend Ratio Rule - X Tokens per Y Spent (Inactivable)
  spendTokensEnabled: z.boolean().optional(),
  spendTokensRate: z.number().min(0).optional(),
  spendTokensAmount: z.number().min(1).optional(),

  // Rule 3: Fixed Flat Tokens Per Order Rule (Inactivable)
  fixedTokensEnabled: z.boolean().optional(),
  fixedTokensPerOrder: z.number().min(0).optional(),

  // Rule 4: Welcome Bonus Rule (Inactivable)
  welcomeBonusEnabled: z.boolean().optional(),
  welcomeBonusPoints: z.number().min(0).max(10000).optional(),
  
  minPayoutAmount: z.number().min(0).optional(),
  
  // Friend Discount Offer (Inactivable)
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
