import { Router, IRouter } from 'express';
import { validate } from '@shared/middleware/validate.middleware.js';
import { createCampaignSchema, updateCampaignSchema } from './campaign.schema.js';
import * as campaignController from './campaign.controller.js';

// Admin routes (mounted at /api/v1/admin/campaigns)
export const adminCampaignRouter: IRouter = Router();

adminCampaignRouter.get('/', campaignController.listCampaigns);
adminCampaignRouter.get('/:id', campaignController.getCampaign);
adminCampaignRouter.post('/', validate(createCampaignSchema), campaignController.createCampaign);
adminCampaignRouter.patch('/:id', validate(updateCampaignSchema), campaignController.updateCampaign);
adminCampaignRouter.delete('/:id', campaignController.deleteCampaign);

// Customer routes (mounted at /api/v1/customer/campaigns)
export const customerCampaignRouter: IRouter = Router();

customerCampaignRouter.get('/', campaignController.listActiveCampaigns);
customerCampaignRouter.get('/:id', campaignController.getCampaign);
