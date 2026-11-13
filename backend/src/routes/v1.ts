import { Router, IRouter } from 'express';
import { authenticate, requireRole } from '@shared/middleware/auth.middleware.js';
import { authRouter } from '@modules/auth/index.js';
import { adminCampaignRouter, customerCampaignRouter } from '@modules/campaign/index.js';
import { adminMissionRouter } from '@modules/mission/index.js';
import { analyticsRouter } from '@modules/analytics/index.js';
import { rewardRouter, referralRouter } from '@modules/reward/index.js';

const router: IRouter = Router();

// ─── Public ───────────────────────────────────────────────────────────────────
router.use('/auth', authRouter);

// ─── Customer ─────────────────────────────────────────────────────────────────
const customer: IRouter = Router();
customer.use(authenticate, requireRole('CUSTOMER'));

customer.use('/campaigns', customerCampaignRouter);
customer.use('/reward', rewardRouter);           // /reward/points, /reward/missions, /reward/store, etc.
customer.use('/referral', referralRouter);       // /referral/my-code, /referral/apply

router.use('/customer', customer);

// ─── Admin ────────────────────────────────────────────────────────────────────
const admin: IRouter = Router();
admin.use(authenticate, requireRole('ADMIN'));

admin.use('/campaigns', adminCampaignRouter);
admin.use('/campaigns/:campaignId/missions', adminMissionRouter);
admin.use('/analytics', analyticsRouter);

router.use('/admin', admin);

export default router;
