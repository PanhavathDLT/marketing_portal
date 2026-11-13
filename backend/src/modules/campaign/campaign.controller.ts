import { Request, Response, NextFunction } from 'express';
import * as campaignService from './campaign.service.js';
import { success } from '@shared/utils/response.js';

export async function listCampaigns(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await campaignService.listCampaigns();
    success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function listActiveCampaigns(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await campaignService.listActiveCampaigns();
    success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getCampaign(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await campaignService.getCampaignById(Number(req.params.id));
    success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function createCampaign(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await campaignService.createCampaign(req.body);
    success(res, data, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateCampaign(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await campaignService.updateCampaign(Number(req.params.id), req.body);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function deleteCampaign(req: Request, res: Response, next: NextFunction) {
  try {
    await campaignService.deleteCampaign(Number(req.params.id));
    success(res, null);
  } catch (err) {
    next(err);
  }
}
