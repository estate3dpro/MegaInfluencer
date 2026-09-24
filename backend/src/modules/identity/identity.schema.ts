import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email().max(320).transform((email) => email.trim().toLowerCase()),
  password: z.string().min(12).max(128),
  displayName: z.string().trim().min(2).max(100),
  role: z.enum(['STORE_OWNER', 'INFLUENCER']),
  firstName: z.string().trim().min(1).max(60).optional(),
  lastName: z.string().trim().min(1).max(60).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
}).superRefine((input, context) => {
  if (input.role === 'INFLUENCER' && !input.firstName) {
    context.addIssue({ code: 'custom', path: ['firstName'], message: 'First name is required for influencer registration.' });
  }
  if (input.role === 'INFLUENCER' && !input.lastName) {
    context.addIssue({ code: 'custom', path: ['lastName'], message: 'Last name is required for influencer registration.' });
  }
});

export const loginSchema = z.object({
  email: z.string().email().max(320).transform((email) => email.trim().toLowerCase()),
  password: z.string().min(1).max(128),
});

export const organizationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens.')
    .min(2)
    .max(80)
    .optional(),
});

export const updateOrganizationSchema = organizationSchema.partial().refine(
  (value) => value.name !== undefined || value.slug !== undefined,
  'At least one field must be provided.',
);

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']),
});
