import { z } from 'zod';

export const createMissionSchema = z.object({
  campaignId: z.number().int().positive(),
  type: z.enum(['REFERRAL', 'FIRST_LOAN_APPLICATION', 'FIRST_LOAN_APPROVAL', 'FIRST_REPAYMENT']),
  title: z.string().min(1),
  points: z.number().int().positive(),
  iconUrl: z.string().url().optional(),
});

export const updateMissionSchema = createMissionSchema.omit({ campaignId: true }).partial();

export type CreateMissionInput = z.infer<typeof createMissionSchema>;
export type UpdateMissionInput = z.infer<typeof updateMissionSchema>;
