import { z } from 'zod';

export const createContactInquirySchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address').max(255),
  subject: z.string().trim().min(2, 'Subject must be at least 2 characters').max(200),
  message: z.string().trim().min(5, 'Message must be at least 5 characters').max(5000),
});

export const listContactInquiriesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(['NEW', 'IN_REVIEW', 'RESOLVED', 'ARCHIVED']).optional(),
});

export const updateContactInquirySchema = z.object({
  status: z.enum(['NEW', 'IN_REVIEW', 'RESOLVED', 'ARCHIVED']).optional(),
  adminNotes: z.string().trim().max(2000).nullable().optional(),
});

export const contactInquiryParamsSchema = z.object({
  id: z.string().min(1),
});
