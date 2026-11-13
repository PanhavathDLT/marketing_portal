import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service.js';
import { RegisterInput, LoginInput, RefreshTokenInput } from './auth.schema.js';
import { success } from '@shared/utils/response.js';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.register(req.body as RegisterInput);
    success(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(req.body as LoginInput);
    success(res, result);
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body as RefreshTokenInput;
    const tokens = await authService.refreshTokens(refreshToken);
    success(res, tokens);
  } catch (err) {
    next(err);
  }
}
