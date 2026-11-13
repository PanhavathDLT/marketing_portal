import { z } from 'zod';

// Standard success envelope — mirrors the mobile app's expected shape
export const successResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    status: z.literal('success'),
    data: dataSchema,
  });

// Standard error envelope
export const errorResponseSchema = z.object({
  status: z.literal('error'),
  error: z.string(),
});

// Paginated response
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    status: z.literal('success'),
    data: z.array(itemSchema),
    meta: z.object({
      total: z.number(),
      page: z.number(),
      limit: z.number(),
    }),
  });
