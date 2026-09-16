import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email().max(320).transform((email) => email.trim().toLowerCase()),
  password: z.string().min(12).max(128),
  displayName: z.string().trim().min(2).max(100),
  role: z.enum(['STORE_OWNER', 'INFLUENCER']),
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
