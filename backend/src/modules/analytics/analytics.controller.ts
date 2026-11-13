import { Request, Response, NextFunction } from 'express';
import * as analyticsService from './analytics.service.js';
import { success } from '@shared/utils/response.js';

export async function getOverview(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getOverview();
    success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getCampaignStats(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getCampaignStats(Number(req.params.campaignId));
    success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getCheckInStats(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getCheckInStats();
    success(res, data);
  } catch (err) {
    next(err);
  }
}
