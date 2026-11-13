import { Response } from 'express';

export function success<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({ status: 'success', data });
}

export function error(res: Response, message: string, statusCode = 400): void {
  res.status(statusCode).json({ status: 'error', error: message });
}
