import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { error } from '@shared/utils/response.js';

type Target = 'body' | 'query' | 'params';

export const validate =
  (schema: ZodSchema, target: Target = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const message = result.error.issues.map((e) => e.message).join(', ');
      error(res, message, 422);
      return;
    }
    req[target] = result.data;
    next();
  };
