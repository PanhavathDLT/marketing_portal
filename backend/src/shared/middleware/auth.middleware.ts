import { Request, Response, NextFunction } from 'express';
import passport from '@config/passport.js';
import { Role } from '@prisma/client';
import { error } from '@shared/utils/response.js';

export const authenticate = passport.authenticate('jwt', { session: false });

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as { role: Role } | undefined;
    if (!user || !roles.includes(user.role)) {
      error(res, 'Forbidden', 403);
      return;
    }
    next();
  };
