import { Request, Response, NextFunction } from 'express';
import { AppError } from '@shared/errors/AppError.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ status: 'error', error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ status: 'error', error: 'Internal server error' });
}
