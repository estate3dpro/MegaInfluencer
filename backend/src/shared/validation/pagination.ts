import { z } from 'zod';

import { AppError } from '../errors/app-error.js';

export const paginationQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new AppError('VALIDATION_ERROR', 'Request validation failed.', 400);
  }

  return result.data;
}

export function toPaginationResponse<T>(items: T[], nextCursor?: string) {
  return { items, nextCursor: nextCursor ?? null };
}
