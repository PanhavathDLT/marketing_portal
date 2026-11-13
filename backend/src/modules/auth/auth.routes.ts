import { Router, IRouter } from 'express';
import { validate } from '@shared/middleware/validate.middleware.js';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.schema.js';
import * as authController from './auth.controller.js';

const router: IRouter = Router();

// POST /api/v1/auth/register
router.post('/register', validate(registerSchema), authController.register);

// POST /api/v1/auth/login
router.post('/login', validate(loginSchema), authController.login);

// POST /api/v1/auth/refresh
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);

export default router;
