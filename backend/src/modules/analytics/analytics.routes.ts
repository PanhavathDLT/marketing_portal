import { Router, IRouter } from 'express';
import * as analyticsController from './analytics.controller.js';

// Admin only — mounted at /api/v1/admin/analytics
const router: IRouter = Router();

router.get('/overview', analyticsController.getOverview);
router.get('/campaigns/:campaignId', analyticsController.getCampaignStats);
router.get('/check-ins', analyticsController.getCheckInStats);

export default router;
