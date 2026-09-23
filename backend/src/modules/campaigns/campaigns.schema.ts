import { z } from 'zod';

const compensationTypes = ['FIXED', 'BARTER', 'COMMISSION', 'HYBRID', 'PERFORMANCE', 'NEGOTIABLE'] as const;
export const campaignInputSchema = z.object({
  title: z.string().trim().min(3).max(120), brief: z.string().trim().min(20).max(3000), category: z.string().trim().min(2).max(80),
  imageUrl: z.string().min(1).max(4_000_000).refine(v => /^https?:\/\//.test(v) || /^data:image\/(png|jpeg|webp);base64,/.test(v), 'Choose a campaign image.'),
  campaignType: z.string().trim().min(2).max(80), objective: z.string().trim().min(2).max(80), deliverables: z.string().trim().min(2).max(500),
  deliverableDetails: z.record(z.string(), z.number().int().min(0).max(100)).optional(), compensationType: z.enum(compensationTypes),
  compensationDetails: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(), minimumFollowers: z.number().int().nonnegative().optional(), productId: z.string().cuid().nullable().optional(),
  applicationType: z.enum(['OPEN', 'APPROVAL_REQUIRED', 'INVITE_ONLY']).default('OPEN'), budgetMin: z.number().int().nonnegative().optional(), budgetMax: z.number().int().nonnegative().optional(),
  applicationDeadline: z.coerce.date().refine(d => d > new Date(), 'Deadline must be in the future.'), contentDeadline: z.coerce.date().optional(), campaignEndDate: z.coerce.date().optional(),
}).refine(v => !v.budgetMin || !v.budgetMax || v.budgetMax >= v.budgetMin, 'Maximum budget must be at least the minimum budget.');
export const idSchema = z.object({ campaignId: z.string().cuid(), applicationId: z.string().cuid() });
export const applicationSchema = z.object({ pitch: z.string().trim().min(20).max(1500), proposedRate: z.number().int().nonnegative().optional() });
